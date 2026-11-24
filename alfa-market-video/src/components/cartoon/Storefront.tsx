import { COLORS } from "../../constants";
import { AlfaLogoGlyphs } from "./LogoGlyphs";

const O = COLORS.outline;

type Props = React.SVGProps<SVGSVGElement> & {
  frame: number;
  /** 0 closed … 1 fully slid open */
  doorOpen?: number;
  /** 0..1 roof lamp glow */
  lamps?: number;
  /** draw the shop sign on the facade */
  showSign?: boolean;
};

/**
 * Cartoon version of the real Alfa Market branch: dark grey striped facade,
 * green-framed glass entrance, white side walls, roof flood-lamps, bollards
 * and green turf strips. viewBox 0 0 1000 900.
 */
export const Storefront: React.FC<Props> = ({ frame, doorOpen = 0, lamps = 1, showSign = true, ...svg }) => {
  const slide = doorOpen * 78;
  return (
    <svg viewBox="0 0 1000 900" style={{ overflow: "visible" }} {...svg}>
      <defs>
        <linearGradient id="sfGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E6F6FD" />
          <stop offset="1" stopColor={COLORS.glassDeep} />
        </linearGradient>
        <radialGradient id="sfGlow">
          <stop offset="0" stopColor="#FEF9C3" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FEF9C3" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* ground shadow */}
      <ellipse cx={500} cy={860} rx={520} ry={30} fill="#000" opacity={0.08} />
      {/* roof lamps (leaf-like flood lights) */}
      {[150, 385, 615, 850].map((lx, i) => (
        <g key={lx} transform={`translate(${lx} 130)`}>
          <circle cx={0} cy={-80} r={70} fill="url(#sfGlow)" opacity={lamps * (0.7 + 0.3 * Math.sin(frame * 0.2 + i))} />
          <rect x={-6} y={-40} width={12} height={40} fill="#374151" stroke={O} strokeWidth={4} />
          <ellipse cx={0} cy={-80} rx={20} ry={48} fill="#374151" stroke={O} strokeWidth={5} transform={`rotate(${i < 2 ? 18 : -18} 0 -80)`} />
          <ellipse cx={0} cy={-80} rx={9} ry={34} fill="#FEF08A" opacity={0.3 + lamps * 0.7} transform={`rotate(${i < 2 ? 18 : -18} 0 -80)`} />
        </g>
      ))}
      {/* facade */}
      <rect x={0} y={130} width={1000} height={350} rx={10} fill={COLORS.facade} stroke={O} strokeWidth={8} />
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1={6} x2={994} y1={150 + i * 23} y2={150 + i * 23} stroke={COLORS.facadeLine} strokeWidth={6} />
      ))}
      {showSign && (
        <g transform="translate(500 300)">
          <AlfaLogoGlyphs frame={frame} scale={0.62} />
        </g>
      )}
      {/* lower white section */}
      <rect x={0} y={478} width={1000} height={320} fill="#FAFAF9" stroke={O} strokeWidth={8} />
      <rect x={0} y={472} width={1000} height={22} fill={COLORS.green} stroke={O} strokeWidth={6} />
      {/* side windows */}
      {[
        [70, 260],
        [730, 200],
      ].map(([wx, ww]) => (
        <g key={wx}>
          <rect x={wx} y={500} width={ww} height={290} fill="url(#sfGlass)" stroke={COLORS.green} strokeWidth={14} />
          <rect x={wx} y={500} width={ww} height={290} fill="none" stroke={O} strokeWidth={4} />
          <path d={`M ${wx + 20} 780 L ${wx + 90} 520`} stroke="#fff" strokeWidth={14} opacity={0.55} />
          <path d={`M ${wx + 60} 780 L ${wx + 110} 600`} stroke="#fff" strokeWidth={7} opacity={0.45} />
        </g>
      ))}
      {/* small Alfa decal on left window */}
      <g transform="translate(200 600) scale(0.5)">
        <rect x={-80} y={-50} width={160} height={110} rx={12} fill="#fff" opacity={0.85} />
        <AlfaLogoGlyphs frame={frame} scale={0.2} />
      </g>
      {/* entrance: frame rises above the green band like the real one */}
      <rect x={322} y={418} width={356} height={392} fill={COLORS.green} stroke={O} strokeWidth={8} />
      {/* interior */}
      <rect x={346} y={466} width={308} height={334} fill="#FFF7E0" />
      {[520, 600, 680].map((sy, i) => (
        <g key={sy}>
          <rect x={360} y={sy} width={280} height={10} fill="#D6D3D1" />
          {Array.from({ length: 9 }).map((__, j) => (
            <rect
              key={j}
              x={366 + j * 30}
              y={sy - 34}
              width={22}
              height={34}
              rx={4}
              fill={[COLORS.red, COLORS.greenLight, "#FACC15", "#38BDF8", "#F97316"][(i + j) % 5]}
              opacity={0.85}
            />
          ))}
        </g>
      ))}
      {[400, 500, 600].map((cx) => (
        <rect key={cx} x={cx - 30} y={474} width={60} height={8} rx={4} fill="#fff" opacity={0.95} />
      ))}
      {/* sliding glass doors */}
      <g transform={`translate(${-slide} 0)`}>
        <rect x={346} y={466} width={154} height={334} fill="url(#sfGlass)" opacity={0.6} stroke={O} strokeWidth={4} />
        <rect x={490} y={600} width={6} height={60} rx={3} fill="#9CA3AF" />
        <path d="M 370 780 L 430 500" stroke="#fff" strokeWidth={10} opacity={0.6} />
      </g>
      <g transform={`translate(${slide} 0)`}>
        <rect x={500} y={466} width={154} height={334} fill="url(#sfGlass)" opacity={0.6} stroke={O} strokeWidth={4} />
        <rect x={504} y={600} width={6} height={60} rx={3} fill="#9CA3AF" />
        <path d="M 530 780 L 590 500" stroke="#fff" strokeWidth={10} opacity={0.6} />
      </g>
      {/* re-draw entrance side posts over sliding doors */}
      <rect x={322} y={466} width={24} height={344} fill={COLORS.green} stroke={O} strokeWidth={6} />
      <rect x={654} y={466} width={24} height={344} fill={COLORS.green} stroke={O} strokeWidth={6} />
      {/* sidewalk */}
      <rect x={-20} y={798} width={1040} height={40} fill="#E7E5E4" stroke={O} strokeWidth={6} />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1={i * 90} y1={800} x2={i * 90} y2={836} stroke="#D6D3D1" strokeWidth={4} />
      ))}
      {/* turf strips */}
      <path d="M 40 838 L 220 838 L 150 890 L -30 890 Z" fill={COLORS.green} stroke={O} strokeWidth={5} />
      <path d="M 780 838 L 960 838 L 1030 890 L 850 890 Z" fill={COLORS.green} stroke={O} strokeWidth={5} />
      {/* bollards */}
      {[360, 455, 545, 640].map((bx) => (
        <g key={bx}>
          <rect x={bx - 11} y={770} width={22} height={100} rx={8} fill="#1F2937" stroke={O} strokeWidth={4} />
          <rect x={bx - 11} y={790} width={22} height={10} fill="#FACC15" />
        </g>
      ))}
    </svg>
  );
};
