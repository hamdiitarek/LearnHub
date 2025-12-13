"use client";
import { getLangDir } from "rtl-detect";
import { useLocale } from "next-intl";
import { DirectionProvider } from "@radix-ui/react-direction";
import { PropsWithChildren } from "react";

export const RadixDirectionProvider = ({ children }: PropsWithChildren) => {
  const locale = useLocale();
  const dir = getLangDir(locale);

  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
};
