import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FHEVM Snake Game - Privacy-Preserving Gaming",
  description: "Play Snake with encrypted scores on the blockchain using FHEVM technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

