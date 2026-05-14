import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],

});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Truck Operations Management",
  description: "Advanced fleet management system",
};

import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

const theme = createTheme({
  fontFamily: "var(--font-geist-sans), sans-serif",
  headings: { fontFamily: "var(--font-geist-sans), sans-serif" },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <ClerkProvider>
          <MantineProvider theme={theme}>
            <Notifications position="top-right" />
            <ModalsProvider>
              {children}
            </ModalsProvider>
          </MantineProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
