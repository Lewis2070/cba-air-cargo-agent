// CargoHold3D.tsx - CSS 3D Aircraft Cargo Hold Visualization
import React, { useState } from "react";
import { Button, Tag, Space, Tooltip } from "antd";
import { AppstoreOutlined, BorderOutlined } from "@antant-design/icons";

// ─── Data models (mirrored from LoadPlanningPage) ────────────────────────────
interface UCI { cargo_id: string; pieces_loaded: number; weight_kg: number; volume_m3: number; }
interface BUL { id: string; uld_type: string; cargo_items: UCI[]; total_weight_kg: number; total_volume_m3: number; billable_weight_kg: number; piece_count: number; status: "building" | "ready"; }
interface PL { uld: BUL; position_code: string; arm_m: number; label_cn: string; deck: string; row: string; }
interface AC { name_cn: string; name_en: string; iata_code: string; max_payweight_kg: number; max_volume_m3: number; mac_m: number; mac_leading_edge_m: number; cg_limits: any; positions: { nose?: any[]; main: any[]; lower: any[] } }

const UC: Record<string, string> = {
  P1P: "#1F4E79", PAG: "#2E75B6", PMC: "#4472C4", AKE: "#5B9BD5", AVP: "#70AD47", RKN: "#00B0F0"
};
const DECK_COLORS: Record<string, string> = {
  main: "rgba(68, 114, 196, 0.15)",
  nose: "rgba(245, 162, 50, 0.12)",
  lower: "rgba(0, 176, 240, 0.1)",
};

