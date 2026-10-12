"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/youtube";

/**
 * Shows the lecture's thumbnail until the viewer presses play, then loads
 * YouTube's player (about a megabyte of script) already playing. Pages load
 * faster and the video area is never a blank box while the player boots.
 */
export function YouTubePlayer({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  // Not every video has a full-size thumbnail; fall back to the one that always exists.
  const [thumb, setThumb] = useState(
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  );

  if (playing) {
    return (
      <iframe
        src={youtubeEmbedUrl(id, { autoplay: true })}
        title={title}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => setPlaying(true)}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap={{ scale: 0.995 }}
      aria-label={`Play “${title}”`}
      className="group relative block size-full overflow-hidden text-start"
    >
      <motion.img
        src={thumb}
        alt=""
        onLoad={(e) => {
          // YouTube answers a missing maxres thumbnail with a 120px placeholder.
          if (e.currentTarget.naturalWidth <= 120)
            setThumb(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
        }}
        onError={() => setThumb(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
        variants={{ rest: { scale: 1 }, hover: { scale: 1.03 } }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 size-full object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/20" />
      <span className="absolute inset-0 grid place-items-center">
        <motion.span
          variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="grid size-[72px] place-items-center rounded-full bg-paper/95 text-forest shadow-[0_20px_40px_-12px_rgb(0_0_0/0.5)] sm:size-[84px]"
        >
          <Play className="ms-1 size-8 fill-current" />
        </motion.span>
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 text-paper sm:p-6">
        <span className="block text-[11px] font-semibold tracking-[0.16em] text-paper/70 uppercase">
          Lecture on YouTube
        </span>
        <span className="mt-1 block font-display text-[clamp(1.3rem,2.6vw,2rem)] leading-tight">
          {title}
        </span>
      </span>
    </motion.button>
  );
}
