import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

type GuardianPhase = 'idle' | 'notice' | 'raise' | 'hold' | 'release';

const collapsedShell = { opacity: 0, scale: 0.28, scaleX: 1, scaleY: 1 };
const shellPoses = {
  idle: collapsedShell,
  notice: collapsedShell,
  raise: { opacity: 1, scale: 1.055, scaleX: 1, scaleY: 1 },
  hold: {
    opacity: 1,
    scale: 1,
    scaleX: [1.045, 0.974, 1.008, 1],
    scaleY: [0.964, 1.038, 0.994, 1],
  },
  release: { opacity: 0, scale: 0.88, scaleX: 1, scaleY: 1 },
};

/** Keep a brief hover complete, but release immediately after a long hover. */
export function nextGuardianStep(
  phase: GuardianPhase,
  engaged: boolean,
  elapsed: number,
  playing: boolean,
): { phase: GuardianPhase; delay: number } | undefined {
  if (!playing) return phase === 'idle' ? undefined : { phase: 'idle', delay: 0 };
  if (phase === 'idle') return engaged ? { phase: 'notice', delay: 0 } : undefined;
  if (phase === 'hold' && engaged) return undefined;
  const next = { notice: 'raise', raise: 'hold', hold: 'release', release: 'idle' } as const;
  const duration = { notice: 150, raise: 340, hold: 550, release: 280 };
  return { phase: next[phase], delay: Math.max(0, duration[phase] - elapsed) };
}

