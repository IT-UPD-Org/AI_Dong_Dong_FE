import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { createHeroHelix } from "./heroHelix";

const clamp = (value: number) => Math.max(0, Math.min(value, 1));
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const GRAY = [175, 178, 175];
const GREEN = [4, 113, 74];

export function useHeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const stage = section.querySelector<HTMLElement>(".hero-intro__stage");
    const copy = section.querySelector<HTMLElement>(".hero-intro__copy");
    const title = section.querySelector<HTMLElement>(".hero-intro__title");
    const art = section.querySelector<HTMLElement>(".hero-intro__art");
    const canvas = section.querySelector<HTMLCanvasElement>("canvas");
    const hint = section.querySelector<HTMLElement>(".hero-intro__scroll-hint");
    if (!stage || !copy || !title || !art || !canvas || !hint) return;

    const letters = Array.from(title.querySelectorAll<HTMLElement>("[data-title-letter]"));
    const reveals = Array.from(section.querySelectorAll<HTMLElement>(".hero-intro__reveal"), mask => ({
      mask,
      content: mask.firstElementChild as HTMLElement,
      start: Number(mask.dataset.start),
      end: Number(mask.dataset.end),
    }));
    const helix = createHeroHelix(canvas);
    let current = 0;
    let target = 0;
    let frame = 0;
    let lastTime = 0;
    let visible = true;
    let mobile = false;
    let stickyTop = 80;
    let scrollDistance = 850;

    function paint() {
      const progress = reducedMotion ? 1 : current;
      copy!.style.transform = `translate3d(0,${-progress * (mobile ? 18 : 42)}px,0)`;
      title!.style.transform = `translate3d(0,${32 * (1 - progress)}px,0)`;
      const titleProgress = clamp(progress / 0.68);
      letters.forEach((letter, index) => {
        const amount = smoothstep(clamp((titleProgress - index / letters.length * 0.82) / 0.18));
        const color = GRAY.map((channel, i) => Math.round(channel + (GREEN[i] - channel) * amount));
        letter.style.color = `rgb(${color.join(",")})`;
      });
      reveals.forEach(({ mask, content, start, end }) => {
        const value = reducedMotion ? 1 : clamp((progress - start) / (end - start));
        const eased = smoothstep(value);
        content.style.transform = `translate3d(0,${(1 - eased) * 105}%,0)`;
        content.style.opacity = String(eased);
        if (mask.classList.contains("hero-intro__actions-mask")) mask.inert = value < 0.96;
      });
      art!.style.transform = `translate3d(0,${(30 - progress * 150) * 0.48 * (mobile ? 0.48 : 1)}px,0)`;
      hint!.style.opacity = String(Math.max(0, 1 - progress * 2.8));
      helix.draw(reducedMotion ? 0 : progress);
    }

    function tick(time: number) {
      frame = 0;
      if (!visible || document.hidden) return;
      const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;
      current += (target - current) * (1 - Math.exp(-delta / 48));
      if (Math.abs(target - current) < 0.0001) current = target;
      paint();
      if (current !== target) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    }

    function requestPaint() {
      if (!frame && visible && !document.hidden) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      target = clamp((stickyTop - section!.getBoundingClientRect().top) / scrollDistance);
      requestPaint();
    }

    function resize() {
      mobile = section!.clientWidth <= 620;
      stickyTop = parseFloat(getComputedStyle(stage!).top) || 0;
      scrollDistance = parseFloat(getComputedStyle(section!).getPropertyValue("--hero-scroll-distance")) || 850;
      helix.resize();
      target = clamp((stickyTop - section!.getBoundingClientRect().top) / scrollDistance);
      current = target;
      paint();
    }

    function onVisibilityChange() {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else onScroll();
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    resizeObserver.observe(stage);
    resizeObserver.observe(canvas);
    intersectionObserver.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    resize();
    section.dataset.scrollAnimated = "true";

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      delete section.dataset.scrollAnimated;
      reveals.forEach(({ mask }) => { mask.inert = false; });
    };
  }, [reducedMotion]);

  return sectionRef;
}
