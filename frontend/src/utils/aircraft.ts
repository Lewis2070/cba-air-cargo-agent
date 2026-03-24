// 机型布局数据加载器
import aircraftData from "../../public/docs/aircraft_layouts.json";
import type { AircraftConfig } from "../types";

const DATA = aircraftData.aircraft_types as Record<string, AircraftConfig>;

export function getAircraftConfig(type: string): AircraftConfig | undefined {
  return DATA[type];
}

export function getAllAircraftTypes(): string[] {
  return Object.keys(DATA);
}

export const DEFAULT_AIRCRAFT = "B777-300ER";
