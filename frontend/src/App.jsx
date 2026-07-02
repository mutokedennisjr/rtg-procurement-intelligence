import PoOrderCheck from "./PoOrderCheck";
import GroupPriceMatrix from "./GroupPriceMatrix";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// ========================================================
// INTEGRATED ENGINE COMPONENT: SmartQuoteParser
// ========================================================
function SmartQuoteParser({
  onParsedRecords,
  targetProperty,
  reportingPeriod,
}) {
  const [rawText, setRawText] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logFeedback, setLogFeedback] = useState({ type: "", message: "" });

  const normalizeCommodityName = (token) => {
    const term = token.toLowerCase().trim();
    if (term.includes("bleach") || term.includes("jik"))
      return { name: "Industrial Bleach 20L", uom: "Litres" };
    if (term.includes("washing powder") || term.includes("surf"))
      return { name: "Washing Powder 25kg", uom: "Kg" };
    if (term.includes("detergent") || term.includes("soap"))
      return { name: "Liquid Hand Soap 5L", uom: "Litres" };
    if (term.includes("paper") || term.includes("tissue"))
      return { name: "Toilet Paper 2-Ply (Pack 48)", uom: "Pack" };
    return { name: token.trim(), uom: "Unit" };
  };

  const handleParseEngineExecute = () => {
    if (!rawText.trim()) {
      setLogFeedback({
        type: "error",
        message:
          "Pipeline source text is empty. Supply quote data strings first.",
      });
      return;
    }

    setIsProcessing(true);
    setLogFeedback({ type: "", message: "" });

    try {
      const lines = rawText.split(/\r?\n/);
      const outputBuffer = [];
      const rateRegex =
        /^(.*?)\s*[:\-–]?\s*(?:USD|US\$|\$)\s*(\d+(?:\.\d{1,2})?)\s*$/i;

      lines.forEach((line) => {
        const cleanedLine = line.trim();
        if (cleanedLine.length < 4) return;

        const match = cleanedLine.match(rateRegex);
        if (match) {
          const rawItemName = match[1] ? match[1].trim() : "";
          const parsedPrice = parseFloat(match[2]);

          if (parsedPrice > 0 && rawItemName.length > 1) {
            const structuralMatch = normalizeCommodityName(rawItemName);

            outputBuffer.push({
              id: crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).substring(2, 9),
              raw_token: rawItemName,
              commodity_name: structuralMatch.name,
              uom: structuralMatch.uom,
              current_price: parsedPrice,
              supplier_name: "Extracted via SmartQuote Engine",
              confidence:
                rawItemName.toLowerCase() === structuralMatch.name.toLowerCase()
                  ? "High"
                  : "Matched to Baseline Structure",
            });
          }
        }
      });

      setParsedItems(outputBuffer);

      if (outputBuffer.length > 0) {
        setLogFeedback({
          type: "success",
          message: `Engine successfully isolated ${outputBuffer.length} clean telemetry price vectors.`,
        });
      } else {
        setLogFeedback({
          type: "error",
          message:
            "Failed to cleanly isolate structured entities. Refine raw layout mapping values.",
        });
      }
    } catch (err) {
      console.error(err);
      setLogFeedback({
        type: "error",
        message:
          "Critical engine pipeline crash during token breakdown execution loop.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitToGlobalStaging = () => {
    if (parsedItems.length === 0) return;

    const formattedPayload = parsedItems.map((item) => ({
      commodity_name: item.commodity_name,
      uom: item.uom,
      current_price: item.current_price,
      splm_change_pct: 0.0,
      sply_change_pct: 0.0,
      indicator: "► No Change",
      hotel_rank: 1,
      cheapest_property: targetProperty,
      min_group_price: item.current_price,
      supplier_name: "SmartQuote Parser Engine Staging",
      potential_savings: 0.0,
      reporting_period: `${reportingPeriod}-01`,
    }));

    onParsedRecords(formattedPayload);
    setParsedItems([]);
    setRawText("");
    setLogFeedback({
      type: "success",
      message:
        "Records synchronized and deployed directly to global staging viewports.",
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          🤖 SmartQuote AI Text Parser Engine
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Paste unstructured supplier lists, email tables, or WhatsApp texts to
          extract and format prices directly into the dashboard state.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">
          Unstructured Telemetry Input Buffer
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Example raw data to copy paste:\nJik Bleach 20L - $45.00\nWashing Powder bulk 25kg: US$85.50\nToilet Paper 2-Ply Pack 48 .... $18.00`}
          className="w-full h-32 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-mono text-slate-700 focus:border-[#d92332] outline-none"
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={handleParseEngineExecute}
          disabled={isProcessing}
          className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs"
        >
          {isProcessing ? "Processing Tokens..." : "⚡ Execute Pattern Matcher"}
        </button>

        {parsedItems.length > 0 && (
          <button
            type="button"
            onClick={handleCommitToGlobalStaging}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs"
          >
            📥 Commit {parsedItems.length} Records to Analytics View
          </button>
        )}
      </div>

      {logFeedback.message && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            logFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{logFeedback.type === "success" ? "✅" : "🚨"}</span>
          <p>{logFeedback.message}</p>
        </div>
      )}

      {parsedItems.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <div className="p-2.5 bg-white border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Extracted Target Entity Preview Map
            </span>
            <button
              onClick={() => setParsedItems([])}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Clear Buffer
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
            {parsedItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    {item.commodity_name}{" "}
                    <span className="text-slate-400 font-normal">
                      ({item.uom})
                    </span>
                  </div>
                </div>
                <div className="text-right font-black text-slate-800">
                  ${item.current_price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// CORE APPLICATION CONTAINER COMPONENT
// ========================================================
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [targetProperty, setTargetProperty] = useState(
    "Bulawayo Rainbow Hotel",
  );
  const [reportingPeriod, setReportingPeriod] = useState("2026-06");
  const [searchFilter, setSearchFilter] = useState("");

  const [historicalMatrixRepository, setHistoricalMatrixRepository] = useState({
    "2026-07": [
      {
        commodity: "Beef Meat",
        uom: "Kg",
        RTH: 4.7,
        KHCC: null,
        BRH: 4.61,
        VFRH: 5.26,
        AZRL: null,
        NAH: null,
        MRC: null,
      },
      {
        commodity: "Chicken",
        uom: "Kg",
        RTH: 32.0,
        KHCC: null,
        BRH: 31.36,
        VFRH: 35.84,
        AZRL: null,
        NAH: null,
        MRC: null,
      },
      {
        commodity: "Fresh Milk",
        uom: "Litres",
        RTH: 1.8,
        KHCC: null,
        BRH: 1.76,
        VFRH: 2.02,
        AZRL: null,
        NAH: null,
        MRC: null,
      },
      {
        commodity: "Tomatoes",
        uom: "Bucket",
        RTH: 0.9,
        KHCC: null,
        BRH: 0.88,
        VFRH: 1.01,
        AZRL: null,
        NAH: null,
        MRC: null,
      },
    ],
    "2026-06": [
      {
        commodity: "Beef Meat",
        uom: "Kg",
        RTH: 4.65,
        KHCC: 4.9,
        BRH: 4.55,
        VFRH: 5.1,
        AZRL: 4.85,
        NAH: 4.75,
        MRC: null,
      },
      {
        commodity: "Chicken",
        uom: "Kg",
        RTH: 31.5,
        KHCC: 33.0,
        BRH: 31.0,
        VFRH: 34.5,
        AZRL: 32.0,
        NAH: 31.8,
        MRC: null,
      },
      {
        commodity: "Fresh Milk",
        uom: "Litres",
        RTH: 1.75,
        KHCC: 1.85,
        BRH: 1.7,
        VFRH: 1.95,
        AZRL: 1.8,
        NAH: 1.75,
        MRC: null,
      },
      {
        commodity: "Tomatoes",
        uom: "Bucket",
        RTH: 0.85,
        KHCC: 0.95,
        BRH: 0.82,
        VFRH: 0.98,
        AZRL: 0.9,
        NAH: 0.88,
        MRC: null,
      },
    ],
    "2025-06": [
      {
        commodity: "Beef Meat",
        uom: "Kg",
        RTH: 4.2,
        KHCC: 4.3,
        BRH: 4.1,
        VFRH: 4.5,
        AZRL: 4.4,
        NAH: 4.25,
        MRC: null,
      },
      {
        commodity: "Chicken",
        uom: "Kg",
        RTH: 28.5,
        KHCC: 29.0,
        BRH: 28.0,
        VFRH: 30.5,
        AZRL: 29.0,
        NAH: 28.5,
        MRC: null,
      },
      {
        commodity: "Fresh Milk",
        uom: "Litres",
        RTH: 1.55,
        KHCC: 1.6,
        BRH: 1.5,
        VFRH: 1.7,
        AZRL: 1.65,
        NAH: 1.55,
        MRC: null,
      },
      {
        commodity: "Tomatoes",
        uom: "Bucket",
        RTH: 0.75,
        KHCC: 0.8,
        BRH: 0.7,
        VFRH: 0.85,
        AZRL: 0.78,
        NAH: 0.75,
        MRC: null,
      },
    ],
  });

  const hotelCodeMapping = {
    "The Rainbow Towers Hotel & Conference Centre": "RTH",
    "Kadoma Hotel & Conference Centre": "KHCC",
    "Bulawayo Rainbow Hotel": "BRH",
    "Victoria Falls Rainbow Hotel": "VFRH",
    "A'Zambezi River Lodge": "AZRL",
    "New Ambassador Hotel": "NAH",
    "Montclair Resort & Casino": "MRC",
  };

  const currentMatrixRecords =
    historicalMatrixRepository[reportingPeriod] || [];
  const currentHotelCode = hotelCodeMapping[targetProperty] || "BRH";

  const getPastPeriodKey = (currentKey, monthsAgo) => {
    const [year, month] = currentKey.split("-").map(Number);
    const d = new Date(year, month - 1 - monthsAgo, 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, "0");
    return `${yStr}-${mStr}`;
  };

  const splmPeriodKey = getPastPeriodKey(reportingPeriod, 1);
  const splyPeriodKey = getPastPeriodKey(reportingPeriod, 12);

  // ========================================================
  // COMPREHENSIVE INTELLIGENCE COMPILING PIPELINE
  // ========================================================
  const processedAnalyticsData = currentMatrixRecords.map((row) => {
    const propertyPrice = row[currentHotelCode] || 0;

    const peerRates = Object.entries(hotelCodeMapping)
      .map(([name, code]) => ({
        name,
        code,
        price: row[code],
      }))
      .filter((p) => p.price !== null && p.price !== undefined && p.price > 0);

    const operationalRates = peerRates.map((p) => p.price);
    const minGroupPrice =
      operationalRates.length > 0
        ? Math.min(...operationalRates)
        : propertyPrice;

    const cheapestNodeObj = peerRates.find((p) => p.price === minGroupPrice);
    const cheapestProperty = cheapestNodeObj
      ? cheapestNodeObj.name
      : "Optimal Floor Rate";

    const sortedRates = [...new Set(operationalRates)].sort((a, b) => a - b);
    const hotelRank =
      propertyPrice > 0 ? sortedRates.indexOf(propertyPrice) + 1 : "—";

    const splmRecords = historicalMatrixRepository[splmPeriodKey] || [];
    const splmMatch = splmRecords.find(
      (r) => r.commodity.toLowerCase() === row.commodity.toLowerCase(),
    );
    const splmPrice = splmMatch ? splmMatch[currentHotelCode] || 0 : 0;

    let splm_change_pct = 0;
    let indicator = "► No Change";
    if (splmPrice > 0 && propertyPrice > 0) {
      splm_change_pct = ((propertyPrice - splmPrice) / splmPrice) * 100;
      if (splm_change_pct > 0.1) indicator = "▲ Increase";
      if (splm_change_pct < -0.1) indicator = "▼ Decrease";
    }

    const splyRecords = historicalMatrixRepository[splyPeriodKey] || [];
    const splyMatch = splyRecords.find(
      (r) => r.commodity.toLowerCase() === row.commodity.toLowerCase(),
    );
    const splyPrice = splyMatch ? splyMatch[currentHotelCode] || 0 : 0;
    const sply_change_pct =
      splyPrice > 0 && propertyPrice > 0
        ? ((propertyPrice - splyPrice) / splyPrice) * 100
        : 0;

    const varianceLeakage =
      propertyPrice > minGroupPrice ? (propertyPrice - minGroupPrice) * 100 : 0;

    return {
      commodity_name: row.commodity,
      uom: row.uom,
      current_price: propertyPrice,
      splm_change_pct,
      sply_change_pct,
      indicator,
      hotel_rank: hotelRank,
      cheapest_property: cheapestProperty,
      min_group_price: minGroupPrice,
      potential_savings: varianceLeakage,
      isAnomalous:
        minGroupPrice > 0
          ? ((propertyPrice - minGroupPrice) / minGroupPrice) * 100 > 15
          : false,
    };
  });

  // Filter records based on active target criteria match
  const filteredAnalyticsData = processedAnalyticsData.filter((item) =>
    item.commodity_name.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const totalMonitoredItems = processedAnalyticsData.length;
  const aggregateTrackedSavings = processedAnalyticsData.reduce(
    (acc, row) => acc + row.potential_savings,
    0,
  );
  const structuralAnomaliesCount = processedAnalyticsData.filter(
    (row) => row.isAnomalous,
  ).length;

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: "", message: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCommodityName, setFormCommodityName] = useState("");
  const [formUom, setFormUom] = useState("Kg");
  const [formCurrentPrice, setFormCurrentPrice] = useState("");

  const handleMergeParsedRecords = (newRecords) => {
    setHistoricalMatrixRepository((prev) => {
      const updatedPeriodRecords = [...(prev[reportingPeriod] || [])];
      newRecords.forEach((rec) => {
        const idx = updatedPeriodRecords.findIndex(
          (m) => m.commodity.toLowerCase() === rec.commodity_name.toLowerCase(),
        );
        if (idx !== -1) {
          updatedPeriodRecords[idx][currentHotelCode] = rec.current_price;
        } else {
          updatedPeriodRecords.push({
            commodity: rec.commodity_name,
            uom: rec.uom || "Kg",
            RTH: null,
            KHCC: null,
            BRH: null,
            VFRH: null,
            AZRL: null,
            NAH: null,
            MRC: null,
            [currentHotelCode]: rec.current_price,
          });
        }
      });
      return { ...prev, [reportingPeriod]: updatedPeriodRecords };
    });
  };

  const handleFileUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws =
          wb.Sheets[
            wb.Sheets[wb.SheetNames[0]] ? wb.SheetNames[0] : wb.SheetNames[0]
          ];
        const importedJson = XLSX.utils.sheet_to_json(ws);

        setHistoricalMatrixRepository((prev) => {
          const activeMonthRecords = [...(prev[reportingPeriod] || [])];
          importedJson.forEach((excelRow) => {
            const name =
              excelRow.commodity_name ||
              excelRow.Commodity ||
              excelRow["Commodity Item"];
            const uom = excelRow.unit || excelRow.UOM || "Kg";
            const price = parseFloat(
              excelRow.unit_price || excelRow.Price || excelRow["Active Rate"],
            );

            if (!name || isNaN(price)) return;
            const idx = activeMonthRecords.findIndex(
              (item) => item.commodity.toLowerCase() === name.toLowerCase(),
            );

            if (idx !== -1) {
              activeMonthRecords[idx][currentHotelCode] = price;
            } else {
              activeMonthRecords.push({
                commodity: name,
                uom,
                RTH: null,
                KHCC: null,
                BRH: null,
                VFRH: null,
                AZRL: null,
                NAH: null,
                MRC: null,
                [currentHotelCode]: price,
              });
            }
          });
          return { ...prev, [reportingPeriod]: activeMonthRecords };
        });
        setUploadStatus({
          type: "success",
          message: "Data successfully synchronized!",
        });
        setUploadFile(null);
      } catch (err) {
        setUploadStatus({
          type: "error",
          message: "Failed parsing dataset structure.",
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(uploadFile);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-700 selection:bg-[#d92332]/10">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-200 shrink-0 text-slate-300">
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <h1 className="text-xl font-black text-white tracking-wider uppercase">
            RTG Procurement
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Intelligence Matrix Portal
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "overview"
                ? "bg-[#d92332] text-white shadow-md shadow-[#d92332]/20"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            📊 Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "matrix"
                ? "bg-[#d92332] text-white shadow-md shadow-[#d92332]/20"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            🏁 Group Price Matrix
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === "upload"
                ? "bg-[#d92332] text-white shadow-md shadow-[#d92332]/20"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            📥 Import Data Layer
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-center">
          v1.0.0 • RTG Core Network
        </div>
      </aside>

      {/* WORKSPACE VIEWPORT */}
      <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
        {/* GLOBAL HEADER BAR WITH GENERAL CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Procurement Intelligence Center
            </h2>
            <p className="text-xs text-slate-500">
              Track dynamic monthly baseline movements and vendor pricing
              behaviors.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={targetProperty}
              onChange={(e) => setTargetProperty(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-[#d92332] outline-none"
            >
              {Object.keys(hotelCodeMapping).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#d92332] outline-none"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#d92332] text-white hover:bg-[#b81d2a] text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-xs"
            >
              + Add New Record
            </button>
          </div>
        </div>

        {/* VIEW 1: ANALYTICS OVERVIEW VIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Leakage / Tracked Savings
                </span>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  ${aggregateTrackedSavings.toFixed(2)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Variance against internal optimal floor rates
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monitored Items
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {totalMonitoredItems} Commodities
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active ledger matrix instances tracked
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Critical Anomalies
                </span>
                <h3 className="text-2xl font-black text-red-600 mt-1">
                  {structuralAnomaliesCount} Flagged
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Items exceeding 15% inflation variance
                </p>
              </div>
            </div>

            {/* LIVE DYNAMIC SEARCH FILTER CONTROL ROW */}
            <div className="w-full max-w-md">
              <input
                type="text"
                placeholder="🔍 Filter commodities by title phrase..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-4 py-2 text-xs border border-slate-200 bg-white rounded-lg outline-none focus:border-[#d92332] font-medium"
              />
            </div>

            {/* TIME-SERIES COMPARATIVE INTELLIGENCE VIEWPORT */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600">
                Detailed Procurement Performance Metrics Matrix (
                {reportingPeriod})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5">Commodity</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5 text-center">Trend Indicator</th>
                      <th className="p-3.5 text-center">SPLM Change</th>
                      <th className="p-3.5 text-center">SPLY Change</th>
                      <th className="p-3.5 text-center">Group Rank</th>
                      <th className="p-3.5">Cheapest Property Node</th>
                      <th className="p-3.5 text-right text-emerald-600">
                        Leakage Variance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAnalyticsData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="p-8 text-center text-slate-400 font-mono text-xs"
                        >
                          No metrics calculated. Fill data layers or modify
                          filter query.
                        </td>
                      </tr>
                    ) : (
                      filteredAnalyticsData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3.5 font-bold text-slate-900">
                            {item.commodity_name}{" "}
                            <span className="text-slate-400 font-normal">
                              ({item.uom})
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold">
                            {item.current_price > 0 ? (
                              `$${item.current_price.toFixed(2)}`
                            ) : (
                              <span className="text-slate-300 font-normal">
                                — (Not Added)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span
                              className={
                                item.indicator.includes("Increase")
                                  ? "text-rose-600"
                                  : item.indicator.includes("Decrease")
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                              }
                            >
                              {item.indicator.includes("Increase")
                                ? "▲"
                                : item.indicator.includes("Decrease")
                                  ? "▼"
                                  : "►"}{" "}
                              {item.indicator.split(" ")[1] || "Stable"}
                            </span>
                          </td>
                          <td
                            className={`p-3.5 text-center font-mono ${item.splm_change_pct > 0 ? "text-rose-600" : item.splm_change_pct < 0 ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {item.splm_change_pct === 0
                              ? "0.0%"
                              : `${item.splm_change_pct > 0 ? "+" : ""}${item.splm_change_pct.toFixed(1)}%`}
                          </td>
                          <td
                            className={`p-3.5 text-center font-mono ${item.sply_change_pct > 0 ? "text-rose-600" : item.sply_change_pct < 0 ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {item.sply_change_pct === 0
                              ? "—"
                              : `${item.sply_change_pct > 0 ? "+" : ""}${item.sply_change_pct.toFixed(1)}%`}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              Rank #{item.hotel_rank}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-[180px] truncate">
                            {item.cheapest_property}{" "}
                            <span className="text-slate-400 font-mono font-bold">
                              (${item.min_group_price.toFixed(2)})
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-rose-600 bg-rose-500/[0.02]">
                            {item.potential_savings > 0 ? (
                              `$${item.potential_savings.toFixed(2)}`
                            ) : (
                              <span className="text-emerald-600">
                                Optimum Floor
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <SmartQuoteParser
              targetProperty={targetProperty}
              reportingPeriod={reportingPeriod}
              onParsedRecords={handleMergeParsedRecords}
            />
          </div>
        )}

        {activeTab === "matrix" && (
          <GroupPriceMatrix
            reportingPeriod={reportingPeriod}
            setReportingPeriod={setReportingPeriod}
            currentMatrixRecords={currentMatrixRecords}
          />
        )}

        {/* VIEW 3: DATA IMPORT LAYER WITH LIVE STREAM GRID VIEW */}
        {activeTab === "upload" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                  📥 Regional Spreadsheet Intake Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload files generated by hotel nodes to cross-reference
                  prices.
                </p>
              </div>
              <form onSubmit={handleFileUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={targetProperty}
                    onChange={(e) => setTargetProperty(e.target.value)}
                    className="text-xs font-bold p-2 bg-slate-50 border rounded-lg focus:outline-none"
                  >
                    {Object.keys(hotelCodeMapping).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="month"
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                    className="text-xs font-bold p-2 bg-slate-50 border rounded-lg focus:outline-none"
                  />
                </div>
                <div className="border-2 border-dashed rounded-xl p-8 text-center bg-slate-50 relative border-slate-200 hover:border-slate-300 transition-colors">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <p className="text-sm font-bold text-slate-700">
                    {uploadFile
                      ? uploadFile.name
                      : "Choose CSV or Excel sheets"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports columns: Commodity Item, UOM, Active Rate
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="w-full bg-[#d92332] hover:bg-[#b81d2a] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-lg uppercase transition-all"
                >
                  {isUploading
                    ? "Importing Buffer Sheets..."
                    : "Verify and Import Dataset"}
                </button>
              </form>

              {uploadStatus.message && (
                <div
                  className={`p-3 rounded-lg border text-xs font-semibold ${uploadStatus.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}
                >
                  {uploadStatus.type === "success" ? "✅ " : "🚨 "}
                  {uploadStatus.message}
                </div>
              )}
            </div>

            {/* RE-COMPOSABLE COMMODITIES INGESTION DATAGRID TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600 flex justify-between items-center">
                <span>
                  Active Import Store Ledger ({targetProperty} —{" "}
                  {reportingPeriod})
                </span>
                <span className="bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded text-[10px]">
                  {
                    currentMatrixRecords.filter(
                      (r) =>
                        r[currentHotelCode] !== null &&
                        r[currentHotelCode] !== undefined,
                    ).length
                  }{" "}
                  Saved Row Blocks
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5">Commodity Name Node</th>
                      <th className="p-3.5">UOM Metric</th>
                      <th className="p-3.5">Target Station Assignment</th>
                      <th className="p-3.5 text-right px-6">
                        Current Local Unit Rate ($)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {currentMatrixRecords.filter(
                      (r) =>
                        r[currentHotelCode] !== null &&
                        r[currentHotelCode] !== undefined,
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-8 text-center text-slate-400 font-mono text-xs"
                        >
                          No local table mappings written for this specific
                          partition block. Paste or drag Excel sheets above.
                        </td>
                      </tr>
                    ) : (
                      currentMatrixRecords
                        .filter(
                          (row) =>
                            row[currentHotelCode] !== null &&
                            row[currentHotelCode] !== undefined,
                        )
                        .map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-3.5 font-bold text-slate-900">
                              {row.commodity}
                            </td>
                            <td className="p-3.5">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                                {row.uom || "Unit"}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 font-semibold">
                              {targetProperty} ({currentHotelCode})
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-900 px-6">
                              ${Number(row[currentHotelCode]).toFixed(2)}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MANUAL LEDGER ROW ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b font-bold text-xs uppercase flex justify-between items-center text-slate-700">
              <span>Append Matrix Intersect Data Layer</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formCommodityName || !formCurrentPrice) return;

                setHistoricalMatrixRepository((prev) => {
                  const updated = [...(prev[reportingPeriod] || [])];
                  const idx = updated.findIndex(
                    (i) =>
                      i.commodity.toLowerCase() ===
                      formCommodityName.toLowerCase(),
                  );
                  const targetPriceNum = parseFloat(formCurrentPrice);

                  if (idx !== -1) {
                    updated[idx][currentHotelCode] = targetPriceNum;
                  } else {
                    updated.push({
                      commodity: formCommodityName.trim(),
                      uom: formUom,
                      RTH: null,
                      KHCC: null,
                      BRH: null,
                      VFRH: null,
                      AZRL: null,
                      NAH: null,
                      MRC: null,
                      [currentHotelCode]: targetPriceNum,
                    });
                  }
                  return { ...prev, [reportingPeriod]: updated };
                });

                setFormCommodityName("");
                setFormCurrentPrice("");
                setIsModalOpen(false);
              }}
              className="p-4 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Commodity Name Structure
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Bleach 20L"
                  value={formCommodityName}
                  onChange={(e) => setFormCommodityName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-[#d92332]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    UOM Flag
                  </label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-white rounded-lg outline-none focus:border-[#d92332]"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Litres">Litres</option>
                    <option value="Bucket">Bucket</option>
                    <option value="Pack">Pack</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    Unit Baseline Rate ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-[#d92332] font-mono font-bold"
                  />
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-medium">
                Target Pipeline Destination:{" "}
                <span className="font-bold text-slate-700">
                  {targetProperty} ({reportingPeriod})
                </span>
              </div>
              <button
                type="submit"
                className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white font-bold py-2.5 rounded-lg uppercase tracking-wider transition-colors shadow-xs"
              >
                Apply Layer Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
