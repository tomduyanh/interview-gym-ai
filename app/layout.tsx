import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewGym AI - Your Personalized Interview Coach",
  description: "Generate personalized interview questions based on your resume and job description.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
