import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
// import { Route } from "lucide-react";
import { neobrutalism } from "@clerk/themes";

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
          baseTheme: neobrutalism,
          signIn: { baseTheme: neobrutalism },
        }}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        <Routes>
          <Route path="/" element={<App />} />{" "}
        </Routes>
        {/* <App /> */}
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
