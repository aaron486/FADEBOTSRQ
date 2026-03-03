import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Plane, Trash2, Star } from "lucide-react";
import { useSaved } from "../context/SavedContext";
import "./Saved.css";

export default function Saved() {
  const { savedDestinations, removeDestination } = useSaved();

  return (
    <div className="saved-page">
      <h1 className="page-title">
        <Heart size={22} /> Saved Trips
      </h1>

      {savedDestinations.length === 0 ? (
        <div className="saved-empty">
          <Heart size={48} />
          <h2>No saved destinations yet</h2>
          <p>Swipe right on destinations you love to save them here!</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="saved-list">
            {savedDestinations.map((dest) => (
              <motion.div
                key={dest.id}
                className="saved-card"
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div
                  className="saved-card-image"
                  style={{ backgroundImage: `url(${dest.image})` }}
                />
                <div className="saved-card-content">
                  <h3>
                    <MapPin size={14} /> {dest.name}
                  </h3>
                  <p className="saved-card-tagline">{dest.tagline}</p>

                  <div className="saved-deal-row">
                    <Plane size={13} />
                    <span>
                      ${dest.flightDeal.price} from {dest.flightDeal.from.split("(")[0]}
                    </span>
                    <span className="saved-savings">
                      -{dest.flightDeal.savings}%
                    </span>
                  </div>

                  <div className="saved-activities-preview">
                    {dest.activities.slice(0, 2).map((a, i) => (
                      <span key={i} className="saved-activity-chip">
                        <Star size={10} /> {a.name.split(" ").slice(0, 2).join(" ")}
                      </span>
                    ))}
                  </div>

                  <div className="saved-card-meta">
                    <span className="saved-dates">{dest.flightDeal.dates}</span>
                    <button
                      className="remove-btn"
                      onClick={() => removeDestination(dest.id)}
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
