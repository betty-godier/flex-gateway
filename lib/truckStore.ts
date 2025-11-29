// src/lib/truckStore.ts

export type TruckPlan = {
  truckId: string;
  siteId: string;          // pour gérer multi-site plus tard
  arrival: string;         // ISO 8601
  departure: string;       // ISO 8601
  targetSoC: number;       // 0–1
  currentSoC: number;      // 0–1
};

const trucks: TruckPlan[] = [];

// Ajouter ou mettre à jour un camion
export function upsertTruck(plan: TruckPlan) {
  const idx = trucks.findIndex(
    (t) => t.truckId === plan.truckId && t.siteId === plan.siteId
  );
  if (idx >= 0) {
    trucks[idx] = plan;
  } else {
    trucks.push(plan);
  }
}

export function getAllTrucks() {
  return trucks;
}

export function getTrucksForSite(siteId: string) {
  return trucks.filter((t) => t.siteId === siteId);
}
