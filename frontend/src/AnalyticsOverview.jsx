import React, { useState, useEffect } from "react";

export default function AnalyticsOverview() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [reportingPeriod, setReportingPeriod] = useState("2026-05");
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [loading, setLoading] = useState(false);

  // Compute aggregate structural header cards dynamically from live dataset matrix
  const totalTrackedSavings = analyticsData.reduce(
    (acc, row) => acc + row.potential_savings_leakage,
    0,
  );
  const totalItemsCount = analyticsData.length;
  const criticalAnomaliesCount = analyticsData.filter(
    (row) => row.splm_change_pct > 15,
  ).length;

  useEffect(() => {
    fetchAnalyticsMetrics();
  }, [reportingPeriod, selectedHotelId]);

  const fetchAnalyticsMetrics = async () => {
    setLoading(true);
    try {
      let url = `http://127.0.0.1:8000/api/v1/procurement/analytics/summary?reporting_period=${reportingPeriod}`;
      if (selectedHotelId) {
        url += `&hotel_id=${selectedHotelId}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Data core metrics engine offline.");
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed loading view ledger state frames:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* SECTION 1: HEADER CONTROLS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2
            style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}
          >
            Procurement Intelligence Center
          </h2>
          <p style={{ color: "#64748b" }}>
            Track dynamic monthly baseline movements and cross-property vendor
            pricing behaviors.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="month"
            value={reportingPeriod}
            onChange={(e) => setReportingPeriod(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>
      </div>

      {/* SECTION 2: METRIC HEADER SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#3b82f6",
              textTransform: "uppercase",
            }}
          >
            Total Tracked Savings
          </span>
          <h3
            style={{
              fontSize: "28px",
              fontWeight: "8px",
              color: "#10b981",
              marginTop: "4px",
            }}
          >
            $
            {totalTrackedSavings.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Calculated against optimal group benchmark floor rates
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Market Inflation Variances
          </span>
          <h3
            style={{
              fontSize: "28px",
              fontWeight: "8px",
              color: "#ea580c",
              marginTop: "4px",
            }}
          >
            {totalItemsCount} Items
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Commodities processing active metrics
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Critical Anomalies
          </span>
          <h3
            style={{
              fontSize: "28px",
              fontWeight: "8px",
              color: "#dc2626",
              marginTop: "4px",
            }}
          >
            {criticalAnomaliesCount} Flagged
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Items with MoM price spikes exceeding 15%
          </p>
        </div>
      </div>

      {/* SECTION 3: COMPLEX PRICING INTELLIGENCE GRID */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h4
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#0f172a",
            marginBottom: "4px",
          }}
        >
          Group Commodity Price Intelligence Matrix
        </h4>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          Comparing unit rates across RTG properties to isolate cost-saving
          leakages and track vendors.
        </p>

        {loading ? (
          <p>Calculating statistical data arrays...</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #f1f5f9",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                <th style={{ padding: "12px" }}>Commodity Detail</th>
                <th style={{ padding: "12px" }}>Current Unit Price</th>
                <th style={{ padding: "12px" }}>SPLM / SPLY Var</th>
                <th style={{ padding: "12px" }}>Trend Indicator</th>
                <th style={{ padding: "12px" }}>Group Rank</th>
                <th style={{ padding: "12px" }}>Cheapest within RTG</th>
                <th style={{ padding: "12px" }}>Target Supplier Link</th>
                <th style={{ padding: "12px" }}>Potential Savings</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.map((row) => {
                // Color code indicators dynamically based on price delta states
                const indicatorColor = row.price_movement_indicator.includes(
                  "▲",
                )
                  ? "#dc2626"
                  : row.price_movement_indicator.includes("▼")
                    ? "#10b981"
                    : "#64748b";

                return (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      color: "#334155",
                    }}
                  >
                    <td style={{ padding: "16px 12px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>
                        {row.commodity_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Unit: {row.uom}
                      </div>
                    </td>
                    <td style={{ padding: "12px", fontWeight: "600" }}>
                      ${row.current_unit_price.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "12px",
                        lineSpacing: "1.4",
                      }}
                    >
                      <div>
                        MoM:{" "}
                        <span
                          style={{
                            color:
                              row.splm_change_pct > 0 ? "#dc2626" : "#10b981",
                          }}
                        >
                          {row.splm_change_pct}%
                        </span>
                      </div>
                      <div>
                        YoY:{" "}
                        <span
                          style={{
                            color:
                              row.sply_change_pct > 0 ? "#dc2626" : "#10b981",
                          }}
                        >
                          {row.sply_change_pct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          color: indicatorColor,
                          backgroundColor: `${indicatorColor}15`,
                          padding: "4px 8px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {row.price_movement_indicator}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          backgroundColor:
                            row.hotel_group_rank === 1 ? "#e2fbf1" : "#f1f5f9",
                          color:
                            row.hotel_group_rank === 1 ? "#10b981" : "#475569",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        #{row.hotel_group_rank}{" "}
                        {row.hotel_group_rank === 1 && "(Floor)"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      <div style={{ fontWeight: "500", color: "#0f172a" }}>
                        {row.cheapest_group_property_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Rate: ${row.min_group_price.toFixed(2)} (
                        {row.cheapest_group_property_uom})
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: "500" }}>
                        {row.supplier_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        Verified Active Vendor
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: "700",
                        color:
                          row.potential_savings_leakage > 0
                            ? "#dc2626"
                            : "#10b981",
                      }}
                    >
                      {row.potential_savings_leakage > 0
                        ? `-$${row.potential_savings_leakage.toFixed(2)}`
                        : "$0.00 (Optimal)"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
