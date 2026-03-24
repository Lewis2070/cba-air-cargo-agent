// LoadPlanningPage v3.1 - CBA Air Cargo 专业排舱系统
import { useState, useMemo, Component, ReactNode } from "react";
import { Card, Button, Select, Tag, Modal, Divider, Row, Col, Progress, Tooltip, message, Popconfirm, Alert, Space } from "antd";
import { CheckCircleOutlined, WarningOutlined, DeleteOutlined, ThunderboltOutlined, ReloadOutlined } from "@ant-design/icons";

// ─── Error Boundary ─────────────────────────────────────────────────────────
interface EBState { hasError: boolean; error?: Error }
class LoadPlanningErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 40, textAlign: "center", color: "#fff", background: "#1a1a2e", minHeight: "100vh" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "#F5222D" }}>智能排舱加载失败</h2>
        <pre style={{ textAlign: "left", background: "#0d1b2a", padding: 16, borderRadius: 8, fontSize: 12, maxWidth: 600, margin: "20px auto", overflow: "auto", color: "#faad14" }}>
          {this.state.error?.message || "Unknown error"}
        </pre>
        <Button icon={<ReloadOutlined />} onClick={() => this.setState({ hasError: false })}>重新加载</Button>
      </div>
    );
    return this.props.children;
  }
}

// ─── 数据模型 ───────────────────────────────────────────────────────────────
interface CP { id: string; awb: string; awb_seq: number; customer: string; weight_kg: number; volume_m3: number; pieces: number; remaining_pieces: number; length_cm: number; width_cm: number; height_cm: number; goods_description: string; is_dgr: boolean; dgr_class?: string; un_number?: string; dgr_name?: string; flight_id: string; destination: string; cargo_type: "general" | "refrigerated" | "valuable" | "live_animal"; }
interface UCI { cargo_id: string; pieces_loaded: number; weight_kg: number; volume_m3: number; }
interface BUL { id: string; uld_type: string; cargo_items: UCI[]; total_weight_kg: number; total_volume_m3: number; billable_weight_kg: number; piece_count: number; status: "building" | "ready"; }
interface PL { uld: BUL; position_code: string; arm_m: number; label_cn: string; deck: string; row: string; }
interface CG { cgIndex: number; isInLimits: boolean; isWarning: boolean; limitMin: number; limitMax: number; totalWeight: number; totalVolume: number; totalBillable: number; advice: string; phase: "takeoff" | "cruise" | "landing"; }
interface AC { name_cn: string; name_en: string; iata_code: string; max_payweight_kg: number; max_volume_m3: number; mac_m: number; mac_leading_edge_m: number; cg_limits: { takeoff: { min_pct: number; max_pct: number }; cruise: { min_pct: number; max_pct: number }; landing: { min_pct: number; max_pct: number } }; positions: { nose?: { code: string; label_cn: string; label_en: string; deck: string; row: string; arm_m: number; max_weight_kg: number; allowed_uld: string[]; cargo_type: string }[]; main: { code: string; label_cn: string; label_en: string; deck: string; row: string; arm_m: number; max_weight_kg: number; allowed_uld: string[]; cargo_type: string }[]; lower: { code: string; label_cn: string; label_en: string; deck: string; row: string; arm_m: number; max_weight_kg: number; allowed_uld: string[]; cargo_type: string }[] }; }

// ─── ULD规格 ───────────────────────────────────────────────────────────────
const US: Record<string, { max_weight: number; max_volume: number; length: number; width: number; height: number }> = {
  P1P: { max_weight: 4626, max_volume: 14.32, length: 224, width: 318, height: 300 },
  PAG: { max_weight: 4626, max_volume: 14.32, length: 224, width: 318, height: 300 },
  PMC: { max_weight: 4626, max_volume: 13.5,  length: 317, width: 223, height: 160 },
  AKE: { max_weight: 1588, max_volume: 4.9,   length: 153, width: 198, height: 160 },
  AVP: { max_weight: 1150, max_volume: 3.8,   length: 150, width: 120, height: 120 },
  RKN: { max_weight: 2500, max_volume: 6.5,   length: 200, width: 150, height: 160 },
};
const UC: Record<string, string> = { P1P: "#1F4E79", PAG: "#2E75B6", PMC: "#4472C4", AKE: "#5B9BD5", AVP: "#70AD47", RKN: "#00B0F0" };
const UT = ["P1P", "PAG", "PMC", "AKE", "AVP", "RKN"] as const;
const DS: Record<string, string[]> = {
  "1":    ["3","5.1","5.2"],
  "2.1": ["2.3","3","4.1","5.1"],
  "2.3": ["2.1","3","4.1","5.1"],
  "3":   ["1","2.1","5.1","5.2"],
  "4.1": ["2.1","2.3","5.1"],
  "5.1": ["1","2.1","2.3","3","4.1"],
  "5.2": ["1","3"],
  "9":   [],
};

function bl(w: number, v: number): number { return Math.max(w, v * 167); }

function cCG(pls: PL[], ac: AC, ph: "takeoff" | "cruise" | "landing"): CG {
  const lim = ac.cg_limits[ph];
  const mLE = ac.mac_leading_edge_m, mac = ac.mac_m;
  const tM = pls.reduce((s, p) => s + p.uld.total_weight_kg * p.arm_m, 0);
  const tW = pls.reduce((s, p) => s + p.uld.total_weight_kg, 0);
  const tV = pls.reduce((s, p) => s + p.uld.total_volume_m3, 0);
  const tB = pls.reduce((s, p) => s + p.uld.billable_weight_kg, 0);
  const cP = tW > 0 ? tM / tW : mLE;
  const cI = ((cP - mLE) / mac) * 100;
  const iIL = cI >= lim.min_pct && cI <= lim.max_pct;
  const iWN = !iIL || cI < lim.min_pct + 3 || cI > lim.max_pct - 3;
  let adv = "";
  if (cI < lim.min_pct) adv = `重心偏前(${cI.toFixed(1)}%)，建议向后舱多装载`;
  else if (cI > lim.max_pct) adv = `重心偏后(${cI.toFixed(1)}%)，建议向前舱多装载`;
  else adv = "重心位置良好";
  return { cgIndex: Math.round(cI * 10) / 10, isInLimits: iIL, isWarning: iWN, limitMin: lim.min_pct, limitMax: lim.max_pct, totalWeight: tW, totalVolume: tV, totalBillable: tB, advice: adv, phase: ph };
}

