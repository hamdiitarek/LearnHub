import { PropsWithChildren } from "react";
import { ReactQueryProvider } from "./react-query-provider";
import { NextIntlProvider } from "./next-intl-provider";
import { RadixDirectionProvider } from "./radix-direction-provider";
import { NextAuthProvider } from "./next-auth-provider";

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <NextAuthProvider>
      <NextIntlProvider>
        <ReactQueryProvider>
          <RadixDirectionProvider>{children}</RadixDirectionProvider>
        </ReactQueryProvider>
      </NextIntlProvider>
    </NextAuthProvider>
  );
};

