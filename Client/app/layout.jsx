import "../styles/main.scss";
import "odometer/themes/odometer-theme-default.css";
import "photoswipe/style.css";
import "rc-slider/assets/index.css";
import AppClientShell from "./AppClientShell";

export const metadata = {
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="popup-loader">
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
