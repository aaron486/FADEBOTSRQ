import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SavedProvider } from "./context/SavedContext";
import BottomNav from "./components/BottomNav";
import Discover from "./pages/Discover";
import Explore from "./pages/Explore";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <SavedProvider>
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </SavedProvider>
    </BrowserRouter>
  );
}
