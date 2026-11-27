import type { Metadata, Viewport } from "next";
import { EB_Garamond, IM_Fell_English_SC } from "next/font/google";
import "./globals.css";

const fell = IM_Fell_English_SC({
  variable: "--font-fell",
  subsets: ["latin"],
  weight: "400",
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Oliver's One Night Werewolf",
  description:
    "A werewolf party game for one night, played on your phones. Host a room, deal in secret, and hunt at dawn.",
  appleWebApp: {
    capable: true,
    title: "Oliver's Werewolf",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120d0a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fell.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
