import {
  MapPin,
  Plane,
  Heart,
  Globe,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useSaved } from "../context/SavedContext";
import "./Profile.css";

export default function Profile() {
  const { savedDestinations, passedDestinations } = useSaved();

  const totalSavings = savedDestinations.reduce(
    (sum, d) => sum + Math.round(d.flightDeal.price * (d.flightDeal.savings / 100)),
    0
  );

  const topTags = savedDestinations
    .flatMap((d) => d.tags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

  const sortedTags = Object.entries(topTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar">
          <img src="https://i.pravatar.cc/120?img=32" alt="Profile" />
        </div>
        <h1>Traveler</h1>
        <p className="profile-subtitle">Vacation AI Explorer</p>

        <div className="profile-stats">
          <div className="stat">
            <span className="stat-number">{savedDestinations.length}</span>
            <span className="stat-label">Saved</span>
          </div>
          <div className="stat">
            <span className="stat-number">{passedDestinations.length}</span>
            <span className="stat-label">Explored</span>
          </div>
          <div className="stat">
            <span className="stat-number">${totalSavings}</span>
            <span className="stat-label">Savings</span>
          </div>
        </div>
      </div>

      {sortedTags.length > 0 && (
        <div className="profile-section">
          <h2>
            <Sparkles size={16} /> Your Travel Style
          </h2>
          <div className="travel-style-tags">
            {sortedTags.map(([tag, count]) => (
              <div key={tag} className="style-tag">
                <span className="style-tag-name">#{tag}</span>
                <span className="style-tag-count">{count} trips</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile-section">
        <h2>
          <Settings size={16} /> Preferences
        </h2>
        <div className="menu-list">
          <button className="menu-item">
            <Globe size={18} />
            <span>Travel Interests</span>
            <ChevronRight size={16} />
          </button>
          <button className="menu-item">
            <MapPin size={18} />
            <span>Home Airport</span>
            <ChevronRight size={16} />
          </button>
          <button className="menu-item">
            <Plane size={18} />
            <span>Airline Preferences</span>
            <ChevronRight size={16} />
          </button>
          <button className="menu-item">
            <Heart size={18} />
            <span>Budget Range</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
