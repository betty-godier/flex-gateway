// src/app/api/site/aggregated-plan/route.ts
import { NextResponse } from "next/server";
import { getTrucksForSite } from "@/lib/truckStore";

const SITE_MAX_POWER_KW = 1200; // 1.2 MW
const TRUCK_MAX_POWER_KW = 250; // par camion

function toDate(value: string): Date {
  return new Date(value);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId") || "site1";

  const trucks = getTrucksForSite(siteId);

  if (trucks.length === 0) {
    return NextResponse.json({
      siteId,
      intervals: [],
      message: "No trucks for this site yet",
    });
  }

  // Déterminer la fenêtre globale [minArrival, maxDeparture]
  const arrivals = trucks.map((t) => toDate(t.arrival));
  const departures = trucks.map((t) => toDate(t.departure));

  const start = new Date(Math.min(...arrivals.map((d) => d.getTime())));
  const end = new Date(Math.max(...departures.map((d) => d.getTime())));

  // Normaliser: arrondir start à 15 min inférieure, end à 15 min supérieure
  start.setUTCMinutes(Math.floor(start.getUTCMinutes() / 15) * 15, 0, 0);
  end.setUTCMinutes(Math.ceil(end.getUTCMinutes() / 15) * 15, 0, 0);

  const intervals: {
    time: string;
    trucksConnected: number;
    maxPossiblePowerKW: number;
  }[] = [];

  const cursor = new Date(start);

  while (cursor <= end) {
    const timeISO = cursor.toISOString();

    let connectedCount = 0;
    for (const t of trucks) {
      const arr = toDate(t.arrival);
      const dep = toDate(t.departure);
      if (cursor >= arr && cursor < dep) {
        connectedCount++;
      }
    }

    const totalPossible = Math.min(
      connectedCount * TRUCK_MAX_POWER_KW,
      SITE_MAX_POWER_KW
    );

    intervals.push({
      time: timeISO,
      trucksConnected: connectedCount,
      maxPossiblePowerKW: totalPossible,
    });

    cursor.setUTCMinutes(cursor.getUTCMinutes() + 15);
  }

  return NextResponse.json({
    siteId,
    intervals,
  });
}
