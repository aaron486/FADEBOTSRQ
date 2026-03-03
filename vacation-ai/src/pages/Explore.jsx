import { useState } from "react";
import { Search, MapPin, Plane, Star, TrendingUp } from "lucide-react";
import { destinations } from "../data/destinations";
import "./Explore.css";

const allTags = [...new Set(destinations.flatMap((d) => d.tags))];

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  const filtered = destinations.filter((d) => {
    const matchesSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tagline.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || d.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const trending = destinations
    .slice()
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  return (
    <div className="explore-page">
      <h1 className="page-title">Explore</h1>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-tags">
        <button
          className={`filter-tag ${!activeTag ? "active" : ""}`}
          onClick={() => setActiveTag(null)}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`filter-tag ${activeTag === tag ? "active" : ""}`}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            #{tag}
          </button>
        ))}
      </div>

      {!search && !activeTag && (
        <section className="trending-section">
          <h2>
            <TrendingUp size={18} /> Trending Now
          </h2>
          <div className="trending-grid">
            {trending.map((dest) => (
              <div
                key={dest.id}
                className="trending-card"
                style={{ backgroundImage: `url(${dest.image})` }}
              >
                <div className="trending-overlay">
                  <span className="trending-name">{dest.name}</span>
                  <span className="trending-likes">{(dest.likes / 1000).toFixed(1)}K likes</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="deals-grid-section">
        <h2>
          <Plane size={18} /> {activeTag ? `#${activeTag} Destinations` : "All Destinations"}
        </h2>
        <div className="deals-grid">
          {filtered.map((dest) => (
            <div key={dest.id} className="deal-card">
              <div
                className="deal-card-image"
                style={{ backgroundImage: `url(${dest.image})` }}
              >
                <span className="deal-card-savings">
                  Save {dest.flightDeal.savings}%
                </span>
              </div>
              <div className="deal-card-body">
                <h3>
                  <MapPin size={14} /> {dest.name}
                </h3>
                <p className="deal-card-caption">{dest.tagline}</p>
                <div className="deal-card-footer">
                  <span className="deal-card-price">
                    From <strong>${dest.flightDeal.price}</strong>
                  </span>
                  <span className="deal-card-rating">
                    <Star size={12} /> {dest.activities[0].rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="no-results">
            <p>No destinations match your search.</p>
          </div>
        )}
      </section>
    </div>
  );
}
