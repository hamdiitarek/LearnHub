import { PropsWithChildren } from "react";
import { NextIntlClientProvider } from "next-intl";

export const NextIntlProvider = ({ children }: PropsWithChildren) => {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
};
