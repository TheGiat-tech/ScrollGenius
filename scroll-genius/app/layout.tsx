export const metadata = {
  title: "ScrollGenius – GA4 Scroll/Form Track Generator",
  description: "Generate a GTM container JSON that tracks accurate scroll depth (and forms) with clean data."
};
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="header">
            <div className="logo" />
            <div>
              <div className="kicker">ScrollGenius</div>
              <div className="small">GTM-styled generator for 100% accurate GA4 scroll tracking</div>
            </div>
          </div>
          {children}
          <div style={{opacity:.7, marginTop:20}} className="small">
            Tip: This MVP ships with a <code className="inline">DEMO-PRO</code> unlock code
            (no payments required). Replace later with PayPal/Stripe.
          </div>
        </div>
      </body>
    </html>
  );
}
