import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
// import { Route } from "lucide-react";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env.local file");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider
        appearance={{
          // baseTheme: dark,
        }}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        <Routes>
          <Route path="/" element={<App />} />{" "}
          <Route path="/signin" element={<SignInPage />} />{" "}
          <Route path="/signup" element={<SignUpPage />} />{" "}
        </Routes>
        {/* <App /> */}
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
