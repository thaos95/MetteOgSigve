import "../../styles/globals.css";
import Header from "../components/Header";
import HeaderBranding from "../components/HeaderBranding";

export const metadata = {
  title: "Mette & Sigve",
  description: "Vi gifter oss"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-soft-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <HeaderBranding />
              <Header />
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">{children}</main>
        <footer className="border-t border-soft-border mt-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="font-serif text-xl text-primary mb-2">Mette & Sigve</p>
            <p className="text-sm text-warm-gray">Vi gleder oss til å feire med dere</p>
          </div>
        </footer>
      </body>
    </html>
  );
}