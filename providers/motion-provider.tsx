"use client";

import { PropsWithChildren } from "react";
import { MotionConfig } from "motion/react";

// Framer Motion respects the OS "reduce motion" setting everywhere.
export const MotionProvider = ({ children }: PropsWithChildren) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