function vULD(its: UCI[], allCargo: CP[], uldType: string) {
  const errors: string[] = []; const warnings: string[] = [];
  const sp = US[uldType];
  if (!sp) return { valid: false, errors: ["未知板型"], warnings, volUtil: 0, tW: 0, tV: 0 };
  const tW = its.reduce((s, i) => s + i.weight_kg, 0);
  const tV = its.reduce((s, i) => s + i.volume_m3, 0);
  if (tW > sp.max_weight) errors.push(`重量超限 ${tW}kg > ${sp.max_weight}kg`);
  if (tV > sp.max_volume) errors.push(`体积超限 ${tV.toFixed(2)}m³ > ${sp.max_volume}m³`);
  const dgrs = its.map(ci => allCargo.find(c => c.id === ci.cargo_id)?.dgr_class).filter(Boolean) as string[];
  for (const cls of dgrs) { for (const cf of (DS[cls] || [])) { if (dgrs.includes(cf) && cls !== cf) errors.push(`DGR隔离: Class ${cls} 与 Class ${cf} 不得同板`); } }
  const vU = (tV / sp.max_volume) * 100;
  if (vU < 50 && its.length > 0) warnings.push(`体积利用率偏低: ${vU.toFixed(0)}%`);
  return { valid: errors.length === 0, errors, warnings, volUtil: vU, tW, tV };
}

function aiPack(cargo: CP[], ac: AC) {
  const sorted = [...cargo].filter(c => c.remaining_pieces > 0).sort((a, b) => (b.weight_kg / Math.max(b.volume_m3, 0.01)) - (a.weight_kg / Math.max(a.volume_m3, 0.01)));
  const used = new Map<string, number>();
  const bulds: BUL[] = [];
  for (const c of sorted) {
    const rem = used.has(c.id) ? used.get(c.id)! : c.remaining_pieces;
    if (rem <= 0) continue;
    for (const ut of UT) {
      const sp = US[ut];
      if (c.weight_kg > sp.max_weight || c.volume_m3 > sp.max_volume) continue;
      const ex = bulds.find(u => u.uld_type === ut && u.status === "building" && u.total_weight_kg + c.weight_kg <= sp.max_weight && u.total_volume_m3 + c.volume_m3 <= sp.max_volume);
      if (ex) { ex.cargo_items.push({ cargo_id: c.id, pieces_loaded: rem, weight_kg: c.weight_kg, volume_m3: c.volume_m3 }); ex.total_weight_kg += c.weight_kg; ex.total_volume_m3 += c.volume_m3; ex.billable_weight_kg += bl(c.weight_kg, c.volume_m3); ex.piece_count += rem; used.set(c.id, 0); break; }
      const nu: BUL = { id: `ULD${bulds.length + 1}`, uld_type: ut, status: "building", cargo_items: [{ cargo_id: c.id, pieces_loaded: rem, weight_kg: c.weight_kg, volume_m3: c.volume_m3 }], total_weight_kg: c.weight_kg, total_volume_m3: c.volume_m3, billable_weight_kg: bl(c.weight_kg, c.volume_m3), piece_count: rem };
      bulds.push(nu); used.set(c.id, 0); break;
    }
  }
  bulds.forEach(u => u.status = "ready");
  const allPos = [...(ac.positions.main || []), ...(ac.positions.nose || []), ...(ac.positions.lower || [])];
  const sortedUlds = [...bulds].sort((a, b) => a.total_weight_kg - b.total_weight_kg);
  const pls: PL[] = [];
  for (const uld of sortedUlds) {
    const pos = allPos.find(p => !pls.some(pl => pl.position_code === p.code) && p.allowed_uld.includes(uld.uld_type));
    if (pos) pls.push({ uld, position_code: pos.code, arm_m: pos.arm_m, label_cn: pos.label_cn, deck: pos.deck, row: pos.row });
  }
  return { ulds: bulds, placements: pls, cg_t: cCG(pls, ac, "takeoff"), cg_c: cCG(pls, ac, "cruise"), cg_l: cCG(pls, ac, "landing") };
}

const MOCK: CP[] = [
  { id: "C001", awb: "999-12345678", awb_seq: 1, customer: "ABC Trading Co", weight_kg: 450, volume_m3: 1.8, pieces: 3, remaining_pieces: 3, length_cm: 80, width_cm: 60, height_cm: 40, goods_description: "电子元器件", is_dgr: false, flight_id: "1", destination: "LAX", cargo_type: "general" },
  { id: "C002", awb: "999-12345679", awb_seq: 2, customer: "XYZ Logistics", weight_kg: 320, volume_m3: 1.2, pieces: 2, remaining_pieces: 2, length_cm: 60, width_cm: 50, height_cm: 40, goods_description: "汽车配件", is_dgr: false, flight_id: "1", destination: "LAX", cargo_type: "general" },
  { id: "C003", awb: "999-12345680", awb_seq: 3, customer: "Tech Industries", weight_kg: 2400, volume_m3: 9.6, pieces: 20, remaining_pieces: 20, length_cm: 120, width_cm: 100, height_cm: 80, goods_description: "机械设备零件", is_dgr: false, flight_id: "1", destination: "LAX", cargo_type: "general" },
  { id: "C004", awb: "999-12345681", awb_seq: 4, customer: "Global Exports", weight_kg: 560, volume_m3: 2.2, pieces: 5, remaining_pieces: 5, length_cm: 100, width_cm: 80, height_cm: 28, goods_description: "纺织品", is_dgr: false, flight_id: "1", destination: "LAX", cargo_type: "general" },
  { id: "C005", awb: "999-12345682", awb_seq: 5, customer: "Pacific Trading", weight_kg: 250, volume_m3: 1.0, pieces: 2, remaining_pieces: 2, length_cm: 50, width_cm: 40, height_cm: 50, goods_description: "陶瓷制品", is_dgr: false, flight_id: "1", destination: "LAX", cargo_type: "general" },
  { id: "C006", awb: "999-12345683", awb_seq: 6, customer: "Euro Cargo GmbH", weight_kg: 3200, volume_m3: 12.0, pieces: 25, remaining_pieces: 25, length_cm: 200, width_cm: 120, height_cm: 50, goods_description: "医疗设备", is_dgr: false, flight_id: "1", destination: "NRT", cargo_type: "general" },
  { id: "C007", awb: "999-12345684", awb_seq: 7, customer: "Shanghai Electronics", weight_kg: 120, volume_m3: 0.5, pieces: 2, remaining_pieces: 2, length_cm: 40, width_cm: 30, height_cm: 45, goods_description: "锂电池(UN3481)", is_dgr: true, dgr_class: "9", un_number: "UN3481", dgr_name: "锂离子电池", flight_id: "1", destination: "LHR", cargo_type: "general" },
  { id: "C008", awb: "999-12345685", awb_seq: 8, customer: "American Imports", weight_kg: 890, volume_m3: 3.5, pieces: 8, remaining_pieces: 8, length_cm: 110, width_cm: 70, height_cm: 45, goods_description: "药品", is_dgr: false, flight_id: "1", destination: "ORD", cargo_type: "refrigerated" },
  { id: "C009", awb: "999-12345686", awb_seq: 9, customer: "German Pharma", weight_kg: 320, volume_m3: 1.2, pieces: 3, remaining_pieces: 3, length_cm: 50, width_cm: 40, height_cm: 60, goods_description: "冷链药品", is_dgr: false, flight_id: "1", destination: "CDG", cargo_type: "refrigerated" },
  { id: "C010", awb: "999-12345687", awb_seq: 10, customer: "Jewelry Co", weight_kg: 30, volume_m3: 0.1, pieces: 1, remaining_pieces: 1, length_cm: 25, width_cm: 25, height_cm: 20, goods_description: "贵重物品", is_dgr: false, flight_id: "1", destination: "SIN", cargo_type: "valuable" },
];

