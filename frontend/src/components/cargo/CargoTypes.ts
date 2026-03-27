// src/components/cargo/CargoTypes.ts
export type CargoCategory = 'normal' | 'dgr' | 'live_animal' | 'perishable';
export interface CargoItem {
  id: string; awb: string; description: string; agent: string; pieces: number; weight_kg: number;
  length_cm: number; width_cm: number; height_cm: number; volume_m3: number; chargeableWeight_kg: number;
  category: CargoCategory; dgr_class?: string; un_number?: string;
  temperature?: 'freeze' | 'chill' | 'ambient'; fee_per_kg: number; shipper: string; consignee: string;
}
export interface ULDUnit {
  id: string; uld_code: string; uld_name: string; uld_full_name: string; cargoItems: CargoItem[];
  deck: 'main' | 'lower'; position?: string;
  dims: { l_cm: number; w_cm: number; h_cm: number }; max_load_kg: number; volume_m3: number;
}
export const CAT_COLOR: Record<string,string> = { normal:'#3B82F6', dgr:'#EF4444', live_animal:'#16A34A', perishable:'#F59E0B' };
export const CAT_TAG: Record<string,{text:string;color:string}> = {
  normal:{text:'普通',color:'default'}, dgr:{text:'危险品',color:'error'},
  live_animal:{text:'活体',color:'success'}, perishable:{text:'生鲜',color:'warning'},
};
