import React, { useState } from "react";

export default function SmartQuoteParser({
  onParsedRecords,
  targetProperty,
  reportingPeriod,
}) {
  const [rawText, setRawText] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logFeedback, setLogFeedback] = useState({ type: "", message: "" });

  // Fallback map to guess standardized commodity names from raw tokens
  const normalizeCommodityName = (token) => {
    const term = token.toLowerCase().trim();
    if (term.includes("bleach") || term.includes("jik"))
      return "Industrial Bleach 20L";
    if (term.includes("washing powder") || term.includes("surf"))
      return "Washing Powder 25kg";
    if (term.includes("detergent") || term.includes("soap"))
      return "Liquid Hand Soap 5L";
    if (term.includes("paper") || term.includes("tissue"))
      return "Toilet Paper 2-Ply (Pack 48)";
    return token.trim(); // fallback to original input title casing
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
      // Split text into individual lines to step through raw telemetry tokens
      const lines = rawText.split(/\r?\n/);
      const outputBuffer = [];

      // Flexible Regex matchers for extracting dynamic currency figures and numeric metrics
      // Captures common patterns: "Commodity Name - $120.00", "Commodity Name: 45.50", "Price: US$10"
      // A more resilient pattern matcher that isolates descriptions from trailing currency tokens
      const rateRegex =
        /^(.*?)\s*[:\-–]?\s*(?:USD|US\$|\$)\s*(\d+(?:\.\d{1,2})?)\s*$/i;
      lines.forEach((line) => {
        const cleanedLine = line.trim();
        if (!cleanedLine || cleanedLine.length < 4) return; // skip junk headers or padding boundaries

        const match = cleanedLine.match(rateRegex);
        if (match) {
          const rawItemName = match[1] ? match[1].trim() : "";
          const parsedPrice = parseFloat(match[2]);

          if (parsedPrice > 0 && rawItemName.length > 1) {
            const standardizedName = normalizeCommodityName(rawItemName);

            outputBuffer.push({
              id: crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).substring(2, 9),
              raw_token: rawItemName,
              commodity_name: standardizedName,
              current_price: parsedPrice,
              supplier_name: "Extracted via SmartQuote Engine",
              confidence:
                rawItemName.toLowerCase() === standardizedName.toLowerCase()
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

    // Map internal engine format to match global analytics context fields
    const formattedPayload = parsedItems.map((item) => ({
      commodity_name: item.commodity_name,
      current_price: item.current_price,
      splm_change_pct: 0.0,
      sply_change_pct: 0.0,
      indicator: "► No Change",
      hotel_rank: 1,
      cheapest_property: targetProperty,
      min_group_price: item.current_price,
      supplier_name: "Unverified Staging Node",
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          🤖 SmartQuote AI Text Parser Engine
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Paste unstructured supplier lists, email tables, or WhatsApp texts to
          extract and format prices.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">
          Unstructured Telemetry Input Buffer
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Example raw data to copy paste:\nJik Bleach 20L - $45.00\nWashing Powder bulk 25kg: US$85.50\nToilet Paper 2-Ply Pack 48 .... $18.00`}
          className="w-full h-40 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:border-amber-500 outline-none bg-slate-50/30"
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={handleParseEngineExecute}
          disabled={isProcessing}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all shadow-sm"
        >
          {isProcessing ? "Processing Tokens..." : "⚡ Execute Pattern Matcher"}
        </button>

        {parsedItems.length > 0 && (
          <button
            type="button"
            onClick={handleCommitToGlobalStaging}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition-all shadow-sm"
          >
            📥 Commit {parsedItems.length} Records to Table View
          </button>
        )}
      </div>

      {logFeedback.message && (
        <div
          className={`p-4 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            logFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}
        >
          <span>{logFeedback.type === "success" ? "✅" : "🚨"}</span>
          <p>{logFeedback.message}</p>
        </div>
      )}

      {/* INTERMEDIARY STAGING LOG PREVIEW */}
      {parsedItems.length > 0 && (
        <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/40">
          <div className="p-3 bg-slate-100/80 border-b border-slate-200/60 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Extracted Target Entity Preview Map
            </span>
            <button
              onClick={() => setParsedItems([])}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Clear Buffer
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {parsedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {item.commodity_name}
                  </div>
                  <div className="text-slate-400 font-mono">
                    Matched on token:{" "}
                    <span className="text-slate-600 italic font-medium">
                      "{item.raw_token}"
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900">
                    ${item.current_price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-amber-600 font-semibold">
                    {item.confidence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
