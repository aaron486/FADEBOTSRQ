"""Reddit collector using the public JSON listing endpoints (no API key)."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import List

import requests

from ..models import UGCPost

log = logging.getLogger(__name__)

USER_AGENT = "ugc-agent/0.1 (viral content research)"
BASE_URL = "https://www.reddit.com"


class RedditCollector:
    def __init__(self, subreddits: List[str], listing: str = "top",
                 timeframe: str = "day", limit: int = 50):
        self.subreddits = subreddits
        self.listing = listing
        self.timeframe = timeframe
        self.limit = limit
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT

    def collect(self) -> List[UGCPost]:
        posts: List[UGCPost] = []
        for sub in self.subreddits:
            try:
                posts.extend(self._collect_subreddit(sub))
            except requests.RequestException as exc:
                log.warning("reddit: failed to fetch r/%s: %s", sub, exc)
            # Stay well under Reddit's unauthenticated rate limit.
            time.sleep(1.0)
        return posts

    def _collect_subreddit(self, sub: str) -> List[UGCPost]:
        url = f"{BASE_URL}/r/{sub}/{self.listing}.json"
        params = {"limit": self.limit, "t": self.timeframe, "raw_json": 1}
        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()
        children = resp.json().get("data", {}).get("children", [])

        posts = []
        for child in children:
            d = child.get("data", {})
            if d.get("stickied") or d.get("promoted"):
                continue
            posts.append(UGCPost(
                platform="reddit",
                post_id=d["id"],
                url=f"{BASE_URL}{d.get('permalink', '')}",
                title=d.get("title", ""),
                author=d.get("author", ""),
                created_at=datetime.fromtimestamp(d.get("created_utc", 0), tz=timezone.utc),
                likes=d.get("ups", 0),
                comments=d.get("num_comments", 0),
                shares=d.get("num_crossposts", 0),
                media_type=self._media_type(d),
                media_url=d.get("url_overridden_by_dest") or d.get("url"),
                text=(d.get("selftext") or "")[:2000],
            ))
        log.info("reddit: collected %d posts from r/%s", len(posts), sub)
        return posts

    @staticmethod
    def _media_type(d: dict) -> str:
        if d.get("is_video"):
            return "video"
        hint = d.get("post_hint", "")
        if hint in ("image", "rich:video", "hosted:video"):
            return "video" if "video" in hint else "image"
        if d.get("is_self"):
            return "text"
        return "link"
