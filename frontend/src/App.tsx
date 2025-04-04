import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter as Router } from "react-router-dom";
import NavBar from "./components/NavBar";
import MediaList from "./components/MediaList";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <MediaList />
          </main>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
