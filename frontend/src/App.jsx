import PoOrderCheck from "./PoOrderCheck";
import GroupPriceMatrix from "./GroupPriceMatrix";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import logo from "./logo.jpg";

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
      // Cleaned up regex handles optional spacing and decimals perfectly
      const rateRegex =
        /^(.*?)\s*[:\-–]?\s*(?:USD|US\s*\$|\$)\s*(\d+(?:\.\d{1,2})?)\s*$/i;
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
          {isProcessing
            ? "Processing Tokens..."
            : " ⚡  Execute Pattern Matcher"}
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
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${logFeedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}
        >
          <span>{logFeedback.type === "success" ? " ✅ " : " 🚨 "}</span>
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
  // Replace: const [reportingPeriod, setReportingPeriod] = useState("2026-06");
  // With this:
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("06");

  // Compute the reporting period string dynamically so the rest of your system functions smoothly
  const reportingPeriod = `${selectedYear}-${selectedMonth}`;
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
      propertyPrice > minGroupPrice ? propertyPrice - minGroupPrice : 0;

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
        const ws = wb.Sheets[wb.SheetNames[0]];
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
          message: "Data layers successfully merged with group pricing matrix!",
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
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex flex-col items-center text-center">
          {/* ===== LOGO INSERTION START ===== */}
          <div className="mb-3 bg-white p-2 rounded-lg shadow-sm w-full flex justify-center">
            <img
              src={logo}
              alt="RTG Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          {/* ===== LOGO INSERTION END ===== */}

          <h1 className="text-xl font-black text-white tracking-wider uppercase">
            RTG Procurement
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Intelligence Matrix Portal
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {/* ... remaining nav buttons stay exactly the same ... */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${activeTab === "overview" ? "bg-[#d92332] text-white shadow-md shadow-[#d92332]/20" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}
          >
            📊 Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${activeTab === "matrix" ? "bg-[#d92332] text-white shadow-md shadow-[#d92332]/20" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}
          >
            🔲 Sourcing Grid Matrix
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${activeTab === "import" ? "bg-[#d92332] text-white shadow-md shadow-[#d92332]/20" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}
          >
            📥 Import Data Layer
          </button>
        </nav>
      </aside>

      {/* MAIN CONTAINER CONTENT VIEW */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* GLOBAL HEADER CONFIGURATORS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Active Strategy Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Period context filters automatically adapt grid dependencies
              dynamically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Target Control Property
              </label>
              <select
                value={targetProperty}
                onChange={(e) => setTargetProperty(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 font-semibold outline-none focus:border-[#d92332]"
              >
                {Object.keys(hotelCodeMapping).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Reporting Period
              </label>
              <div className="flex items-center gap-2">
                {/* 1. YEAR SELECTOR (ALL OPTIONS LIVE INSIDE) */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 font-semibold font-mono outline-none focus:border-[#d92332]"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                  <option value="2031">2031</option>
                  <option value="2032">2032</option>
                  <option value="2033">2033</option>
                  <option value="2034">2034</option>
                  <option value="2035">2035</option>
                  <option value="2036">2036</option>
                  <option value="2037">2037</option>
                  <option value="2038">2038</option>
                  <option value="2039">2039</option>
                  <option value="2040">2040</option>
                  <option value="2041">2041</option>
                  <option value="2042">2042</option>
                  <option value="2043">2043</option>
                  <option value="2044">2044</option>
                  <option value="2045">2045</option>
                  <option value="2046">2046</option>
                  <option value="2047">2047</option>
                  <option value="2048">2048</option>
                  <option value="2049">2049</option>
                  <option value="2050">2050</option>
                </select>

                {/* 2. MONTH SELECTOR */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 font-semibold font-mono outline-none focus:border-[#d92332]"
                >
                  <option value="01">January (01)</option>
                  <option value="02">February (02)</option>
                  <option value="03">March (03)</option>
                  <option value="04">April (04)</option>
                  <option value="05">May (05)</option>
                  <option value="06">June (06)</option>
                  <option value="07">July (07)</option>
                  <option value="08">August (08)</option>
                  <option value="09">September (09)</option>
                  <option value="10">October (10)</option>
                  <option value="11">November (11)</option>
                  <option value="12">December (12)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TAB TARGETING CONDITIONAL ROUTER */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPIS WIDGETS LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">
                    Monitored Vectors
                  </p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {totalMonitoredItems}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg">
                  📦
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">
                    Group Price Anomalies
                  </p>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {structuralAnomaliesCount}
                  </p>
                </div>
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center text-lg">
                  🚨
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">
                    Variance Floor Leakage
                  </p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    ${aggregateTrackedSavings.toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-lg">
                  💵
                </div>
              </div>
            </div>

            {/* MAIN ANALYTICS DATA STAGING VIEW */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <h3 className="font-bold text-sm text-slate-800">
                  Target Analytics Pipeline Staging ({targetProperty})
                </h3>
                <input
                  type="text"
                  placeholder="Filter tracked records..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-1.5 outline-none focus:border-[#d92332] w-64 font-medium"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="p-4">Commodity Item</th>
                      <th className="p-4">UOM</th>
                      <th className="p-4">Active Rate</th>
                      <th className="p-4">MoM Delta</th>
                      <th className="p-4">Cheapest Node Group Price</th>
                      <th className="p-4">Rank No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {filteredAnalyticsData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-slate-400 font-medium"
                        >
                          No operational pricing telemetry synced for this
                          configuration.
                        </td>
                      </tr>
                    ) : (
                      filteredAnalyticsData.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4 font-bold text-slate-800">
                            {row.commodity_name}
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                              {row.uom}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-900">
                            ${row.current_price.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${row.splm_change_pct > 0 ? "text-rose-600" : row.splm_change_pct < 0 ? "text-emerald-600" : "text-slate-400"}`}
                            >
                              {row.indicator} ({row.splm_change_pct.toFixed(1)}
                              %)
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            <span className="font-semibold text-slate-800">
                              ${row.min_group_price.toFixed(2)}
                            </span>{" "}
                            ({row.cheapest_property})
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded font-black ${row.hotel_rank === 1 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                            >
                              {row.hotel_rank}
                            </span>
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

        {activeTab === "matrix" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-bold text-sm text-slate-800">
                Optimum Pricing Sourcing Grid Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Global visualization mapping structured vectors directly across
                all properties.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold tracking-wider uppercase text-center">
                    <th className="p-3 text-left">Commodity Structure</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3">RTH</th>
                    <th className="p-3">KHCC</th>
                    <th className="p-3">BRH</th>
                    <th className="p-3">VFRH</th>
                    <th className="p-3">AZRL</th>
                    <th className="p-3 bg-slate-700">NAH (New)</th>
                    <th className="p-3 bg-slate-700">MRC (New)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-center font-mono font-semibold text-slate-700">
                  {currentMatrixRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="p-8 text-center font-sans text-slate-400 font-medium"
                      >
                        No grid arrays mapped for this period. Please load
                        telemetry data layers.
                      </td>
                    </tr>
                  ) : (
                    currentMatrixRecords.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3 text-left font-sans font-bold text-slate-900">
                          {item.commodity}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-sans text-[11px] font-bold">
                            {item.uom}
                          </span>
                        </td>
                        <td className="p-3 text-slate-800">
                          {item.RTH ? `$${Number(item.RTH).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 text-slate-800">
                          {item.KHCC ? `$${Number(item.KHCC).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 text-slate-800">
                          {item.BRH ? `$${Number(item.BRH).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 text-slate-800">
                          {item.VFRH ? `$${Number(item.VFRH).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 text-slate-800">
                          {item.AZRL ? `$${Number(item.AZRL).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 bg-slate-50 text-indigo-700 font-bold">
                          {item.NAH ? `$${Number(item.NAH).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 bg-slate-50 text-indigo-700 font-bold">
                          {item.MRC ? `$${Number(item.MRC).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "import" && (
          <div className="grid grid-cols-1 gap-6">
            {/* EXCEL INGESTION DATA LAYER MODULE */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  📂 Batch Excel Data Layer Ingestion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload vendor quotation vectors (.xlsx) to append columns
                  directly into the active matrix profile.
                </p>
              </div>
              <form
                onSubmit={handleFileUploadSubmit}
                className="flex items-center gap-3 border border-dashed border-slate-200 p-4 bg-slate-50/50 rounded-xl"
              >
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="text-xs font-semibold file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 file:cursor-pointer text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="bg-[#d92332] hover:bg-[#b81d29] disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs"
                >
                  {isUploading ? "Syncing..." : "📥 Synchronize Matrix"}
                </button>
              </form>
              {uploadStatus.message && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${uploadStatus.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"}`}
                >
                  {uploadStatus.type === "success" ? "✅ " : "🚨 "}
                  {uploadStatus.message}
                </div>
              )}
            </div>

            {/* AI TEXT PARSER BUFFER COMPONENT */}
            <SmartQuoteParser
              targetProperty={targetProperty}
              reportingPeriod={reportingPeriod}
              onParsedRecords={handleMergeParsedRecords}
            />
          </div>
        )}
      </main>
    </div>
  );
}
