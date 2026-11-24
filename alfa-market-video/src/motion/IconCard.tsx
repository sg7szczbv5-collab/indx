import { Icon, IconName } from "./icons";
import { FONT, M } from "./theme";

/** Small rounded outline card holding a line icon (reference "scene" boxes). */
export const IconCard: React.FC<{
  x: number;
  y: number;
  icon: IconName;
  p: number;
  active?: number;
  label?: string;
  onLight?: boolean;
  tone?: "green" | "red";
  size?: number;
}> = ({ x, y, icon, p, active = 0, label, onLight = false, tone = "green", size = 130 }) => {
  if (p <= 0) return null;
  const c = tone === "green" ? M.mint : M.redGlow;
  const rgb = tone === "green" ? "34,197,94" : "220,38,38";
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size * 1.2,
        borderRadius: 26,
        border: `3px solid ${active > 0.5 ? c : onLight ? "rgba(10,26,17,0.25)" : "rgba(220,255,232,0.3)"}`,
        background: onLight ? "#fff" : M.pillDark,
        boxShadow: `0 0 ${20 + 40 * active}px rgba(${rgb},${0.1 + 0.4 * active})`,
        transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 40}px)`,
        opacity: p,
        filter: `blur(${(1 - p) * 8}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: active > 0.5 ? c : onLight ? M.ink : M.text,
      }}
    >
      <Icon name={icon} size={size * 0.45} />
      {label && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size * 0.17 }}>{label}</div>}
    </div>
  );
};