/** Decorative companion. Keyboard feedback comes from the real primary action. */
export function HomeMascot({ attention }: { attention: boolean }) {
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const inView = useRef(true);
  const [visible, setVisible] = useState(true);
  const [curious, setCurious] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [phase, setPhase] = useState<GuardianPhase>('idle');
  const [posesReady, setPosesReady] = useState({ anticipate: false, guard: false });
  const phaseStarted = useRef(0);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reopenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const easedX = useSpring(pointerX, { stiffness: 130, damping: 20, mass: 0.75 });
  const easedY = useSpring(pointerY, { stiffness: 130, damping: 20, mass: 0.75 });
  const lookX = useTransform(easedX, [-1, 1], reducedMotion ? [0, 0] : [-1.5, 1.5]);
  const lookY = useTransform(easedY, [-1, 1], reducedMotion ? [0, 0] : [1, -1]);
  const headTurn = useTransform(easedX, [-1, 1], reducedMotion ? [0, 0] : [-3.25, 3.25]);
  const bubbleTiltX = useTransform(easedY, [-1, 1], reducedMotion ? [0, 0] : [4, -4]);
  const bubbleTiltY = useTransform(easedX, [-1, 1], reducedMotion ? [0, 0] : [-5, 5]);
  const rimTurn = useTransform(easedX, [-1, 1], reducedMotion ? [0, 0] : [-22, 22]);
  const lightX = useTransform(easedX, [-1, 1], reducedMotion ? [40, 40] : [22, 66]);
  const lightY = useTransform(easedY, [-1, 1], reducedMotion ? [25, 25] : [12, 52]);
  const bubbleLight = useMotionTemplate`radial-gradient(ellipse at ${lightX}% ${lightY}%, rgba(248, 239, 221, 0.28), transparent 48%)`;
  const guardianRoot = import.meta.env.BASE_URL + 'icons/mascot-guardian/';
  const reacting = attention || curious;
  const playing = visible && !reducedMotion;
  const guardianActive = visible && (reducedMotion ? reacting : phase !== 'idle');
  const barrierVisible =
    visible && (reducedMotion ? reacting : phase === 'raise' || phase === 'hold');
  const blinkOnce = useCallback(() => {
    clearTimeout(reopenTimer.current);
    setBlinking(true);
    reopenTimer.current = setTimeout(() => setBlinking(false), 140);
  }, []);

  useEffect(() => {
    const step = nextGuardianStep(
      phase,
      reacting,
      performance.now() - phaseStarted.current,
      playing,
    );
    if (!step) return;
    const timer = setTimeout(() => {
      phaseStarted.current = performance.now();
      setPhase(step.phase);
    }, step.delay);
    return () => clearTimeout(timer);
  }, [phase, reacting, playing]);

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
    };
  }, []);

  useEffect(() => {
    const reset = setTimeout(() => setBlinking(false), 0);
    if (!playing) return () => clearTimeout(reset);

    let cancelled = false;
    const scheduleBlink = (delay: number) => {
      blinkTimer.current = setTimeout(() => {
        if (cancelled) return;
        blinkOnce();
        scheduleBlink(Math.random() < 0.18 ? 380 : 3_140 + Math.random() * 3_800);
      }, delay);
    };

    scheduleBlink(1_300 + Math.random() * 1_900);
    return () => {
      cancelled = true;
      clearTimeout(reset);
      clearTimeout(blinkTimer.current);
      clearTimeout(reopenTimer.current);
    };
  }, [playing, blinkOnce]);

  useEffect(() => {
    if (phase !== 'hold' || !playing) return;
    const timer = setTimeout(blinkOnce, 180);
    return () => clearTimeout(timer);
  }, [phase, playing, blinkOnce]);

  const followPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)));
    pointerY.set(Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)));
  };
  const pose =
    reducedMotion || !visible
      ? { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 }
      : phase === 'notice'
        ? { x: 0, y: 3, rotate: -2, scaleX: 1.045, scaleY: 0.955 }
        : phase === 'raise'
          ? { x: -2, y: -11, rotate: -4, scaleX: 0.985, scaleY: 1.035 }
          : phase === 'hold'
            ? { x: attention ? -3 : -1, y: -5, rotate: -1.5, scaleX: 1.015, scaleY: 1 }
            : { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
  const shell =
    reducedMotion || !visible
      ? { opacity: barrierVisible ? 1 : 0, scale: 1, scaleX: 1, scaleY: 1 }
      : shellPoses[phase];

  return (
    <motion.div
      ref={container}
      className="home-mascot-wrap"
      aria-hidden="true"
      data-playing={playing}
      data-reacting={reacting}
      data-guardian-active={guardianActive}
      data-guardian-phase={phase}
      data-poses-ready={posesReady.anticipate && posesReady.guard}
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
        pointerX.set(0);
        pointerY.set(0);
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return;
        clearTimeout(touchTimer.current);
        setCurious(true);
        touchTimer.current = setTimeout(() => setCurious(false), 1_600);
      }}
    >
      <span className="mascot-bubble mascot-bubble-one" />
      <span className="mascot-bubble mascot-bubble-two" />
      <span className="mascot-bubble mascot-bubble-three" />
      <span className="mascot-sparkle mascot-sparkle-one" />
      <span className="mascot-sparkle mascot-sparkle-two" />
      <motion.span
        className="mascot-ground"
        animate={{
          scale: reducedMotion ? 1 : guardianActive ? 1.18 : 1,
          opacity: guardianActive ? 0.5 : 0.7,
        }}
        transition={{ duration: reducedMotion ? 0.12 : 0.4 }}
      />
      <motion.span
        className="mascot-barrier-ground"
        initial={false}
        animate={{
          opacity: barrierVisible ? 0.7 : 0,
          scale: reducedMotion ? 1 : barrierVisible ? 1 : 0.4,
        }}
        transition={{ duration: reducedMotion ? 0.12 : 0.4 }}
      />
      <motion.span
        className="mascot-barrier"
        initial={false}
        style={{ rotateX: bubbleTiltX, rotateY: bubbleTiltY }}
        animate={shell}
        transition={{
          duration: reducedMotion
            ? 0.12
            : phase === 'raise'
              ? 0.34
              : phase === 'hold'
                ? 0.55
                : 0.28,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <span className="mascot-barrier-surface" />
        <motion.span className="mascot-barrier-light" style={{ backgroundImage: bubbleLight }} />
        <motion.span className="mascot-barrier-rim" style={{ rotate: rimTurn }} />
      </motion.span>
      <div className="mascot-idle">
        <motion.div className="mascot-gaze" style={{ x: lookX, y: lookY, rotate: headTurn }}>
          <motion.div
            className="mascot-pose"
            animate={pose}
            transition={{
              duration: reducedMotion
                ? 0
                : phase === 'notice'
                  ? 0.15
                  : phase === 'raise'
                    ? 0.34
                    : 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/sane-mascot.png`}
              alt=""
              width="1431"
              height="1100"
              className="home-mascot mascot-frame-idle"
              draggable={false}
            />
            <img
              src={guardianRoot + 'anticipate.webp'}
              alt=""
              width="1426"
              height="1103"
              className="home-mascot mascot-frame mascot-frame-anticipate"
              draggable={false}
              decoding="async"
              onLoad={() => setPosesReady((ready) => ({ ...ready, anticipate: true }))}
              onError={() => setPosesReady((ready) => ({ ...ready, anticipate: false }))}
            />
            <img
              src={guardianRoot + 'guard.webp'}
              alt=""
              width="1426"
              height="1103"
              className="home-mascot mascot-frame mascot-frame-guard"
              draggable={false}
              decoding="async"
              onLoad={() => setPosesReady((ready) => ({ ...ready, guard: true }))}
              onError={() => setPosesReady((ready) => ({ ...ready, guard: false }))}
            />
            <span className="mascot-eyelids">
              <span
                className="mascot-shield-gleam"
                style={{ maskImage: 'url("' + guardianRoot + 'guard.webp")' }}
              />
              <span className="mascot-lid mascot-lid-left" />
              <span className="mascot-lid mascot-lid-right" />
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
