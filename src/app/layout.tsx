import "../../styles/globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "Mette & Sigve",
  description: "Wedding website"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">Mette & Sigve</h1>
          <p className="text-sm text-gray-600">We are getting married — details below</p>
          <nav className="mt-4">
            <Header />
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-12 text-sm text-gray-500">© Mette & Sigve</footer>
      </body>
    </html>
  );
}