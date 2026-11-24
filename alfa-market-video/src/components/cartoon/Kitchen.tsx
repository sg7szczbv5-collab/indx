import { COLORS } from "../../constants";

const O = COLORS.outline;

/** Warm cartoon kitchen backdrop drawn in the 1080x1920 scene space. */
export const KitchenBackdrop: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill="#FFF1D6" />
    {/* wall stripes */}
    {Array.from({ length: 14 }).map((_, i) => (
      <rect key={i} x={i * 80} y={0} width={40} height={1300} fill="#FFE8BF" opacity={0.6} />
    ))}
    {/* window */}
    <g transform="translate(110 470)">
      <rect width={300} height={300} rx={24} fill={COLORS.sky} stroke={O} strokeWidth={8} />
      <circle cx={230} cy={80} r={38} fill="#FDE047" />
      <path d="M 0 230 Q 80 180 150 230 Q 220 190 300 230 L 300 300 L 0 300 Z" fill={COLORS.greenLight} />
      <path d="M 150 0 L 150 300 M 0 150 L 300 150" stroke={O} strokeWidth={8} />
      <path d="M -20 -10 Q 40 160 -10 320 L -30 320 L -30 -10 Z" fill={COLORS.red} stroke={O} strokeWidth={5} />
      <path d="M 320 -10 Q 260 160 310 320 L 330 320 L 330 -10 Z" fill={COLORS.red} stroke={O} strokeWidth={5} />
      <rect x={-40} y={-24} width={380} height={20} rx={10} fill="#B45309" stroke={O} strokeWidth={5} />
    </g>
    {/* tile splash band */}
    <rect x={0} y={1180} width={1080} height={300} fill="#FDF6E3" />
    {Array.from({ length: 14 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 80} y1={1180} x2={i * 80} y2={1480} stroke="#F3DDB0" strokeWidth={4} />
    ))}
    {Array.from({ length: 4 }).map((_, i) => (
      <line key={`h${i}`} x1={0} y1={1180 + i * 75} x2={1080} y2={1180 + i * 75} stroke="#F3DDB0" strokeWidth={4} />
    ))}
    {/* counter on the right */}
    <rect x={540} y={1460} width={560} height={40} rx={10} fill="#E5E7EB" stroke={O} strokeWidth={6} />
    <rect x={560} y={1500} width={540} height={300} fill="#B45309" stroke={O} strokeWidth={6} />
    <rect x={590} y={1530} width={220} height={240} rx={14} fill="#D97706" stroke={O} strokeWidth={5} />
    <rect x={840} y={1530} width={220} height={240} rx={14} fill="#D97706" stroke={O} strokeWidth={5} />
    {/* plant on counter */}
    <g transform="translate(980 1460)">
      <path d="M -36 0 L -28 -60 L 28 -60 L 36 0 Z" fill={COLORS.red} stroke={O} strokeWidth={5} transform="scale(1 -1) translate(0 60)" />
      <path d="M 0 -70 Q -60 -130 -20 -170 Q 10 -120 0 -70 Z" fill={COLORS.green} stroke={O} strokeWidth={5} />
      <path d="M 0 -70 Q 60 -140 30 -180 Q -6 -130 0 -70 Z" fill={COLORS.greenLight} stroke={O} strokeWidth={5} />
    </g>
    {/* floor */}
    <rect x={0} y={1780} width={1080} height={140} fill="#F5D0A9" stroke={O} strokeWidth={6} />
    {Array.from({ length: 6 }).map((_, i) => (
      <line key={`f${i}`} x1={i * 200 + 60} y1={1780} x2={i * 200 + 20} y2={1920} stroke="#E7B98A" strokeWidth={5} />
    ))}
  </g>
);

/**
 * Cartoon fridge. Hinge on the left edge.
 * `open` goes 0 → 1 (door swings ~110°).
 */
export const Fridge: React.FC<{ x: number; y: number; open: number; frame: number }> = ({ x, y, open, frame }) => {
  const w = 380;
  const h = 860;
  const theta = (open * 112 * Math.PI) / 180;
  const xe = w * Math.cos(theta);
  const k = Math.sin(theta) * 46;
  const showingFront = Math.cos(theta) > 0;
  const glow = Math.min(1, open * 1.6);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={w / 2} cy={h + 6} rx={w * 0.6} ry={18} fill="#000" opacity={0.12} />
      {/* body */}
      <rect x={0} y={0} width={w} height={h} rx={38} fill="#DCEBF5" stroke={O} strokeWidth={8} />
      {/* interior */}
      <rect x={24} y={24} width={w - 48} height={h - 48} rx={22} fill="#F8FAFC" stroke={O} strokeWidth={5} />
      <rect x={24} y={24} width={w - 48} height={h - 48} rx={22} fill="#FEF9C3" opacity={glow * 0.6} />
      <circle cx={w / 2} cy={60} r={20} fill="#FDE047" opacity={glow} stroke={O} strokeWidth={4} />
      {[240, 450, 650].map((sy) => (
        <rect key={sy} x={30} y={sy} width={w - 60} height={12} rx={6} fill="#BFDBFE" stroke={O} strokeWidth={4} />
      ))}
      {/* sad empty-fridge details: dust puffs + a lonely crumb */}
      <g opacity={glow}>
        {[0, 1, 2].map((i) => {
          const t = ((frame + i * 12) % 36) / 36;
          return (
            <circle
              key={i}
              cx={120 + i * 70}
              cy={430 - t * 40}
              r={8 + t * 6}
              fill="#CBD5E1"
              opacity={1 - t}
            />
          );
        })}
        <circle cx={260} cy={635} r={7} fill="#D97706" stroke={O} strokeWidth={3} />
      </g>
      {/* door */}
      <g>
        <path
          d={`M 0 0 L ${xe} ${-k} L ${xe} ${h + k} L 0 ${h} Z`}
          fill={showingFront ? "#E8F2FA" : "#CBD9E6"}
          stroke={O}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        {showingFront ? (
          <>
            <path
              d={`M 0 300 L ${xe} ${300 - k * 0.3} `}
              stroke={O}
              strokeWidth={6}
            />
            <rect
              x={xe - 50 * Math.cos(theta) - 10}
              y={340}
              width={18}
              height={170}
              rx={9}
              fill="#94A3B8"
              stroke={O}
              strokeWidth={5}
            />
            <rect
              x={xe - 50 * Math.cos(theta) - 10}
              y={130}
              width={18}
              height={120}
              rx={9}
              fill="#94A3B8"
              stroke={O}
              strokeWidth={5}
            />
            {/* fridge magnet leaf */}
            <path
              d={`M ${xe * 0.4} 560 q 30 -40 60 0 q -30 30 -60 0 z`}
              fill={COLORS.green}
              stroke={O}
              strokeWidth={4}
            />
          </>
        ) : (
          [220, 430, 640].map((sy) => (
            <rect
              key={sy}
              x={Math.min(0, xe) + 12}
              y={sy}
              width={Math.abs(xe) - 24}
              height={40}
              rx={8}
              fill="#E2E8F0"
              stroke={O}
              strokeWidth={4}
            />
          ))
        )}
      </g>
    </g>
  );
};
