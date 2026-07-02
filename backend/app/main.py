import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel, Field
from typing import List, Optional

# --- APPLICATION INITIALIZATION ---

app = FastAPI(
    title="RTG Procurement Intelligence API",
    description="Automated system matrix managing commodity price metrics, historical deltas, and multi-property leakage trackers.",
    version="1.0.0"
)

# Configure CORS so your React frontend can seamlessly communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, swap to specific domains like ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SUPABASE DATABASE CONNECTIVITY LAYER ---

SUPABASE_URL = "https://rausnqsnfqjgvsotqhkq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdXNucXNuZnFqZ3Zzb3RxaGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MjUzODQsImV4cCI6MjA5ODMwMTM4NH0.Mkc8Zs8RZiOjMTx_Al-Vrtab4WN7eMnPiwm4mFoJgXw"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing fatal infrastructure access credentials keys.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# --- DATA VALDIATION & RESPONSE SCHEMAS (Pydantic) ---

class PriceAnalysisRow(BaseModel):
    id: str
    hotel_id: str
    hotel_code: str
    hotel_name: str
    reporting_period: str
    commodity_name: str
    uom: str = Field(..., alias="uom")
    current_unit_price: float
    quantity_purchased: float
    supplier_name: str
    splm_unit_price: Optional[float] = None
    splm_change_pct: float = 0.00
    sply_unit_price: Optional[float] = None
    sply_change_pct: float = 0.00
    min_group_price: float
    hotel_group_rank: int
    potential_savings_leakage: float
    price_movement_indicator: str
    cheapest_group_property_code: Optional[str] = None

    class Config:
        populate_by_name = True


# --- ROUTE HANDLERS ---

@app.get("/", tags=["System Health"])
def root():
    return {
        "status": "online", 
        "message": "RTG Procurement Engine running smoothly with Supabase API Integration."
    }


@app.post("/api/v1/procurement/upload-template/{hotel_id}", status_code=status.HTTP_201_CREATED, tags=["Data Ingestion Pipeline"])
async def upload_procurement_file(
    hotel_id: str, 
    reporting_period: str, # Expected Format: "YYYY-MM"
    file: UploadFile = File(...)
):
    """
    Accepts raw commodity spreadsheets, ensures schema compliance, resolves data drops,
    standardizes text attributes, and commits records safely into the ledger.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The submitted document stream is empty.")
    
    try:
        # 1. Parse incoming document layout formats cleanly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, 
                detail="Unsupported file format extension. Please upload an explicit Excel or CSV file."
            )
        
        # Normalize structural text to catch casing issues from user file templates
        df.columns = [str(col).strip().lower() for col in df.columns]

        # 2. Match structural column expectations against your real database fields
        required_columns = ['commodity_name', 'uom', 'supplier_name', 'unit_price', 'quantity_purchased']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid template format. Header row must exactly provide: {required_columns}"
            )

        # --- DATA CLEANING LAYER ---
        df.dropna(subset=['commodity_name', 'quantity_purchased', 'unit_price'], inplace=True)
        df.drop_duplicates(subset=['commodity_name'], keep='first', inplace=True)

        # 3. Standardize properties and map data models into clean relational rows
        staging_records = []
        # Enforce PostgreSQL DATE string normalization boundaries (YYYY-MM-01)
        formatted_period = f"{reporting_period}-01" if len(reporting_period) == 7 else reporting_period

        for _, row in df.iterrows():
            record = {
                "hotel_id": hotel_id,
                "reporting_period": formatted_period,
                "commodity_name": str(row['commodity_name']).strip().title(), 
                "uom": str(row['uom']).strip().title(),                                     
                "supplier_name": str(row['supplier_name']).strip().title(),
                "unit_price": float(row['unit_price']),
                "quantity_purchased": float(row['quantity_purchased'])
            }
            staging_records.append(record)

        if not staging_records:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid data rows isolated after data cleaning procedures.")

        # 4. Perform an atomic batch write directly into your core historical procurement ledger table
        response = supabase.table("fact_procurement_ledger").insert(staging_records).execute()
        
        return {
            "status": "Success",
            "message": f"Successfully validated, standardized, and committed {len(staging_records)} commodity rows to the data core ledger.",
            "preview": response.data[:2]
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Pipeline failure during spreadsheet calculations parsing: {str(e)}"
        )


@app.get("/api/v1/procurement/analytics/summary", response_model=List[PriceAnalysisRow], tags=["Procurement Analytics"])
def get_procurement_summary(reporting_period: str, hotel_id: Optional[str] = None):
    """
    Queries your live view matrix inside Supabase to yield dynamic pricing deltas,
    MoM/YoY variances, hotel group ranks, indicators, and market floor metrics.
    """
    try:
        # Enforce PostgreSQL date string normalization (YYYY-MM-01)
        formatted_period = f"{reporting_period}-01" if len(reporting_period) == 7 else reporting_period

        # Pull computational updates straight from your database view layer
        query = supabase.table("view_procurement_intelligence_matrix").select("*").eq("reporting_period", formatted_period)
        
        if hotel_id is not None:
            query = query.eq("hotel_id", hotel_id)

        response = query.execute()
        return response.data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to calculate analytical engine metrics frames: {str(e)}"
        )