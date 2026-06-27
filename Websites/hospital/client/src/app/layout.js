import "./globals.css";
import LayoutProvider from "@/components/LayoutProvider/LayoutProvider";
import { IsLoginProvider } from "@/contexts/isLogin";
import { UserDataProvider } from "@/contexts/user_data";
import Loading from "./loading";
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AlertsProvider } from "@/contexts/alert"; // capital A
import Script from "next/script";

export const metadata = {
  title: "Hospital",
  description: "Hospital's Management System App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></Script>
        <Script noModule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></Script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />
      </head>
      <body>
        <IsLoginProvider>
          <UserDataProvider>
            <AlertsProvider> {/* capital A — was alertsProvider before, which silently broke */}
              <Suspense fallback={<Loading />}>
                <LayoutProvider>{children}</LayoutProvider>
              </Suspense>
            </AlertsProvider>
          </UserDataProvider>
        </IsLoginProvider>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Script src="https://canvasjs.com/assets/script/canvasjs.min.js"></Script>
      </body>
    </html>
  );
}