import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AnimatePresence } from "framer-motion";
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import PageWrapper from "./components/PageWrapper";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env.local file");
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><App /></PageWrapper>} />
        <Route path="/signin" element={<PageWrapper><SignInPage /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><SignUpPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider
        appearance={{
          layout: {
            unsafe_disableDevelopmentModeWarnings: true,
          },
        }}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        <AnimatedRoutes />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);