"use client";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLocale } from "next-intl";

const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
};

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

export const ReactQueryProvider = ({ children }: PropsWithChildren) => {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const position = isRtl ? "left" : "right";
  const buttonPosition = isRtl ? "top-left" : "top-right";
  const showDevtools =
    process.env.NEXT_PUBLIC_SHOW_REACT_QUERY_DEV_TOOLS === "true";

  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {showDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position={position}
          buttonPosition={buttonPosition}
        />
      )}
      {children}
    </QueryClientProvider>
  );
};
