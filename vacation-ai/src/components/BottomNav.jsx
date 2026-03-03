import { NavLink } from "react-router-dom";
import { Compass, Heart, Search, User } from "lucide-react";
import { useSaved } from "../context/SavedContext";
import "./BottomNav.css";

export default function BottomNav() {
  const { savedDestinations } = useSaved();

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end>
        <Compass size={22} />
        <span>Discover</span>
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <Search size={22} />
        <span>Explore</span>
      </NavLink>
      <NavLink to="/saved" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <div className="nav-icon-wrapper">
          <Heart size={22} />
          {savedDestinations.length > 0 && (
            <span className="badge">{savedDestinations.length}</span>
          )}
        </div>
        <span>Saved</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