// ─── Individual 3D ULD Block ─────────────────────────────────────────────────
function ULDBlock3D({
  uld,
  x,
  z,
  deck,
  onHover,
  hovered
}: {
  uld: BUL;
  x: number;
  z: number;
  deck: string;
  onHover: (code: string | null) => void;
  hovered: string | null;
}) {
  const color = UC[uld.uld_type] || "#4472C4";
  const w = 80, h = 55, d = 45;
  const isHovered = hovered === uld.id;
  const scale = isHovered ? 1.06 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: z,
        width: w,
        height: h,
        transformStyle: "preserve-3d",
        transform: `scale(${scale})`,
        transition: "transform 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={() => onHover(uld.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Front face */}
      <div style={{
        position: "absolute",
        width: w,
        height: h,
        transform: `translateZ(${d}px)`,
        background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
        border: `2px solid ${color}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isHovered ? `0 0 16px ${color}88` : `0 4px 12px rgba(0,0,0,0.3)`,
        overflow: "hidden",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{uld.id}</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>{uld.uld_type}</div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{uld.total_weight_kg}kg</div>
      </div>
      {/* Back face */}
      <div style={{
        position: "absolute",
        width: w,
        height: h,
        transform: `translateZ(0) rotateY(180deg)`,
        background: `${color}44`,
        border: `1px solid ${color}66`,
        borderRadius: 6,
      }} />
      {/* Top face */}
      <div style={{
        position: "absolute",
        width: w,
        height: d,
        transform: `translateY(-${d}px) rotateX(90deg)`,
        background: `${color}aa`,
        border: `1px solid ${color}`,
        borderRadius: 4,
      }} />
      {/* Bottom face */}
      <div style={{
        position: "absolute",
        width: w,
        height: d,
        transform: `translateY(${h}px) rotateX(-90deg)`,
        background: `${color}33`,
        border: `1px solid ${color}44`,
        borderRadius: 4,
      }} />
      {/* Left face */}
      <div style={{
        position: "absolute",
        width: d,
        height: h,
        transform: `translateX(-${d}px) rotateY(-90deg)`,
        background: `${color}88`,
        border: `1px solid ${color}88`,
        borderRadius: 4,
      }} />
      {/* Right face */}
      <div style={{
        position: "absolute",
        width: d,
        height: h,
        right: -d,
        transform: `translateX(${d}px) rotateY(90deg)`,
        background: `${color}66`,
        border: `1px solid ${color}66`,
        borderRadius: 4,
      }} />
    </div>
  );
}

// ─── Empty position outline ───────────────────────────────────────────────────
function EmptySlot3D({ label, x, z, deck }: { label: string; x: number; z: number; deck: string }) {
  const w = 76, h = 52;
  const color = deck === "main" ? "#4472C4" : deck === "nose" ? "#FA9600" : "#00B0F0";
  return (
    <div style={{
      position: "absolute",
      left: x,
      top: z,
      width: w,
      height: h,
      border: `2px dashed ${color}55`,
      borderRadius: 6,
      background: `${color}08`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <span style={{ fontSize: 9, color: `${color}66`, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── Deck surface ────────────────────────────────────────────────────────────
function DeckSurface({
  positions,
  placements,
  posMap,
  deckName,
  offsetX,
  offsetZ,
  hoverUld,
  onHoverUld
}: {
  positions: any[];
  placements: PL[];
  posMap: Record<string, PL>;
  deckName: string;
  offsetX: number;
  offsetZ: number;
  hoverUld: string | null;
  onHoverUld: (id: string | null) => void;
}) {
  const deckColor = DECK_COLORS[deckName] || "rgba(68,114,196,0.12)";
  const borderColor = deckName === "main" ? "#4472C4" : deckName === "nose" ? "#FA9600" : "#00B0F0";
  const deckLabel = deckName === "main" ? "主舱 MAIN DECK" : deckName === "nose" ? "鼻舱 NOSE" : "下舱 LOWER DECK";

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: borderColor, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
        {deckLabel}
      </div>
      <div style={{
        position: "relative",
        width: positions.length * 100,
        height: 100,
        background: deckColor,
        border: `1px solid ${borderColor}33`,
        borderRadius: 8,
        padding: 10,
      }}>
        {positions.map((pos: any, i: number) => {
          const pl = posMap[pos.code];
          return (
            <div key={pos.code} style={{ position: "relative", display: "inline-block", marginRight: 10 }}>
              {pl ? (
                <ULDBlock3D
                  uld={pl.uld}
                  x={0}
                  z={0}
                  deck={deckName}
                  onHover={(id) => onHoverUld(id)}
                  hovered={hoverUld}
                />
              ) : (
                <EmptySlot3D label={pos.code} x={0} z={0} deck={deckName} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main CargoHold3D component ─────────────────────────────────────────────
interface Props {
  aircraft: AC;
  placements: PL[];
}

export default function CargoHold3D({ aircraft, placements }: Props) {
  const [hoveredUld, setHoveredUld] = useState<string | null>(null);
  const posMap = React.useMemo(() => {
    const m: Record<string, PL> = {};
    placements.forEach(p => { m[p.position_code] = p; });
    return m;
  }, [placements]);

  const mainPos = aircraft.positions.main || [];
  const lowerPos = aircraft.positions.lower || [];
  const nosePos = aircraft.positions.nose || [];

  // hovered placement info
  const hoveredPL = hoveredUld ? placements.find(p => p.uld.id === hoveredUld) : null;

  return (
    <div style={{ background: "#0a1628", borderRadius: 8, padding: 16, color: "#fff", minHeight: 480 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{aircraft.name_cn}</span>
        <span style={{ fontSize: 11, color: "#5a7ab5", marginLeft: 8 }}>{aircraft.name_en} ({aircraft.iata_code}) — 3D视图</span>
      </div>

      {/* 3D scene */}
      <div style={{
        perspective: 900,
        perspectiveOrigin: "50% 40%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        minHeight: 320,
      }}>
        {/* Main 3D container */}
        <div style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(55deg) rotateZ(-20deg)",
          transformOrigin: "center center",
          position: "relative",
          width: Math.max(mainPos.length * 110 + 80, 500),
          height: 420,
        }}>
          {/* Background grid */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(68,114,196,0.06) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(68,114,196,0.06) 40px)",
            transform: "translateZ(-2px)",
            borderRadius: 8,
          }} />

          {/* Nose deck */}
          {nosePos.length > 0 && (
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: "translateZ(0px)",
              transformStyle: "preserve-3d",
            }}>
              <div style={{
                transform: "rotateY(0deg) translateZ(0px)",
                padding: "8px",
              }}>
                <div style={{ fontSize: 9, color: "#FA9600", fontWeight: 600, marginBottom: 4 }}>鼻舱 NOSE</div>
                <div style={{ position: "relative", width: nosePos.length * 95, height: 90 }}>
                  {nosePos.map((pos: any) => {
                    const pl = posMap[pos.code];
                    return (
                      <div key={pos.code} style={{ position: "relative", display: "inline-block", marginRight: 8 }}>
                        {pl ? (
                          <ULDBlock3D uld={pl.uld} x={0} z={0} deck="nose" onHover={setHoveredUld} hovered={hoveredUld} />
                        ) : (
                          <EmptySlot3D label={pos.code} x={0} z={0} deck="nose" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Main deck */}
          <div style={{
            position: "absolute",
            left: nosePos.length > 0 ? nosePos.length * 100 : 0,
            top: 0,
            transform: "translateZ(0px)",
            transformStyle: "preserve-3d",
          }}>
            <div style={{ padding: "8px" }}>
              <div style={{ fontSize: 9, color: "#4472C4", fontWeight: 600, marginBottom: 4 }}>主舱 MAIN DECK</div>
              <div style={{ position: "relative", width: mainPos.length * 105, height: 100 }}>
                {mainPos.map((pos: any) => {
                  const pl = posMap[pos.code];
                  return (
                    <div key={pos.code} style={{ position: "relative", display: "inline-block", marginRight: 12 }}>
                      {pl ? (
                        <ULDBlock3D uld={pl.uld} x={0} z={0} deck="main" onHover={setHoveredUld} hovered={hoveredUld} />
                      ) : (
                        <EmptySlot3D label={pos.code} x={0} z={0} deck="main" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lower deck */}
          {lowerPos.length > 0 && (
            <div style={{
              position: "absolute",
              left: nosePos.length > 0 ? nosePos.length * 100 : 0,
              top: 130,
              transform: "translateZ(-60px) rotateX(-10deg)",
              transformStyle: "preserve-3d",
            }}>
              <div style={{ padding: "8px", background: "rgba(0,176,240,0.04)", borderRadius: 6, border: "1px solid rgba(0,176,240,0.15)" }}>
                <div style={{ fontSize: 9, color: "#00B0F0", fontWeight: 600, marginBottom: 4 }}>下舱 LOWER DECK ❄</div>
                <div style={{ position: "relative", width: lowerPos.length * 105, height: 90 }}>
                  {lowerPos.map((pos: any) => {
                    const pl = posMap[pos.code];
                    return (
                      <div key={pos.code} style={{ position: "relative", display: "inline-block", marginRight: 12 }}>
                        {pl ? (
                          <ULDBlock3D uld={pl.uld} x={0} z={0} deck="lower" onHover={setHoveredUld} hovered={hoveredUld} />
                        ) : (
                          <EmptySlot3D label={pos.code} x={0} z={0} deck="lower" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Aircraft body outline */}
          <div style={{
            position: "absolute",
            left: 0,
            top: -10,
            width: (nosePos.length > 0 ? nosePos.length * 100 : 0) + mainPos.length * 105 + 40,
            height: 200,
            border: "1px solid rgba(68,114,196,0.2)",
            borderRadius: 20,
            transform: "translateZ(-5px)",
            background: "linear-gradient(180deg, rgba(68,114,196,0.04) 0%, rgba(0,0,0,0) 100%)",
          }} />

          {/* Nose cone tip */}
          {nosePos.length > 0 && (
            <div style={{
              position: "absolute",
              left: -20,
              top: 30,
              width: 40,
              height: 80,
              borderLeft: "2px solid rgba(250,150,0,0.4)",
              borderTop: "2px solid rgba(250,150,0,0.4)",
              borderBottom: "2px solid rgba(250,150,0,0.4)",
              borderRadius: "50% 0 0 50%",
              transform: "rotateZ(5deg)",
              background: "rgba(250,150,0,0.05)",
            }} />
          )}
        </div>
      </div>

      {/* Hover info */}
      {hoveredPL && (
        <div style={{
          background: "rgba(250,173,20,0.1)",
          border: "1px solid rgba(250,173,20,0.4)",
          borderRadius: 6,
          padding: "8px 12px",
          marginTop: 10,
          display: "flex",
          gap: 16,
          fontSize: 12,
        }}>
          <div style={{ color: "#FAAD14", fontWeight: 600 }}>仓位: {hoveredPL.position_code}</div>
          <div style={{ color: "#fff" }}>ULD: {hoveredPL.uld.id} ({hoveredPL.uld.uld_type})</div>
          <div style={{ color: "#fff" }}>重量: {hoveredPL.uld.total_weight_kg}kg</div>
          <div style={{ color: "#fff" }}>体积: {hoveredPL.uld.total_volume_m3.toFixed(2)}m³</div>
          <div style={{ color: "#fff" }}>计费重: {hoveredPL.uld.billable_weight_kg}kg</div>
          <div style={{ color: "#fff" }}>件数: {hoveredPL.uld.piece_count}件</div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 10, color: "#5a7ab5" }}>
        <span>■ <span style={{ color: "#4472C4" }}>主舱 MAIN</span></span>
        <span>■ <span style={{ color: "#FA9600" }}>鼻舱 NOSE</span></span>
        <span>■ <span style={{ color: "#00B0F0" }}>下舱 LOWER</span></span>
        <span>□ <span style={{ color: "#5a7ab5" }}>空仓位</span></span>
        <span style={{ marginLeft: "auto", color: "#8c9ab5" }}>
          已装载: {placements.length}个ULD | 悬停查看详情
        </span>
      </div>
    </div>
  );
}
