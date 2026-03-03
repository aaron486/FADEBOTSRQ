import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import SwipeCard from "../components/SwipeCard";
import { useSaved } from "../context/SavedContext";
import { destinations } from "../data/destinations";
import "./Discover.css";

export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const { saveDestination, passDestination } = useSaved();

  const handleSwipeRight = useCallback(
    (dest) => {
      saveDestination(dest);
      setLastAction({ type: "saved", name: dest.name });
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setLastAction(null), 1500);
    },
    [saveDestination]
  );

  const handleSwipeLeft = useCallback(
    (dest) => {
      passDestination(dest);
      setLastAction({ type: "passed", name: dest.name });
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setLastAction(null), 1500);
    },
    [passDestination]
  );

  const remaining = destinations.slice(currentIndex);

  return (
    <div className="discover-page">
      <header className="discover-header">
        <div className="logo">
          <Sparkles size={20} />
          <h1>Vacation AI</h1>
        </div>
        <span className="card-counter">
          {Math.min(currentIndex + 1, destinations.length)} / {destinations.length}
        </span>
      </header>

      <div className="cards-container">
        <AnimatePresence>
          {lastAction && (
            <motion.div
              className={`action-toast ${lastAction.type}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {lastAction.type === "saved" ? "Saved" : "Passed on"} {lastAction.name}
            </motion.div>
          )}
        </AnimatePresence>

        {remaining.length > 0 ? (
          <div className="card-stack">
            {remaining
              .slice(0, 3)
              .reverse()
              .map((dest, i, arr) => (
                <SwipeCard
                  key={dest.id}
                  destination={dest}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  isTop={i === arr.length - 1}
                />
              ))}
          </div>
        ) : (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Sparkles size={48} />
            <h2>You've explored all destinations!</h2>
            <p>Check your saved trips or come back later for more.</p>
            <button className="refresh-btn" onClick={() => setCurrentIndex(0)}>
              Start Over
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