const ACD: Record<string, AC> = {
  "B747-400F": { name_cn: "波音747-400F全货机", name_en: "Boeing 747-400ER Freighter", iata_code: "74F", max_payweight_kg: 112000, max_volume_m3: 250, mac_m: 19.68, mac_leading_edge_m: 17.7, cg_limits: { takeoff: { min_pct: 9, max_pct: 33 }, cruise: { min_pct: 11, max_pct: 38 }, landing: { min_pct: 9, max_pct: 38 } }, positions: { nose: [{ code: "N1", label_cn: "鼻舱前", label_en: "Nose FWD", deck: "nose", row: "nose", arm_m: 8.7, max_weight_kg: 4000, allowed_uld: ["AKE", "AVP"], cargo_type: "general" }, { code: "N2", label_cn: "鼻舱后", label_en: "Nose AFT", deck: "nose", row: "nose", arm_m: 10.5, max_weight_kg: 4000, allowed_uld: ["AKE", "AVP"], cargo_type: "general" }], main: [{ code: "M1", label_cn: "主舱前", label_en: "Main FWD", deck: "main", row: "forward", arm_m: 17.0, max_weight_kg: 20000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }, { code: "M2", label_cn: "主舱中", label_en: "Main MID", deck: "main", row: "mid", arm_m: 21.5, max_weight_kg: 20000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }, { code: "M3", label_cn: "主舱后", label_en: "Main AFT", deck: "main", row: "aft", arm_m: 26.0, max_weight_kg: 18000, allowed_uld: ["PMC", "PAG", "P1P", "AKE"], cargo_type: "general" }], lower: [{ code: "L1", label_cn: "下货舱前", label_en: "Lower FWD", deck: "lower", row: "forward", arm_m: 12.5, max_weight_kg: 6000, allowed_uld: ["AKE", "RKN", "AVP"], cargo_type: "refrigerated" }, { code: "L2", label_cn: "下货舱中", label_en: "Lower MID", deck: "lower", row: "mid", arm_m: 20.5, max_weight_kg: 10000, allowed_uld: ["AKE", "RKN", "AVP", "PMC"], cargo_type: "refrigerated" }, { code: "L3", label_cn: "下货舱后", label_en: "Lower AFT", deck: "lower", row: "aft", arm_m: 27.5, max_weight_kg: 6000, allowed_uld: ["AKE", "RKN"], cargo_type: "refrigerated" }] } },
  "B777-200LRF": { name_cn: "波音777-200LRF全货机", name_en: "Boeing 777-200LR Large Cargo Freighter", iata_code: "77L", max_payweight_kg: 102000, max_volume_m3: 240, mac_m: 18.43, mac_leading_edge_m: 15.6, cg_limits: { takeoff: { min_pct: 9, max_pct: 35 }, cruise: { min_pct: 11, max_pct: 39 }, landing: { min_pct: 9, max_pct: 40 } }, positions: { main: [{ code: "M1", label_cn: "主舱前左", label_en: "Main FWD L", deck: "main", row: "forward", arm_m: 15.5, max_weight_kg: 12000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }, { code: "M2", label_cn: "主舱前右", label_en: "Main FWD R", deck: "main", row: "forward", arm_m: 15.5, max_weight_kg: 12000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }, { code: "M3", label_cn: "主舱中左", label_en: "Main MID L", deck: "main", row: "mid", arm_m: 21.5, max_weight_kg: 14000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }, { code: "M4", label_cn: "主舱中右", label_en: "Main MID R", deck: "main", row: "mid", arm_m: 21.5, max_weight_kg: 14000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }, { code: "M5", label_cn: "主舱后左", label_en: "Main AFT L", deck: "main", row: "aft", arm_m: 26.5, max_weight_kg: 10000, allowed_uld: ["PMC", "PAG", "P1P", "AKE"], cargo_type: "general" }, { code: "M6", label_cn: "主舱后右", label_en: "Main AFT R", deck: "main", row: "aft", arm_m: 26.5, max_weight_kg: 10000, allowed_uld: ["PMC", "PAG", "P1P", "AKE"], cargo_type: "general" }], lower: [{ code: "L1", label_cn: "下货舱前", label_en: "Lower FWD", deck: "lower", row: "forward", arm_m: 12.0, max_weight_kg: 5000, allowed_uld: ["AKE", "AVP", "RKN"], cargo_type: "refrigerated" }, { code: "L2", label_cn: "下货舱中前", label_en: "Lower MID FWD", deck: "lower", row: "forward", arm_m: 17.0, max_weight_kg: 7000, allowed_uld: ["AKE", "AVP", "RKN"], cargo_type: "refrigerated" }, { code: "L3", label_cn: "下货舱中后", label_en: "Lower MID AFT", deck: "lower", row: "mid", arm_m: 22.0, max_weight_kg: 7000, allowed_uld: ["AKE", "AVP", "RKN", "PMC"], cargo_type: "refrigerated" }, { code: "L4", label_cn: "下货舱后", label_en: "Lower AFT", deck: "lower", row: "aft", arm_m: 27.0, max_weight_kg: 5000, allowed_uld: ["AKE", "RKN"], cargo_type: "refrigerated" }] } },
  "A330-200F": { name_cn: "空客A330-200F全货机", name_en: "Airbus A330-200 Freighter", iata_code: "332F", max_payweight_kg: 59000, max_volume_m3: 140, mac_m: 15.91, mac_leading_edge_m: 13.37, cg_limits: { takeoff: { min_pct: 10, max_pct: 35 }, cruise: { min_pct: 12, max_pct: 38 }, landing: { min_pct: 10, max_pct: 40 } }, positions: { main: [{ code: "M1", label_cn: "主舱前左", label_en: "Main FWD L", deck: "main", row: "forward", arm_m: 14.5, max_weight_kg: 8000, allowed_uld: ["PMC", "PAG", "P1P", "AKE"], cargo_type: "general" }, { code: "M2", label_cn: "主舱前右", label_en: "Main FWD R", deck: "main", row: "forward", arm_m: 14.5, max_weight_kg: 8000, allowed_uld: ["PMC", "PAG", "P1P", "AKE"], cargo_type: "general" }, { code: "M3", label_cn: "主舱后", label_en: "Main AFT", deck: "main", row: "aft", arm_m: 21.0, max_weight_kg: 14000, allowed_uld: ["PMC", "PAG", "P1P"], cargo_type: "general" }], lower: [{ code: "L1", label_cn: "下货舱前", label_en: "Lower FWD", deck: "lower", row: "forward", arm_m: 11.0, max_weight_kg: 3500, allowed_uld: ["AKE", "AVP", "RKN"], cargo_type: "refrigerated" }, { code: "L2", label_cn: "下货舱中", label_en: "Lower MID", deck: "lower", row: "mid", arm_m: 17.0, max_weight_kg: 5500, allowed_uld: ["AKE", "AVP", "RKN"], cargo_type: "refrigerated" }, { code: "L3", label_cn: "下货舱后", label_en: "Lower AFT", deck: "lower", row: "aft", arm_m: 23.0, max_weight_kg: 3500, allowed_uld: ["AKE", "RKN"], cargo_type: "refrigerated" }] } },
};

