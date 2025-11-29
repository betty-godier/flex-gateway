import { NextResponse } from "next/server";
import { getMarketPrices } from "@/lib/symphonics";

export async function GET() {
  try {
    const data = await getMarketPrices();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
