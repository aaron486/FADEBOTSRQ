"""YouTube collector using the official Data API v3 (requires YOUTUBE_API_KEY)."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import List

import requests

from ..models import UGCPost

log = logging.getLogger(__name__)

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"


class YouTubeCollector:
    def __init__(self, queries: List[str], published_within_hours: int = 48,
                 max_results: int = 25):
        self.queries = queries
        self.published_within_hours = published_within_hours
        self.max_results = max_results
        self.api_key = os.environ.get("YOUTUBE_API_KEY", "")

    def collect(self) -> List[UGCPost]:
        if not self.api_key:
            log.info("youtube: YOUTUBE_API_KEY not set, skipping collector")
            return []
        posts: List[UGCPost] = []
        for query in self.queries:
            try:
                posts.extend(self._collect_query(query))
            except requests.RequestException as exc:
                log.warning("youtube: query %r failed: %s", query, exc)
        return posts

    def _collect_query(self, query: str) -> List[UGCPost]:
        published_after = (
            datetime.now(timezone.utc) - timedelta(hours=self.published_within_hours)
        ).strftime("%Y-%m-%dT%H:%M:%SZ")

        search = requests.get(SEARCH_URL, params={
            "key": self.api_key,
            "q": query,
            "part": "snippet",
            "type": "video",
            "order": "viewCount",
            "publishedAfter": published_after,
            "maxResults": self.max_results,
        }, timeout=15)
        search.raise_for_status()
        items = search.json().get("items", [])
        video_ids = [i["id"]["videoId"] for i in items if i.get("id", {}).get("videoId")]
        if not video_ids:
            return []

        stats = requests.get(VIDEOS_URL, params={
            "key": self.api_key,
            "id": ",".join(video_ids),
            "part": "snippet,statistics",
        }, timeout=15)
        stats.raise_for_status()

        posts = []
        for item in stats.json().get("items", []):
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})
            posts.append(UGCPost(
                platform="youtube",
                post_id=item["id"],
                url=f"https://www.youtube.com/watch?v={item['id']}",
                title=snippet.get("title", ""),
                author=snippet.get("channelTitle", ""),
                created_at=datetime.fromisoformat(
                    snippet.get("publishedAt", "1970-01-01T00:00:00Z").replace("Z", "+00:00")
                ),
                likes=int(statistics.get("likeCount", 0)),
                comments=int(statistics.get("commentCount", 0)),
                views=int(statistics.get("viewCount", 0)),
                media_type="video",
                media_url=f"https://www.youtube.com/watch?v={item['id']}",
                text=(snippet.get("description") or "")[:2000],
            ))
        log.info("youtube: collected %d videos for %r", len(posts), query)
        return posts
