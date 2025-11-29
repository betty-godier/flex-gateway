import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const ENTSOE_ENDPOINT = "https://web-api.tp.entsoe.eu/api";
const FR_BIDDING_ZONE = "10YFR-RTE------C";

function formatDateUTC(date: Date, hhmm: string) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}${hhmm}`;
}

export async function GET() {
  const token = process.env.ENTSOE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Missing ENTSOE_API_TOKEN env var" },
      { status: 500 }
    );
  }

  // Fetch TOMORROW's day-ahead prices (UTC-based)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const periodStart = formatDateUTC(tomorrow, "0000");
  const periodEnd = formatDateUTC(tomorrow, "2300");

  const url =
    `${ENTSOE_ENDPOINT}?securityToken=${token}` +
    `&documentType=A44` +
    `&in_Domain=${FR_BIDDING_ZONE}` +
    `&out_Domain=${FR_BIDDING_ZONE}` +
    `&periodStart=${periodStart}` +
    `&periodEnd=${periodEnd}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: "ENTSO-E error", status: res.status, body },
        { status: 502 }
      );
    }

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xml);

    const doc = json.Publication_MarketDocument;
    const timeSeries = Array.isArray(doc.TimeSeries)
      ? doc.TimeSeries[0]
      : doc.TimeSeries;

    const period = timeSeries.Period;
    const timeInterval = period.timeInterval;
    const startTime = timeInterval.start;

    const points = Array.isArray(period.Point)
      ? period.Point
      : [period.Point];

    const prices = points.map((p: any) => ({
      position: Number(p.position), // 1..24/25
      price: Number(p["price.amount"]),
    }));

    return NextResponse.json({
      zone: "FR",
      date: startTime,
      prices,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: e?.message },
      { status: 500 }
    );
  }
}
