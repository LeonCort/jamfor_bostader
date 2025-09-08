import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { inter } from "@/lib/fonts";
import "./globals.css";

export { metadata } from "@/lib/metadata";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-foreground min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <Header />
          <main className="pt-14">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
