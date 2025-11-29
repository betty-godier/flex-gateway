// src/app/api/trucks/upload/route.ts
import { NextResponse } from "next/server";
import { upsertTruck, getAllTrucks, TruckPlan } from "@/lib/truckStore";

export async function POST(req: Request) {
  const body = await req.json();

  // Validation très simple
  const plan: TruckPlan = {
    truckId: body.truckId,
    siteId: body.siteId || "site1",
    arrival: body.arrival,
    departure: body.departure,
    targetSoC: body.targetSoC,
    currentSoC: body.currentSoC,
  };

  if (!plan.truckId || !plan.arrival || !plan.departure) {
    return NextResponse.json(
      { error: "truckId, arrival and departure are required" },
      { status: 400 }
    );
  }

  upsertTruck(plan);

  return NextResponse.json({
    status: "ok",
    truck: plan,
  });
}

export async function GET() {
  return NextResponse.json(getAllTrucks());
}
