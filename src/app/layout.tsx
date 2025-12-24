import "../../styles/globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "Mette & Sigve",
  description: "Wedding website"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-soft-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-primary tracking-wide">Mette & Sigve</h1>
                <p className="text-sm text-warm-gray mt-0.5">We are getting married</p>
              </div>
              <Header />
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">{children}</main>
        <footer className="border-t border-soft-border mt-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="font-serif text-xl text-primary mb-2">Mette & Sigve</p>
            <p className="text-sm text-warm-gray">We can't wait to celebrate with you</p>
          </div>
        </footer>
      </body>
    </html>
  );
}