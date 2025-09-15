import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransitions } from "@/components/page-transitions";
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
          <div className="hidden sm:block">
            <Header />
          </div>
          <main className="sm:pt-14 pb-16 sm:pb-0">
            <PageTransitions>{children}</PageTransitions>
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