// ─── 重心包线图 ───────────────────────────────────────────────────────────────
function CGEnvelopeChart({ cg, ac }: { cg: CG; ac: AC }) {
  const phases = [{ k: "takeoff" as const, l: "起飞 TO", c: "#F5222D" }, { k: "cruise" as const, l: "巡航 CR", c: "#1890FF" }, { k: "landing" as const, l: "落地 LD", c: "#52C41A" }];
  const allL = [ac.cg_limits.takeoff, ac.cg_limits.cruise, ac.cg_limits.landing];
  const gMn = Math.min(...allL.map(l => l.min_pct)); const gMx = Math.max(...allL.map(l => l.max_pct));
  const pad = (gMx - gMn) * 0.12; const lt = gMn - pad; const rt = gMx + pad; const rng = rt - lt;
  const tX = (p: number) => ((p - lt) / rng) * 100;
  return (
    <div style={{ background: "#0d1b2a", borderRadius: 8, padding: "12px 14px", color: "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#8c9ab5", marginBottom: 8 }}>重心包线图 CG Envelope</div>
      <svg width="100%" height="145" viewBox="0 0 100 145" preserveAspectRatio="none" style={{ display: "block" }}>
        {[0, 1, 2, 3, 4].map(i => <line key={i} x1={i * 25} y1="8" x2={i * 25} y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />)}
        {phases.map((ph, idx) => {
          const lim = (ac.cg_limits as any)[ph.k];
          const x1 = tX(lim.min_pct), x2 = tX(lim.max_pct);
          const y = 22 + idx * 42;
          const ia = cg.phase === ph.k;
          return (
            <g key={ph.k}>
              <rect x={x1} y={y - 15} width={Math.max(x2 - x1, 1)} height={30} fill={ph.c} fillOpacity={ia ? 0.3 : 0.12} stroke={ph.c} strokeOpacity={ia ? 1 : 0.5} strokeWidth={ia ? 1.5 : 1} rx="3" />
              <text x="1" y={y - 4} fill={ph.c} fontSize="9" fontWeight="bold">{ph.l}</text>
              <text x="1" y={y + 8} fill={ph.c} fontSize="8" opacity={0.65}>{lim.min_pct}%~{lim.max_pct}%</text>
              <line x1={x1} y1={y - 18} x2={x1} y2={y + 18} stroke={ph.c} strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1={x2} y1={y - 18} x2={x2} y2={y + 18} stroke={ph.c} strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="2,2" />
            </g>
          );
        })}
        {(() => { const cx = tX(cg.cgIndex); return (
          <g>
            <line x1={cx} y1="8" x2={cx} y2="120" stroke={cg.isInLimits ? "#FAAD14" : "#F5222D"} strokeWidth="2.5" strokeDasharray="4,2" />
            <polygon points={`${cx},6 ${cx - 4},0 ${cx + 4},0`} fill={cg.isInLimits ? "#FAAD14" : "#F5222D"} />
            <text x={cx} y="138" textAnchor="middle" fill={cg.isInLimits ? "#FAAD14" : "#F5222D"} fontSize="10" fontWeight="bold">{cg.cgIndex}%</text>
          </g>
        )})()}
        <line x1="0" y1="120" x2="100" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        {[0, 25, 50, 75, 100].map(p => {
          const pct = lt + (p / 100) * rng;
          return <text key={p} x={p} y="129" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7">{pct.toFixed(0)}%</text>;
        })}
      </svg>
      <div style={{ marginTop: 6, fontSize: 11, color: "#8c9ab5" }}>
        <span style={{ color: cg.isInLimits ? "#52C41A" : "#F5222D", fontWeight: 600, marginRight: 8 }}>{cg.isInLimits ? "✓ 重心安全" : "✗ 重心超限"}</span>
        <span>{cg.advice}</span>
      </div>
    </div>
  );
}


