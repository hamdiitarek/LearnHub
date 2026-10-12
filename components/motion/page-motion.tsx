"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const MARK_FROM = { backgroundSize: "0% 35%" };
const MARK_TO = {
  backgroundSize: "100% 35%",
  duration: 0.9,
  ease: "power2.inOut",
};

// Line masks clip at the display line-height (~1), which cuts off descenders.
// Pad each mask and pull it back so nothing shifts.
const unclip = (self: SplitText) =>
  self.masks.forEach((m) =>
    gsap.set(m, { paddingBottom: "0.14em", marginBottom: "-0.14em" }),
  );

/**
 * GSAP scroll and intro effects, wired to data attributes so the pages that use
 * it can stay server components:
 *
 *   data-hero-title      words rise out of masked lines on load, then the .mark sweeps in
 *   data-hero-fade       fade up on load, staggered
 *   data-hero-book       the spotlight cover drops onto the page
 *   data-hero-card       the "Up next" card slides up; data-hero-check pops, data-hero-progress fills
 *   data-split           heading words rise when scrolled into view (+ any .mark inside sweeps)
 *   data-reveal          fade up, batched as they enter
 *   data-count           number counts up once
 *   data-steps           data-steps-line draws across while data-step cards rise in
 *   data-channels        data-channel names light up one after another as you scroll
 *   data-path            data-path-line fills down the lesson list as you scroll
 *
 * Nothing moves sideways, and everything is skipped under prefers-reduced-motion.
 * Pass `watch` when the content arrives after mount (client-fetched pages).
 */
export function PageMotion({
  children,
  watch,
  className,
}: {
  children: ReactNode;
  watch?: unknown;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ------------------------------------------------------------ hero
        const intro = gsap.timeline({
          defaults: { ease: "expo.out" },
          delay: 0.05,
        });

        q("[data-hero-title]").forEach((title) => {
          SplitText.create(title, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              unclip(self);
              const tl = gsap.timeline();
              tl.from(self.words, {
                yPercent: 110,
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.06,
              });
              const marks = title.querySelectorAll(".mark");
              if (marks.length)
                tl.fromTo(
                  marks,
                  MARK_FROM,
                  { ...MARK_TO, stagger: 0.15 },
                  "-=0.45",
                );
              return tl;
            },
          });
        });

        const book = q("[data-hero-book]");
        if (book.length)
          intro.from(
            book,
            {
              y: 70,
              rotation: 7,
              scale: 0.94,
              autoAlpha: 0,
              duration: 1.3,
              ease: "expo.out",
            },
            0.15,
          );

        const card = q("[data-hero-card]");
        if (card.length) {
          intro.from(
            card,
            { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out" },
            0.45,
          );
          intro.from(
            q("[data-hero-check]"),
            { scale: 0, duration: 0.5, ease: "back.out(2.5)", stagger: 0.12 },
            0.8,
          );
          intro.from(
            q("[data-hero-progress]"),
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 1.1,
              ease: "power3.inOut",
            },
            0.9,
          );
        }

        intro.from(
          q("[data-hero-fade]"),
          { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.08 },
          0.4,
        );

        // Hidden by CSS until now so nothing flashes before hydration.
        gsap.set(
          q(
            "[data-hero-title], [data-hero-fade], [data-hero-book], [data-hero-card]",
          ),
          { visibility: "visible" },
        );

        // ------------------------------------------------------------ headings
        q("[data-split]").forEach((heading) => {
          SplitText.create(heading, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              unclip(self);
              const tl = gsap.timeline({
                scrollTrigger: {
                  trigger: heading,
                  start: "top 85%",
                  once: true,
                },
              });
              tl.from(self.words, {
                yPercent: 110,
                duration: 0.95,
                ease: "power4.out",
                stagger: 0.05,
              });
              const marks = heading.querySelectorAll(".mark");
              if (marks.length) tl.fromTo(marks, MARK_FROM, MARK_TO, "-=0.4");
              return tl;
            },
          });
        });

        // ------------------------------------------------------------ reveals
        const reveals = q("[data-reveal]");
        if (reveals.length) {
          gsap.set(reveals, { autoAlpha: 0, y: 32 });
          ScrollTrigger.batch(reveals, {
            start: "top 90%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                duration: 0.85,
                ease: "power3.out",
                stagger: 0.09,
              }),
          });
        }

        // ------------------------------------------------------------ counters
        q("[data-count]").forEach((node) => {
          const target = Number(node.getAttribute("data-count"));
          const counter = { value: 0 };
          node.textContent = "0";
          gsap.to(counter, {
            value: target,
            duration: 1.8,
            ease: "power2.out",
            snap: { value: 1 },
            onUpdate: () => {
              node.textContent = counter.value.toLocaleString("en");
            },
            scrollTrigger: { trigger: node, start: "top 92%", once: true },
          });
        });

        // ------------------------------------------------------------ steps
        q("[data-steps]").forEach((steps) => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: steps, start: "top 78%", once: true },
          });
          tl.from(steps.querySelectorAll("[data-steps-line]"), {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.6,
            ease: "power2.inOut",
          });
          tl.from(
            steps.querySelectorAll("[data-step]"),
            {
              y: 40,
              autoAlpha: 0,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.28,
            },
            0,
          );
          tl.from(
            steps.querySelectorAll("[data-step-icon]"),
            {
              scale: 0.4,
              rotation: -30,
              duration: 0.7,
              ease: "back.out(2)",
              stagger: 0.28,
            },
            0.15,
          );
        });

        // ------------------------------------------------------------ channels
        q("[data-channels]").forEach((band) => {
          const names = band.querySelectorAll("[data-channel]");
          gsap.fromTo(
            names,
            { opacity: 0.18 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.4,
              scrollTrigger: {
                trigger: band,
                start: "top 75%",
                end: "bottom 60%",
                scrub: 0.6,
              },
            },
          );
        });

        // ------------------------------------------------------------ course path
        q("[data-path]").forEach((path) => {
          gsap.fromTo(
            path.querySelectorAll("[data-path-line]"),
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: "top center",
              ease: "none",
              scrollTrigger: {
                trigger: path,
                start: "top 70%",
                end: "bottom 70%",
                scrub: 0.5,
              },
            },
          );
          gsap.from(path.querySelectorAll("[data-path-dot]"), {
            scale: 0.3,
            duration: 0.5,
            ease: "back.out(2.5)",
            stagger: 0.06,
            scrollTrigger: { trigger: path, start: "top 80%", once: true },
          });
        });

        // ------------------------------------------------------------ certificate
        const cert = q("[data-cert]");
        if (cert.length) {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from(cert, { y: 40, scale: 0.97, autoAlpha: 0, duration: 1.2 });
          tl.from(
            q("[data-cert-frame]"),
            { scale: 1.04, autoAlpha: 0, duration: 1.2 },
            0.2,
          );
          tl.from(
            q("[data-cert-line]"),
            { y: 16, autoAlpha: 0, duration: 0.8, stagger: 0.1 },
            0.35,
          );
          tl.fromTo(
            q("[data-cert] .mark"),
            MARK_FROM,
            { ...MARK_TO, duration: 1.1 },
            0.9,
          );
          tl.from(
            q("[data-cert-rule]"),
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 0.9,
              ease: "power3.inOut",
              stagger: 0.15,
            },
            1.1,
          );
          tl.from(
            q("[data-cert-seal]"),
            { scale: 0, rotation: -120, duration: 1, ease: "back.out(1.8)" },
            1.3,
          );
          gsap.set(cert, { visibility: "visible" });
        }
      });
    },
    { scope: root, dependencies: [watch], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
