import { SitePowerChart } from "@/components/SitePowerChart";

type TruckPlan = {
  truckId: string;
  siteId: string;
  arrival: string;
  departure: string;
  targetSoC: number;
  currentSoC: number;
};

type Interval = {
  time: string;
  trucksConnected: number;
  maxPossiblePowerKW: number;
};

type AggregatedPlan = {
  siteId: string;
  intervals: Interval[];
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function fetchTrucks(): Promise<TruckPlan[]> {
  const res = await fetch(`${BASE_URL}/api/trucks/upload`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchAggregatedPlan(
  siteId = "site1"
): Promise<AggregatedPlan | null> {
  const res = await fetch(
    `${BASE_URL}/api/site/aggregated-plan?siteId=${siteId}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function Home() {
  const [trucks, plan] = await Promise.all([
    fetchTrucks(),
    fetchAggregatedPlan("site1"),
  ]);

  // ---- Depot Performance Score v1 (completion-based) ----
  const siteId = "site1";
  const siteTrucks = trucks.filter((t) => t.siteId === siteId);
  const numberOfTrucks = siteTrucks.length;

  const ENERGY_PER_TRUCK_KWH = 400; // pilot site assumption

  let depotScore: number | null = null;
  let energyDemandKWh: number | null = null;
  let energyCapacityKWh: number | null = null;

  if (
    plan &&
    plan.intervals &&
    plan.intervals.length > 0 &&
    numberOfTrucks > 0
  ) {
    energyDemandKWh = numberOfTrucks * ENERGY_PER_TRUCK_KWH;

    // Each 15-min interval: energy = power(kW) * time(h) = P * 0.25
    energyCapacityKWh = plan.intervals.reduce(
      (sum, i) => sum + i.maxPossiblePowerKW * 0.25,
      0
    );

    const completionRatio = Math.min(
      energyCapacityKWh / energyDemandKWh,
      1
    );

    depotScore = Math.round(completionRatio * 100); // 0–100
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#2e7d32"; // green
    if (score >= 50) return "#f9a825"; // amber
    return "#c62828"; // red
  };

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Flex Gateway – Site Dashboard</h1>

      {/* Depot Performance Score block */}
      <section
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
          maxWidth: 520,
        }}
      >
        <h2>Depot Performance Score (v1)</h2>
        {!depotScore || depotScore === null ? (
          <p>
            Not enough data yet to compute the score (need trucks and an
            aggregated plan).
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `4px solid ${getScoreColor(depotScore)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: "bold",
                color: getScoreColor(depotScore),
              }}
            >
              {depotScore}
            </div>
            <div style={{ fontSize: 14 }}>
              <p style={{ margin: 0 }}>
                <strong>Site:</strong> {siteId}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Trucks tonight:</strong> {numberOfTrucks}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Energy demand:</strong>{" "}
                {energyDemandKWh?.toFixed(0)} kWh
              </p>
              <p style={{ margin: 0 }}>
                <strong>Energy capacity (max):</strong>{" "}
                {energyCapacityKWh?.toFixed(0)} kWh
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#555" }}>
                v1: score based only on the ability to fully charge all trucks
                overnight with current site capacity.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Trucks table */}
      <section style={{ marginTop: 24 }}>
        <h2>Registered trucks (site1)</h2>
        {trucks.length === 0 ? (
          <p>No trucks yet. Post one via the API.</p>
        ) : (
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: 600,
              marginTop: 8,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                  Truck ID
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                  Arrival
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                  Departure
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                  Current SoC
                </th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                  Target SoC
                </th>
              </tr>
            </thead>
            <tbody>
              {trucks.slice(1).map((t) => (
                <tr key={`${t.siteId}-${t.truckId}`}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {t.truckId}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {new Date(t.arrival).toLocaleString()}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {new Date(t.departure).toLocaleString()}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {(t.currentSoC * 100).toFixed(0)} %
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {(t.targetSoC * 100).toFixed(0)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Aggregated site power + chart */}
      <section style={{ marginTop: 32 }}>
        <h2>Aggregated site power (15 min)</h2>
        {!plan || plan.intervals.length === 0 ? (
          <p>No aggregated plan yet (no trucks?).</p>
        ) : (
          <>
            <p>
              Site: <strong>{plan.siteId}</strong> – first 50 rows shown in the
              table below.
            </p>
            <table
              style={{
                borderCollapse: "collapse",
                minWidth: 600,
                marginTop: 8,
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                    Time (UTC)
                  </th>
                  <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                    Connected trucks
                  </th>
                  <th style={{ borderBottom: "1px solid #ccc", padding: 4 }}>
                    Max possible power (kW)
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.intervals.slice(0, 50).map((i) => (
                  <tr key={i.time}>
                    <td
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(i.time).toISOString()}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                      {i.trucksConnected}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                      {i.maxPossiblePowerKW}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Power chart */}
            <SitePowerChart intervals={plan.intervals} />
          </>
        )}
      </section>
    </main>
  );
}
