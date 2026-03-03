import { useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Heart,
  X,
  Plane,
  Star,
  MapPin,
  ChevronDown,
  BadgeCheck,
  MessageCircle,
} from "lucide-react";
import "./SwipeCard.css";

export default function SwipeCard({ destination, onSwipeLeft, onSwipeRight, isTop }) {
  const [expanded, setExpanded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 120) {
      animate(x, 500, { duration: 0.3 });
      setTimeout(() => onSwipeRight(destination), 300);
    } else if (info.offset.x < -120) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => onSwipeLeft(destination), 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (!isTop) {
    return (
      <div className="swipe-card-wrapper stacked">
        <div
          className="swipe-card"
          style={{ backgroundImage: `url(${destination.image})` }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="swipe-card-wrapper"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
    >
      <motion.div className="stamp like-stamp" style={{ opacity: likeOpacity }}>
        SAVE
      </motion.div>
      <motion.div className="stamp nope-stamp" style={{ opacity: nopeOpacity }}>
        PASS
      </motion.div>

      <div
        className={`swipe-card ${expanded ? "expanded" : ""}`}
        style={{ backgroundImage: `url(${destination.image})` }}
      >
        <div className="card-gradient" />

        <div className="card-content">
          <div className="influencer-bar">
            <img
              src={destination.influencer.avatar}
              alt={destination.influencer.name}
              className="influencer-avatar"
            />
            <div className="influencer-info">
              <span className="influencer-name">
                {destination.influencer.name}
                {destination.influencer.verified && (
                  <BadgeCheck size={14} className="verified-badge" />
                )}
              </span>
              <span className="influencer-handle">
                {destination.influencer.handle} &middot; {destination.influencer.followers}
              </span>
            </div>
          </div>

          <div className="destination-info">
            <div className="destination-header">
              <MapPin size={16} />
              <h2>{destination.name}</h2>
            </div>
            <p className="tagline">{destination.tagline}</p>
            <p className="caption">{destination.caption}</p>

            <div className="engagement-bar">
              <span><Heart size={14} /> {formatNumber(destination.likes)}</span>
              <span><MessageCircle size={14} /> {formatNumber(destination.comments)}</span>
            </div>

            <div className="tags-row">
              {destination.tags.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>

            <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
              <ChevronDown
                size={18}
                style={{ transform: expanded ? "rotate(180deg)" : "none" }}
              />
              {expanded ? "Less" : "Deals & Activities"}
            </button>

            {expanded && (
              <motion.div
                className="deals-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flight-deal">
                  <div className="deal-header">
                    <Plane size={16} />
                    <span>Flight Deal</span>
                    <span className="savings-badge">Save {destination.flightDeal.savings}%</span>
                  </div>
                  <div className="deal-details">
                    <span className="deal-route">{destination.flightDeal.from}</span>
                    <span className="deal-price">${destination.flightDeal.price}</span>
                  </div>
                  <span className="deal-dates">
                    {destination.flightDeal.airline} &middot; {destination.flightDeal.dates}
                  </span>
                </div>

                <div className="activities-list">
                  <h4>Top Activities</h4>
                  {destination.activities.map((activity, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-info">
                        <span className="activity-name">{activity.name}</span>
                        <span className="activity-meta">
                          <Star size={12} /> {activity.rating} &middot; {activity.duration}
                        </span>
                      </div>
                      <span className="activity-price">${activity.price}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="action-btn pass-btn"
          onClick={() => {
            animate(x, -500, { duration: 0.3 });
            setTimeout(() => onSwipeLeft(destination), 300);
          }}
        >
          <X size={28} />
        </button>
        <button
          className="action-btn save-btn"
          onClick={() => {
            animate(x, 500, { duration: 0.3 });
            setTimeout(() => onSwipeRight(destination), 300);
          }}
        >
          <Heart size={28} />
        </button>
      </div>
    </motion.div>
  );
}
