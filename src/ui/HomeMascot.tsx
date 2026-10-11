import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

/** Decorative companion. Keyboard feedback comes from the real primary action. */
export function HomeMascot({ attention }: { attention: boolean }) {
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const inView = useRef(true);
  const [visible, setVisible] = useState(true);
  const [curious, setCurious] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reopenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const easedX = useSpring(pointerX, { stiffness: 130, damping: 20, mass: 0.75 });
  const easedY = useSpring(pointerY, { stiffness: 130, damping: 20, mass: 0.75 });
  const lookX = useTransform(easedX, [-1, 1], reducedMotion ? [0, 0] : [-1.5, 1.5]);
  const lookY = useTransform(easedY, [-1, 1], reducedMotion ? [0, 0] : [1, -1]);
  const headTurn = useTransform(easedX, [-1, 1], reducedMotion ? [0, 0] : [-3.25, 3.25]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting;
      setVisible(entry.isIntersecting && !document.hidden);
    });
    const onVisibility = () => setVisible(!document.hidden && inView.current);
    observer.observe(element);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(touchTimer.current);
      clearTimeout(blinkTimer.current);
      clearTimeout(reopenTimer.current);
      clearTimeout(celebrationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!visible || reducedMotion) return;

    let cancelled = false;
    const scheduleBlink = (delay: number) => {
      blinkTimer.current = setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        reopenTimer.current = setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          scheduleBlink(Math.random() < 0.18 ? 240 : 3_000 + Math.random() * 3_800);
        }, 140);
      }, delay);
    };

    scheduleBlink(1_300 + Math.random() * 1_900);
    return () => {
      cancelled = true;
      clearTimeout(blinkTimer.current);
      clearTimeout(reopenTimer.current);
    };
  }, [visible, reducedMotion]);

  const reacting = attention || curious;
  const followPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)));
    pointerY.set(Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)));
  };
  const celebrate = () => {
    clearTimeout(celebrationTimer.current);
    setCelebrating(true);
    celebrationTimer.current = setTimeout(() => setCelebrating(false), 620);
  };

  return (
    <motion.div
      ref={container}
      className="home-mascot-wrap"
      aria-hidden="true"
      data-playing={visible && !reducedMotion}
      data-reacting={reacting}
      data-celebrating={celebrating}
      data-blinking={blinking && visible && !reducedMotion}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.46, delay: reducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          setCurious(true);
          followPointer(event);
        }
      }}
      onPointerMove={followPointer}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') {
          setCurious(false);
          pointerX.set(0);
          pointerY.set(0);
        }
      }}
      onPointerCancel={() => {
        setCurious(false);
        setCelebrating(false);
        pointerX.set(0);
        pointerY.set(0);
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return;
        clearTimeout(touchTimer.current);
        setCurious(true);
        touchTimer.current = setTimeout(() => setCurious(false), 900);
      }}
      onClick={celebrate}
    >
      <span className="mascot-bubble mascot-bubble-one" />
      <span className="mascot-bubble mascot-bubble-two" />
      <span className="mascot-bubble mascot-bubble-three" />
      <span className="mascot-sparkle mascot-sparkle-one" />
      <span className="mascot-sparkle mascot-sparkle-two" />
      <span className="mascot-ground" />
      <div className="mascot-idle">
        <motion.div className="mascot-gaze" style={{ x: lookX, y: lookY, rotate: headTurn }}>
          <motion.div
            className="mascot-pose"
            animate={{
              rotate: reducedMotion ? 0 : reacting ? -2 : 0,
              x: reducedMotion ? 0 : attention ? -3 : 0,
              y: reducedMotion ? 0 : celebrating ? -7 : reacting ? -3 : 0,
              scale: reducedMotion ? 1 : celebrating ? [1, 1.035, 1] : 1,
            }}
            transition={{ duration: celebrating ? 0.52 : 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/sane-mascot.png`}
              alt=""
              width="1431"
              height="1100"
              className="home-mascot"
              draggable={false}
            />
            <span className="mascot-eyelids">
              <span className="mascot-shield-glow" />
              <span className="mascot-lid mascot-lid-left" />
              <span className="mascot-lid mascot-lid-right" />
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