// ─── 货舱截面SVG ───────────────────────────────────────────────────────────────
interface STS { tW: number; wU: number; vU: number; tB: number }
function HoldLayoutSVG({ aircraft, placements, selectedPos, onSelectPos, onRemoveUld, stats }: {
  aircraft: AC; placements: PL[]; selectedPos: string | null;
  onSelectPos: (code: string | null) => void; onRemoveUld: (code: string) => void; stats: STS;
}) {
  const posMap = useMemo(() => { const m: Record<string, PL> = {}; placements.forEach(p => { m[p.position_code] = p; }); return m; }, [placements]);
  const mainPos = aircraft.positions.main || [];
  const lowerPos = aircraft.positions.lower || [];
  const nosePos = aircraft.positions.nose || [];
  const hasNose = nosePos.length > 0;
  const mainCols = mainPos.length;

  function pColor(code: string): string {
    const pl = posMap[code];
    if (!pl) return "rgba(255,255,255,0.04)";
    const hasDGR = pl.uld.cargo_items.some(ci => { const orig = MOCK.find(m => m.id === ci.cargo_id); return orig?.is_dgr; });
    return hasDGR ? "rgba(245,34,45,0.35)" : "rgba(68,114,196,0.45)";
  }
  function pBorder(code: string): string {
    const pl = posMap[code];
    if (selectedPos === code) return "#FAAD14";
    return pl ? "#4472C4" : "rgba(255,255,255,0.08)";
  }

  // 起始X, 主舱宽度, 每格宽度
  const startX = hasNose ? 70 : 40;
  const totalMainW = hasNose ? 440 : 480;
  const colW = totalMainW / mainCols;

  return (
    <div style={{ background: "#0a1628", borderRadius: 8, padding: 16, color: "#fff", minHeight: 520 }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{aircraft.name_cn}</span>
        <span style={{ fontSize: 11, color: "#5a7ab5", marginLeft: 8 }}>{aircraft.name_en} ({aircraft.iata_code})</span>
      </div>

      <svg width="100%" height="240" viewBox={`0 0 600 240`} style={{ display: "block" }}>
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a5c" /><stop offset="100%" stopColor="#0d2240" />
          </linearGradient>
        </defs>
        {/* 747鼻子 */}
        {hasNose && <path d="M 30,90 Q 5,115 50,140 L 70,140 L 70,70 Z" fill="url(#fg)" stroke="#2a5a8a" strokeWidth="1.5" />}
        {/* 机身主体 */}
        <rect x={startX} y="55" width={totalMainW} height="85" rx="18" fill="url(#fg)" stroke="#2a5a8a" strokeWidth="1.5" />
        {/* 主舱分割线 */}
        {mainPos.map((pos, i) => {
          const x = startX + i * colW;
          return (
            <g key={pos.code}>
              <line x1={x} y1="55" x2={x} y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />
              <text x={x + colW / 2} y="150" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">{pos.code}</text>
              <text x={x + colW / 2} y="162" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7">{pos.label_cn}</text>
              {/* ULD内容 */}
              {(() => { const pl = posMap[pos.code]; if (!pl) return null;
                return (
                  <g>
                    <rect x={x + 2} y="60" width={colW - 4} height="75" rx="4" fill={pColor(pos.code)} stroke={pBorder(pos.code)} strokeWidth="1.5" />
                    <text x={x + colW / 2} y="93" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">{pl.uld.id}</text>
                    <text x={x + colW / 2} y="108" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9">{pl.uld.total_weight_kg}kg</text>
                    <text x={x + colW / 2} y="122" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">{pl.uld.total_volume_m3.toFixed(1)}m³</text>
                  </g>
                );
              })()}
              {/* 点击区域 */}
              <rect x={x} y="55" width={colW} height="85" fill={selectedPos === pos.code ? "rgba(250,173,20,0.1)" : "transparent"} stroke={selectedPos === pos.code ? "#FAAD14" : "transparent"} strokeWidth="2" rx="3"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectPos(selectedPos === pos.code ? null : pos.code)} />
            </g>
          );
        })}
        {/* 垂直尾翼 */}
        <path d={`M ${startX + totalMainW - 30},55 L ${startX + totalMainW + 20},5 L ${startX + totalMainW + 30},55`} fill="#1a3a5c" stroke="#2a5a8a" strokeWidth="1" />
        {/* 下货舱 */}
        <rect x={startX} y="150" width={totalMainW} height="50" rx="4" fill="rgba(10,27,43,0.9)" stroke="#1a3a5c" strokeWidth="1" />
        {lowerPos.length > 0 && lowerPos.map((pos, i) => {
          const lw = totalMainW / lowerPos.length;
          const x = startX + i * lw;
          const pl = posMap[pos.code];
          return (
            <g key={pos.code}>
              <rect x={x + 2} y="152" width={lw - 4} height="46" rx="3" fill={pl ? "rgba(0,176,240,0.2)" : "rgba(0,176,240,0.05)"} stroke={pl ? "#00B0F0" : "rgba(0,176,240,0.15)"} strokeWidth="1" />
              <text x={x + lw / 2} y="171" textAnchor="middle" fill="rgba(0,176,240,0.9)" fontSize="10" fontWeight="600">{pos.code}{pl ? ` ${pl.uld.id}` : ""}</text>
              {pl && <text x={x + lw / 2} y="184" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8">{pl.uld.total_weight_kg}kg</text>}
              {!pl && <text x={x + lw / 2} y="180" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">空</text>}
              <rect x={x + 2} y="152" width={lw - 4} height="46" fill="transparent" style={{ cursor: "pointer" }}
                onClick={() => pl ? onRemoveUld(pos.code) : null} />
            </g>
          );
        })}
        {/* 下舱标签 */}
        <text x={startX + 8} y="148" fill="rgba(0,176,240,0.4)" fontSize="8">LOWER DECK ❄</text>
      </svg>

      {/* 已选仓位信息 */}
      {selectedPos && posMap[selectedPos] && (
        <div style={{ background: "rgba(250,173,20,0.1)", border: "1px solid rgba(250,173,20,0.3)", borderRadius: 6, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "#FAAD14", fontWeight: 600 }}>仓位: {selectedPos} — {posMap[selectedPos].uld.id}</div>
            <div style={{ fontSize: 11, color: "#8c9ab5", marginTop: 3 }}>重量: {posMap[selectedPos].uld.total_weight_kg}kg | 体积: {posMap[selectedPos].uld.total_volume_m3.toFixed(2)}m³ | 计费重: {posMap[selectedPos].uld.billable_weight_kg}kg</div>
          </div>
          <Button size="small" danger onClick={() => onRemoveUld(selectedPos!)} icon={<DeleteOutlined />}>移出</Button>
        </div>
      )}

      {/* 统计栏 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[
          { label: "总重量", value: `${(stats.tW / 1000).toFixed(1)}t`, color: "#4472C4" },
          { label: "重量利用率", value: `${stats.wU.toFixed(1)}%`, color: stats.wU > 95 ? "#F5222D" : stats.wU > 85 ? "#FAAD14" : "#52C41A" },
          { label: "体积利用率", value: `${stats.vU.toFixed(1)}%`, color: stats.vU > 95 ? "#F5222D" : stats.vU > 85 ? "#FAAD14" : "#52C41A" },
          { label: "计费重", value: `${(stats.tB / 1000).toFixed(1)}t`, color: "#722ed1" },
        ].map(item => (
          <div key={item.label} style={{ background: "#132244", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#5a7ab5", marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── 货物标签 ───────────────────────────────────────────────────────────────
function CargoTag({ cargo }: { cargo: CP }) {
  if (cargo.is_dgr) return <Tag icon={<WarningOutlined />} color="error" style={{ fontSize: 11 }}>DGR {cargo.dgr_class} ⚠</Tag>;
  if (cargo.cargo_type === "refrigerated") return <Tag color="processing" style={{ fontSize: 11 }}>❄ 冷链</Tag>;
  if (cargo.cargo_type === "valuable") return <Tag color="gold" style={{ fontSize: 11 }}>💎 贵重</Tag>;
  if (cargo.cargo_type === "live_animal") return <Tag color="success" style={{ fontSize: 11 }}>🐾 活体</Tag>;
  return <Tag style={{ fontSize: 11 }}>普通</Tag>;
}

// ─── 主组件 ───────────────────────────────────────────────────────────────
function LoadPlanningPageContent() {
  const [at, setAt] = useState<string>("B747-400F");
  const [cargo, setCargo] = useState<CP[]>(MOCK.map(c => ({ ...c })));
  const [sc, setSc] = useState<string[]>([]);
  const [ut, setUt] = useState<string>("PMC");
  const [ci, setCi] = useState<UCI[]>([]);
  const [bu, setBu] = useState<BUL[]>([]);
  const [pl, setPl] = useState<PL[]>([]);
  const [sp, setSp] = useState<string | null>(null);
  const [aiR, setAiR] = useState<{ ulds: BUL[]; placements: PL[]; cg_t: CG; cg_c: CG; cg_l: CG } | null>(null);
  const [showAi, setShowAi] = useState(false);
  const [cgPhase, setCgPhase] = useState<"takeoff" | "cruise" | "landing">("takeoff");

  const aircraft = ACD[at];

  // 计算已用件数
  const usedP = useMemo(() => {
    const m: Record<string, number> = {};
    bu.forEach(u => u.cargo_items.forEach(ci => { m[ci.cargo_id] = (m[ci.cargo_id] || 0) + ci.pieces_loaded; }));
    ci.forEach(ci => { m[ci.cargo_id] = (m[ci.cargo_id] || 0) + ci.pieces_loaded; });
    return m;
  }, [bu, ci]);

  // 可用货物（含已用件数）
  const avail = useMemo(() => cargo.map(c => ({ ...c, remaining_pieces: c.pieces - (usedP[c.id] || 0) })).filter(c => c.remaining_pieces > 0), [cargo, usedP]);

  // ULD当前校验
  const valRes = useMemo(() => vULD(ci, cargo, ut), [ci, cargo, ut]);

  // 实时重心
  const cgT = useMemo(() => cCG(pl, aircraft, "takeoff"), [pl, aircraft]);
  const cgC = useMemo(() => cCG(pl, aircraft, "cruise"), [pl, aircraft]);
  const cgL = useMemo(() => cCG(pl, aircraft, "landing"), [pl, aircraft]);
  const cgCur = useMemo(() => cCG(pl, aircraft, cgPhase), [pl, aircraft, cgPhase]);

  // 全局统计
  const stats = useMemo(() => {
    const tW = pl.reduce((s, p) => s + p.uld.total_weight_kg, 0);
    const tV = pl.reduce((s, p) => s + p.uld.total_volume_m3, 0);
    const tB = pl.reduce((s, p) => s + p.uld.billable_weight_kg, 0);
    return {
      tW, tV, tB,
      wU: aircraft.max_payweight_kg > 0 ? (tW / aircraft.max_payweight_kg) * 100 : 0,
      vU: aircraft.max_volume_m3 > 0 ? (tV / aircraft.max_volume_m3) * 100 : 0,
    };
  }, [pl, aircraft]);

  // 把打好的ULD放入仓位
  const placeUld = (code: string) => {
    if (bu.length === 0) return;
    const uld = bu[0];
    const pos = [...(aircraft.positions.main || []), ...(aircraft.positions.nose || []), ...(aircraft.positions.lower || [])].find(p => p.code === code);
    if (!pos) return;
    if (pl.some(p => p.position_code === code)) return;
    setPl(prev => [...prev, { uld, position_code: code, arm_m: pos.arm_m, label_cn: pos.label_cn, deck: pos.deck, row: pos.row }]);
    setBu(prev => prev.slice(1));
    setSp(null);
  };

  // 从仓位移出ULD
  const removeFromPos = (code: string) => {
    const p = pl.find(pl => pl.position_code === code);
    if (!p) return;
    setBu(prev => [{ ...p.uld, status: "building" }, ...prev]);
    setPl(prev => prev.filter(pl => pl.position_code !== code));
  };

  // 确认打板
  const confirmUld = () => {
    if (ci.length === 0) return;
    const nu: BUL = { id: `ULD${bu.length + 1}`, uld_type: ut, cargo_items: [...ci], total_weight_kg: ci.reduce((s, i) => s + i.weight_kg, 0), total_volume_m3: ci.reduce((s, i) => s + i.volume_m3, 0), billable_weight_kg: ci.reduce((s, i) => s + bl(i.weight_kg, i.volume_m3), 0), piece_count: ci.reduce((s, i) => s + i.pieces_loaded, 0), status: "building" };
    setBu(prev => [...prev, nu]);
    setCi([]);
  };

  // AI排舱
  const handleAIPack = () => {
    const rem = cargo.map(c => ({ ...c, remaining_pieces: c.pieces - (usedP[c.id] || 0) })).filter(c => c.remaining_pieces > 0);
    const result = aiPack(rem as CP[], aircraft);
    setAiR(result);
    setShowAi(true);
  };

  // 接受AI方案
  const acceptAIPlan = () => {
    if (!aiR) return;
    setBu(aiR.ulds.map(u => ({ ...u, status: "ready" as const })));
    setPl(aiR.placements);
    // 更新cargo的remaining
    setCargo(prev => prev.map(c => {
      const used = aiR.ulds.reduce((s: number, u) => s + u.cargo_items.filter(ci => ci.cargo_id === c.id).reduce((a, ci) => a + ci.pieces_loaded, 0), 0);
      return { ...c, remaining_pieces: c.pieces - used };
    }));
    setShowAi(false); setAiR(null);
    message.success("AI排舱方案已应用");
  };

  // 拒绝AI方案
  const rejectAIPlan = () => { setShowAi(false); setAiR(null); };

  // 重新AI排舱
  const retryAIPack = () => {
    rejectAIPlan();
    handleAIPack();
  };

  // 重置
  const resetAll = () => {
    setCargo(MOCK.map(c => ({ ...c })));
    setSc([]); setCi([]); setBu([]); setPl([]); setSp(null); setAiR(null); setShowAi(false);
  };

  // 切换货物选中
  const toggleCargo = (id: string) => setSc(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // 把选中货物加入ULD
  const addToUld = () => {
    if (sc.length === 0) return;
    const sel = cargo.filter(c => sc.includes(c.id));
    const newItems: UCI[] = [...ci];
    sel.forEach(c => {
      const rem = c.pieces - (usedP[c.id] || 0);
      if (rem <= 0) return;
      newItems.push({ cargo_id: c.id, pieces_loaded: rem, weight_kg: c.weight_kg, volume_m3: c.volume_m3 });
    });
    setCi(newItems); setSc([]);
  };

  // 重心阶段切换
  const cgOptions = [
    { value: "takeoff", label: `起飞 ${cgT.cgIndex}%` },
    { value: "cruise", label: `巡航 ${cgC.cgIndex}%` },
    { value: "landing", label: `落地 ${cgL.cgIndex}%` },
  ];

  return (
    <div style={{ padding: 20, background: "#f0f2f5", minHeight: "100vh" }}>
      {/* 顶栏 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1F4E79" }}>🗃️ 智能排舱系统</h2>
          <Select value={at} onChange={v => { setAt(v); setPl([]); setBu([]); }} style={{ width: 240 }}
            options={Object.entries(ACD).map(([k, v]) => ({ value: k, label: `${v.name_cn} (${v.iata_code})` }))} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button icon={<ThunderboltOutlined />} style={{ background: "#722ed1", borderColor: "#722ed1", color: "#fff" }} onClick={handleAIPack}>一键AI排舱</Button>
          <Popconfirm title="确定重置所有数据?" onConfirm={resetAll}><Button danger>重置</Button></Popconfirm>
        </div>
      </div>

      {/* 三区横向布局（可滚动） */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
        {/* ── ① 货物清单 ── */}
        <div style={{ minWidth: 320, maxWidth: 360 }}>
          <Card title={<><span>📦</span> 货物清单 ({avail.length}票待排)</>} size="small"
            style={{ borderRadius: 8 }}
            extra={<span style={{ fontSize: 11, color: "#999" }}>点击选中 →</span>}>
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {avail.length === 0 && <div style={{ textAlign: "center", color: "#999", padding: 20 }}>所有货物已装载完毕 ✓</div>}
              {avail.map(c => {
                const sel = sc.includes(c.id);
                const used = usedP[c.id] || 0;
                return (
                  <div key={c.id}
                    onClick={() => toggleCargo(c.id)}
                    style={{
                      background: sel ? "#e6f7ff" : "#fff",
                      border: sel ? "2px solid #1890ff" : "1px solid #f0f0f0",
                      borderRadius: 6, padding: "8px 10px", marginBottom: 6, cursor: "pointer",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{c.awb}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>{c.goods_description}</div>
                      </div>
                      <CargoTag cargo={c} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11, color: "#888" }}>
                      <span>件: <b>{c.pieces - used}/{c.pieces}</b></span>
                      <span>重: <b>{c.weight_kg}kg</b></span>
                      <span>体: <b>{c.volume_m3}m³</b></span>
                      <span>→ {c.destination}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8 }}>
              <Button type="primary" block disabled={sc.length === 0} onClick={addToUld} style={{ background: "#1F4E79" }}>
                加入ULD ({sc.length}票)
              </Button>
            </div>
          </Card>
        </div>

        {/* ── ② ULD打板区 ── */}
        <div style={{ minWidth: 360 }}>
          <Card title={<><span>🗃️</span> ULD打板</>} size="small" style={{ borderRadius: 8 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, marginRight: 8 }}>板型:</span>
              {UT.map(t => (
                <Tag key={t} color={ut === t ? UC[t] : "default"} style={{ cursor: "pointer", marginRight: 4 }} onClick={() => setUt(t)}>{t}</Tag>
              ))}
            </div>

            {/* 当前打板预览 */}
            {ci.length > 0 ? (
              <div style={{ background: "#f0f5ff", border: `2px solid ${valRes.valid ? "#4472C4" : "#F5222D"}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: "#1F4E79", marginBottom: 8 }}>板 {ut} — {ci.reduce((s, i) => s + i.pieces_loaded, 0)}件</div>
                {ci.map(item => {
                  const orig = MOCK.find(m => m.id === item.cargo_id);
                  return (
                    <div key={item.cargo_id} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#333" }}>{orig?.awb} × {item.pieces_loaded}件</span>
                      <span style={{ color: "#666" }}>{orig?.goods_description} | {item.weight_kg}kg | {item.volume_m3.toFixed(2)}m³</span>
                    </div>
                  );
                })}
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
                  <span>合计: {ci.reduce((s, i) => s + i.weight_kg, 0)}kg</span>
                  <span>计费: {ci.reduce((s, i) => s + bl(i.weight_kg, i.volume_m3), 0).toFixed(0)}kg</span>
                  <span>{ci.reduce((s, i) => s + i.volume_m3, 0).toFixed(2)}m³</span>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fafafa", border: "2px dashed #d9d9d9", borderRadius: 8, padding: 24, textAlign: "center", color: "#999", marginBottom: 10 }}>从左侧选择货物后点击"加入ULD"</div>
            )}

            {/* 校验结果 */}
            {ci.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                {valRes.errors.map((e, i) => <Alert key={i} type="error" message={e} style={{ marginBottom: 4, fontSize: 11 }} showIcon />)}
                {valRes.warnings.map((w, i) => <Alert key={i} type="warning" message={w} style={{ marginBottom: 4, fontSize: 11 }} showIcon />)}
                {valRes.valid && ci.length > 0 && <Alert type="success" message="✓ 校验通过" style={{ fontSize: 11 }} showIcon />}
              </div>
            )}

            {/* 板型限重/限体积 */}
            {ci.length > 0 && (
              <div style={{ marginBottom: 10, fontSize: 11, color: "#888" }}>
                <span>限重: {valRes.tW}/{US[ut].max_weight}kg</span>
                <span style={{ marginLeft: 12 }}>限体积: {valRes.tV.toFixed(2)}/{US[ut].max_volume}m³</span>
                <Progress percent={Math.min(100, valRes.volUtil)} size="small" strokeColor={valRes.volUtil > 95 ? "#F5222D" : valRes.volUtil > 80 ? "#FAAD14" : "#4472C4"} style={{ marginTop: 4 }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Button type="primary" block disabled={ci.length === 0 || !valRes.valid} onClick={confirmUld} style={{ background: "#52C41A", borderColor: "#52C41A" }}>确认打板 ✓</Button>
              <Button block disabled={ci.length === 0} onClick={() => setCi([])}>重置</Button>
            </div>

            {/* 已就绪ULD列表 */}
            {bu.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>已就绪ULD（点击放入仓位 →）</div>
                {bu.map((u, i) => (
                  <div key={u.id}
                    onClick={() => setSp(u.id)}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("uldIdx", String(i)); }}
                    style={{
                      background: `${UC[u.uld_type]}18`, border: `1px solid ${UC[u.uld_type]}`,
                      borderRadius: 6, padding: "8px 10px", marginBottom: 6, cursor: "grab",
                      opacity: sp === u.id ? 1 : 0.8,
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Tag color={UC[u.uld_type]} style={{ fontSize: 11 }}>{u.id}</Tag>
                        <Tag style={{ marginLeft: 4, fontSize: 10 }}>{u.uld_type}</Tag>
                        {u.cargo_items.some(ci => MOCK.find(m => m.id === ci.cargo_id)?.is_dgr) && <Tag color="error" style={{ marginLeft: 4, fontSize: 10 }}>⚠DGR</Tag>}
                      </div>
                      <DeleteOutlined style={{ color: "#999" }} onClick={(e) => { e.stopPropagation(); setBu(prev => prev.filter((_, idx) => idx !== i)); }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
                      {u.piece_count}件 | {u.total_weight_kg}kg | {u.total_volume_m3.toFixed(1)}m³ | 计:{u.billable_weight_kg}kg
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── ③ 货舱布局 ── */}
        <div style={{ minWidth: 480, flex: 1 }}>
          <Card
            title={<><span>✈️</span> 货舱布局</>}
            size="small" style={{ borderRadius: 8 }}
            extra={
              <Space>
                <Select size="small" value={cgPhase} onChange={v => setCgPhase(v)} style={{ width: 110 }}
                  options={cgOptions} />
                <span style={{ fontSize: 11, color: "#999" }}>已装: {pl.length}个ULD</span>
              </Space>
            }>
            <div style={{ overflowX: "auto" }}>
              <HoldLayoutSVG aircraft={aircraft} placements={pl} selectedPos={sp} onSelectPos={setSp} onRemoveUld={removeFromPos} stats={stats} />
            </div>
          </Card>

          {/* 重心包线图 */}
          <div style={{ marginTop: 12 }}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <CGEnvelopeChart cg={cgCur} ac={aircraft} />
            </Card>
          </div>

          {/* 三相重心数值 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
            {[{ label: "起飞重心", cg: cgT, color: "#F5222D" }, { label: "巡航重心", cg: cgC, color: "#1890FF" }, { label: "落地重心", cg: cgL, color: "#52C41A" }].map(item => (
              <div key={item.label} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.cg.isInLimits ? item.color : "#F5222D" }}>{item.cg.cgIndex}%</div>
                <div style={{ fontSize: 10, color: item.cg.isInLimits ? "#52C41A" : "#F5222D" }}>
                  {item.cg.isInLimits ? "✓" : "✗"} {item.cg.limitMin}-{item.cg.limitMax}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI排舱结果Modal */}
      <Modal
        title={<span style={{ fontSize: 16 }}>🤖 AI排舱方案预览</span>}
        open={showAi}
        width={700}
        onCancel={rejectAIPlan}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={rejectAIPlan}>拒绝，重新计算</Button>
            <Button onClick={retryAIPack} icon={<ReloadOutlined />}>重新计算</Button>
            <Popconfirm title="确认应用此排舱方案?" onConfirm={acceptAIPlan}>
              <Button type="primary" style={{ background: "#52C41A", borderColor: "#52C41A" }}>确认方案 ✓</Button>
            </Popconfirm>
          </div>
        }>
        {aiR && (
          <div>
            <Alert type="info" message="AI已完成最优排舱方案，请在下方确认或调整。" style={{ marginBottom: 16 }} />
            <Row gutter={12} style={{ marginBottom: 16 }}>
              {[
                { label: "总装载ULD", value: `${aiR.ulds.length}块`, color: "#4472C4" },
                { label: "起飞重心", value: `${aiR.cg_t.cgIndex}%`, color: aiR.cg_t.isInLimits ? "#52C41A" : "#F5222D" },
                { label: "计费重总计", value: `${(aiR.cg_t.totalBillable / 1000).toFixed(1)}t`, color: "#722ed1" },
                { label: "重量利用率", value: `${(aiR.cg_t.totalWeight / aircraft.max_payweight_kg * 100).toFixed(1)}%`, color: "#FAAD14" },
                { label: "体积利用率", value: `${(aiR.cg_t.totalVolume / aircraft.max_volume_m3 * 100).toFixed(1)}%`, color: "#FAAD14" },
                { label: "预计收入", value: `¥${(aiR.cg_t.totalBillable * 14.4 / 10000).toFixed(0)}万`, color: "#52C41A" },
              ].map(item => (
                <Col span={8} key={item.label}>
                  <div style={{ background: "#f0f5ff", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
            {/* ULD列表 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>ULD装载明细</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {aiR.ulds.map(u => (
                  <div key={u.id} style={{ background: `${UC[u.uld_type]}18`, border: `1px solid ${UC[u.uld_type]}`, borderRadius: 6, padding: "8px 12px", minWidth: 140 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: UC[u.uld_type] }}>{u.id} <span style={{ fontSize: 10, color: "#666" }}>({u.uld_type})</span></div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{u.piece_count}件 | {u.total_weight_kg}kg | {u.total_volume_m3.toFixed(1)}m³</div>
                    <div style={{ fontSize: 11, color: "#722ed1" }}>计费: {u.billable_weight_kg}kg</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 布局位置 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>仓位布局</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {aiR.placements.map(p => (
                  <Tag key={p.position_code} style={{ padding: "4px 10px", fontSize: 12 }}>{p.position_code}: {p.uld.id}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function LoadPlanningPage() {
  return <LoadPlanningErrorBoundary><LoadPlanningPageContent /></LoadPlanningErrorBoundary>;
}

