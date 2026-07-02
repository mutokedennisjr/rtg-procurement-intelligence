import React, { useState, useEffect } from "react";

export default function PoOrderCheck({ reportingPeriod }) {
  const [matrixData, setMatrixData] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [orderVolume, setOrderVolume] = useState(100);
  const [targetHotel, setTargetHotel] = useState("1"); // Defaulting to an RTG Node ID

  // Dynamic lookup state matching the selected row
  const [matchedRow, setMatchedRow] = useState(null);

  useEffect(() => {
    fetch(
      `http://127.0.0.1:8000/api/analytics/summary?reporting_period=${reportingPeriod}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setMatrixData(data);
        if (data.length > 0) {
          setSelectedCommodity(data[0].commodity_name);
        }
      })
      .catch((err) =>
        console.error("Error fetching items for PO auditing:", err),
      );
  }, [reportingPeriod]);

  // Track selection mutations to compute live floor rate comparisons
  useEffect(() => {
    if (selectedCommodity) {
      const match = matrixData.find(
        (item) => item.commodity_name === selectedCommodity,
      );
      setMatchedRow(match || null);
    }
  }, [selectedCommodity, matrixData]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-amber-950/20 border border-amber-500/20 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold uppercase tracking-wide text-amber-600">
          Verify Purchasing Order Viability
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time Inter-Property Cost Protection and compliance check against
          live contract floors.
        </p>
      </div>

      {/* COMPONENT INTERACTION CONTROLS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
            Property Issuing Order
          </label>
          <select
            value={targetHotel}
            onChange={(e) => setTargetHotel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 outline-none focus:border-amber-500"
          >
            <option value="1">Rainbow Towers Hotel (Harare)</option>
            <option value="2">Victoria Falls Rainbow Hotel</option>
            <option value="3">Bulawayo Rainbow Hotel</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
            Commodity To Purchase
          </label>
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 outline-none focus:border-amber-500"
          >
            {matrixData.map((item, idx) => (
              <option key={idx} value={item.commodity_name}>
                {item.commodity_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
            Order Volume (Units)
          </label>
          <input
            type="number"
            value={orderVolume}
            onChange={(e) => setOrderVolume(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none bg-white focus:border-amber-500"
          />
        </div>
      </div>

      {/* DYNAMIC COMPLIANCE RESULT PANELS */}
      {matchedRow ? (
        <div className="space-y-4">
          {/* FLOOR COMPLIANCE STATUS BAR */}
          <div
            className={`p-5 rounded-xl border flex flex-col gap-1 ${
              matchedRow.hotel_rank === 1
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base">
              <span>{matchedRow.hotel_rank === 1 ? "✅" : "⚠️"}</span>
              <h4>
                {matchedRow.hotel_rank === 1
                  ? "Price matches the group optimal floor rate"
                  : "Variance Found: Rate exceeds optimal baseline"}
              </h4>
              <span className="text-xxs px-2 py-0.5 rounded bg-white/80 uppercase font-black tracking-wider text-slate-600 border border-slate-200">
                {matchedRow.hotel_rank === 1
                  ? "Highly Optimized"
                  : "Review Required"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Your selected rate is logged at{" "}
              <strong className="text-slate-900">
                ${matchedRow.current_price.toFixed(2)}
              </strong>
              . The absolute optimum regional group benchmark floor rate is{" "}
              <strong className="text-slate-900">
                ${matchedRow.min_group_price.toFixed(2)}
              </strong>
              , achieved by group node{" "}
              <strong className="text-slate-900">
                ID #{matchedRow.cheapest_property}
              </strong>
              .
            </p>
          </div>

          {/* CRITICAL RESOURCE HIGHLIGHT CARD */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-md">
            <span className="text-xxs font-bold text-amber-500 tracking-widest uppercase block mb-1">
              Optimum Group Sourcing Resource
            </span>
            <h3 className="text-xl font-black text-white tracking-tight">
              {matchedRow.supplier_name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active baseline compiled via direct property synchronization
              pipelines
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-800 text-xs">
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider text-xxs">
                  Effective Unit Cost
                </span>
                <p className="text-lg font-mono font-bold text-amber-500">
                  ${matchedRow.min_group_price.toFixed(2)} / unit
                </p>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider text-xxs">
                  Total Order Evaluation
                </span>
                <p className="text-lg font-mono font-bold text-white">
                  ${(matchedRow.min_group_price * orderVolume).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider text-xxs">
                  Potential Group Leakage
                </span>
                <p
                  className={`text-lg font-mono font-bold ${matchedRow.potential_savings > 0 ? "text-rose-400" : "text-emerald-400"}`}
                >
                  ${(matchedRow.potential_savings * orderVolume).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider text-xxs">
                  Lookback Guardrail
                </span>
                <p className="text-sm font-bold text-slate-300 mt-1">
                  Active 90-day Auditing Boundary
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
          Select an asset above to execute automated procurement cost protection
          analysis.
        </div>
      )}
    </div>
  );
}
