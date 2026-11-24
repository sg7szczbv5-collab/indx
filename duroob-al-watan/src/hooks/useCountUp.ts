import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** عدّاد رقمي متحرك يبدأ عند ظهور الشريحة */
export function useCountUp(target: number, duration = 2, delay = 0) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target, duration, delay, reduce]);

  return value;
}
