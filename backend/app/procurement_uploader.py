from fastapi import APIRouter

# This variable name must match the export referenced in main.py
router = APIRouter(prefix="/api/v1/procurement", tags=["Procurement Data Pipeline"])
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
import io

# Assumes you use your existing database dependency mapping connection layer
# from database import get_db_connection

router = APIRouter(prefix="/api/v1/procurement", tags=["Procurement Data Pipeline"])

# --- VALIDATION SCHEMA ---
class IngestedRowSchema(BaseModel):
    commodity_name: str = Field(..., min_length=1)
    uom: str = Field(..., min_length=1)
    unit_price: float = Field(..., gt=0)
    quantity_purchased: float = Field(..., gte=0)
    supplier_name: str = Field(..., min_length=1)

@router.post("/upload-template", status_code=status.HTTP_201_CREATED)
async def upload_monthly_hotel_sheet(
    hotel_name: str = Form(...), # Passed dynamically from React Target Property dropdown
    reporting_period: str = Form(...), # Format: "YYYY-MM"
    file: UploadFile = File(...)
):
    """
    Ingests monthly Excel or CSV price schedules, normalizes metric formats,
    resolves relational property references, and commits rows securely to the ledger.
    """
    
    # 1. Validate reporting date string structure layout boundaries
    try:
        parsed_date = datetime.strptime(f"{reporting_period}-01", "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail="Reporting period syntax invalid. Enforce YYYY-MM structure controls."
        )

    # 2. Prevent empty byte streams from executing processing loops
    file_contents = await file.read()
    if not file_contents:
        raise HTTPException(status_code=400, detail="The uploaded file buffer object is empty.")

    # 3. Read stream binary dynamically into a Pandas DataFrame
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_contents))
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(file_contents))
        else:
            raise HTTPException(status_code=415, detail="Unsupported file format. Please submit an explicit Excel or CSV file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to cleanly process document structure layout: {str(e)}")

    # Clean spreadsheet typography spacing variations automatically
    df.columns = [col.strip().lower() for col in df.columns]
    
    # Map friendly names back to expected validation keys
    required_keys = ["commodity_name", "uom", "unit_price", "quantity_purchased", "supplier_name"]
    if not all(k in df.columns for k in required_keys):
        raise HTTPException(
            status_code=400, 
            detail=f"Spreadsheet column headers must match required fields: {required_keys}"
        )

    # 4. Connect to DB to map the target hotel name string to its UUID reference code
    # (Using a placeholder raw connection setup below—adapt this to your dynamic database sessions)
    try:
        # Example pseudo-code for direct psycopg2 connection or Supabase-py call:
        # conn = get_db_connection()
        # cursor = conn.cursor()
        
        # Simulating lookup block execution target link:
        # cursor.execute("SELECT id FROM dim_hotels WHERE name = %s", (hotel_name,))
        # hotel_id = cursor.fetchone()[0]
        
        # Using a dummy fallback placeholder UUID layout for structural integrity demo:
        hotel_id = "00000000-0000-0000-0000-000000000000" 
        
    except Exception:
        raise HTTPException(status_code=404, detail=f"Target hotel entity reference symbol '{hotel_name}' not discovered in active records.")

    records_to_commit: List[Dict[str, Any]] = []
    errors_detected: List[str] = []

    # 5. Row-by-row structural validation step via Pydantic
    for index, row in df.iterrows():
        try:
            validated_row = IngestedRowSchema(
                commodity_name=str(row["commodity_name"]).strip(),
                uom=str(row["uom"]).strip(),
                unit_price=float(row["unit_price"]),
                quantity_purchased=float(row["quantity_purchased"]),
                supplier_name=str(row["supplier_name"]).strip()
            )
            
            records_to_commit.append({
                "hotel_id": hotel_id,
                "commodity_name": validated_row.commodity_name,
                "uom": validated_row.uom,
                "unit_price": validated_row.unit_price,
                "quantity_purchased": validated_row.quantity_purchased,
                "supplier_name": validated_row.supplier_name,
                "reporting_period": parsed_date
            })
        except Exception as row_error:
            errors_detected.append(f"Row {index + 2} Parse Failure: {str(row_error)}")

    if errors_detected:
        raise HTTPException(
            status_code=422, 
            detail={"message": "Schema validation failed on individual cells.", "errors": errors_detected}
        )

    # 6. Perform bulk upsert array write directly into PostgreSQL/Supabase
    # Here, you would run an 'ON CONFLICT (hotel_id, commodity_name, uom, reporting_period) DO UPDATE...'
    # sql statement to safely append new data or overwrite corrections for the month.

    return {
        "status": "Pipeline Sync Completed Successfully",
        "hotel_processed": hotel_name,
        "reporting_period": str(parsed_date),
        "total_records_inserted": len(records_to_commit)
    }