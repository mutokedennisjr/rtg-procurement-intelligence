import React, { useState, useEffect } from "react";

export default function GroupPriceMatrix({ reportingPeriod }) {
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetching the cross-hotel ledger entries
    fetch(
      `http://127.0.0.1:8000/api/analytics/summary?reporting_period=${reportingPeriod}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setMatrixData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to sync matrix node lines:", err);
        setLoading(false);
      });
  }, [reportingPeriod]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800">
        <h2 className="text-xl font-bold uppercase tracking-wide text-amber-500">
          Optimum Pricing Sourcing Grid Matrix
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Horizontal evaluation across RTG property nodes to track market
          floors.
        </p>
      </div>

      <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-xxs font-bold uppercase text-slate-500 tracking-widest">
                <th className="py-4 px-6">Commodity Item</th>
                <th className="py-4 px-6">UOM</th>
                <th className="py-4 px-6 text-center">RTH</th>
                <th className="py-4 px-6 text-center">KHCC</th>
                <th className="py-4 px-6 text-center">BRH</th>
                <th className="py-4 px-6 text-center">VFRH</th>
                <th className="py-4 px-6 text-center">AZRL</th>
                <th className="py-4 px-6 text-center">OPTIMUM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs font-semibold text-slate-300 bg-slate-950/40">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    🔄 Syncing real-time property matrix matrix nodes...
                  </td>
                </tr>
              ) : matrixData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No active market entries captured for this period.
                  </td>
                </tr>
              ) : (
                matrixData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-200">
                      {row.commodity_name}
                    </td>
                    <td className="py-4 px-6 text-slate-500">UNIT</td>
                    {/* Multi-property comparisons mapped directly to hotel ID fields */}
                    <td className="py-4 px-6 text-center font-mono">
                      {row.hotel_id === 1 ? (
                        <span
                          className={`px-2 py-1 rounded ${row.hotel_rank === 1 ? "bg-emerald-950/80 text-emerald-400 font-bold" : ""}`}
                        >
                          ${row.current_price.toFixed(2)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-slate-600">
                      —
                    </td>
                    <td className="py-4 px-6 text-center font-mono">
                      {row.hotel_id === 3 ? (
                        <span
                          className={`px-2 py-1 rounded ${row.hotel_rank === 1 ? "bg-emerald-950/80 text-emerald-400 font-bold" : ""}`}
                        >
                          ${row.current_price.toFixed(2)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-slate-600">
                      —
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-slate-600">
                      —
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-amber-500 font-black bg-amber-950/20">
                      ${row.min_group_price.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
