const S = { fill: "none", stroke: "currentColor", strokeWidth: 3.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export type IconName =
  | "cup" | "bread" | "milk" | "leaf" | "basket" | "tag" | "percent" | "pin" | "home" | "store"
  | "apple" | "carrot" | "lettuce" | "bottle" | "can" | "spray" | "clock";

/** Minimal line icons (48x48). */
export const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 44 }) => {
  const p = (() => {
    switch (name) {
      case "cup":
        return (<><path d="M10 18 h24 v12 a10 10 0 0 1 -10 10 h-4 a10 10 0 0 1 -10 -10 z" {...S} /><path d="M34 21 h3 a5 5 0 0 1 0 10 h-3" {...S} /><path d="M17 6 q-3 4 0 7 M23 6 q-3 4 0 7" {...S} /></>);
      case "bread":
        return (<><path d="M9 38 v-14 a8 8 0 0 1 2 -14 h26 a8 8 0 0 1 2 14 v14 z" {...S} /><path d="M18 18 l4 5 M26 16 l4 5" {...S} /></>);
      case "milk":
        return (<><path d="M14 16 l5 -8 h10 l5 8 v26 h-20 z" {...S} /><path d="M14 16 h20 M14 28 h20" {...S} /></>);
      case "leaf":
        return (<><path d="M10 38 C 8 18 22 8 40 8 C 40 28 30 40 10 38 Z" {...S} /><path d="M10 38 L 28 20" {...S} /></>);
      case "basket":
        return (<><path d="M6 18 h36 l-4 22 h-28 z" {...S} /><path d="M15 18 l7 -10 M33 18 l-7 -10 M17 26 v8 M24 26 v8 M31 26 v8" {...S} /></>);
      case "tag":
        return (<><path d="M24 6 h16 v16 l-18 18 l-16 -16 z" {...S} /><circle cx={33} cy={14} r={3} {...S} /></>);
      case "percent":
        return (<><path d="M36 10 L 12 38" {...S} /><circle cx={14} cy={14} r={5} {...S} /><circle cx={34} cy={34} r={5} {...S} /></>);
      case "pin":
        return (<><path d="M24 44 C 16 34 10 27 10 19 a14 14 0 0 1 28 0 c0 8 -6 15 -14 25 z" {...S} /><circle cx={24} cy={19} r={5} {...S} /></>);
      case "home":
        return (<><path d="M6 22 L24 7 L42 22" {...S} /><path d="M11 19 v22 h26 v-22 M20 41 v-12 h8 v12" {...S} /></>);
      case "store":
        return (<><path d="M6 18 l4 -10 h28 l4 10 z M8 18 v22 h32 v-22" {...S} /><path d="M19 40 v-12 h10 v12" {...S} /></>);
      case "apple":
        return (<><path d="M24 14 c-6 -5 -16 -2 -16 9 c0 10 7 19 12 19 c2 0 3 -1 4 -1 s2 1 4 1 c5 0 12 -9 12 -19 c0 -11 -10 -14 -16 -9 z" {...S} /><path d="M24 14 q0 -6 5 -9" {...S} /></>);
      case "carrot":
        return (<><path d="M34 14 L 8 42 L 14 20 Q 22 10 34 14 Z" {...S} /><path d="M34 14 l8 -6 M34 14 l2 -10 M34 14 l10 0" {...S} /></>);
      case "lettuce":
        return (<><circle cx={24} cy={26} r={15} {...S} /><path d="M24 41 V 18 M24 28 l-7 -6 M24 24 l7 -6" {...S} /></>);
      case "bottle":
        return (<><path d="M19 4 h10 v8 l4 6 v24 h-18 v-24 l4 -6 z" {...S} /><path d="M15 24 h18" {...S} /></>);
      case "can":
        return (<><ellipse cx={24} cy={10} rx={12} ry={4} {...S} /><path d="M12 10 v28 a12 4 0 0 0 24 0 v-28" {...S} /><path d="M12 22 h24" {...S} /></>);
      case "spray":
        return (<><path d="M14 18 h16 v24 h-16 z M18 18 v-6 h10 l6 -4 M28 12 v6" {...S} /><path d="M38 12 h3 M38 6 l2 -2" {...S} /></>);
      case "clock":
        return (<><circle cx={24} cy={24} r={17} {...S} /><path d="M24 14 v10 l7 5" {...S} /></>);
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      {p}
    </svg>
  );
};
