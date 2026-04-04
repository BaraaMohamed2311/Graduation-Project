import "./globals.css";
import { IsLoginProvider } from "../contexts/isLogin";
import { UserDataProvider } from "../contexts/user_data";
export const metadata = {
  title: "Hospital Medicine Dashboard",
  description: "Medicine inventory management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <IsLoginProvider >
          <UserDataProvider>
            <body>{children}</body>
        </UserDataProvider>
      </IsLoginProvider >
    </html>
  );
}
