"""Pipeline orchestration: collect -> score -> filter -> analyze -> store."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List

import yaml

from .analyzer import Analyzer
from .collectors import RedditCollector, YouTubeCollector
from .models import UGCPost
from .scoring import score_posts
from .storage import Storage

log = logging.getLogger(__name__)


def load_config(path: str = "config.yaml") -> dict:
    return yaml.safe_load(Path(path).read_text())


def build_collectors(config: dict) -> list:
    collectors = []
    reddit = config.get("reddit", {})
    if reddit.get("enabled"):
        collectors.append(RedditCollector(
            subreddits=reddit.get("subreddits", []),
            listing=reddit.get("listing", "top"),
            timeframe=reddit.get("timeframe", "day"),
            limit=reddit.get("limit", 50),
        ))
    youtube = config.get("youtube", {})
    if youtube.get("enabled"):
        collectors.append(YouTubeCollector(
            queries=youtube.get("queries", []),
            published_within_hours=youtube.get("published_within_hours", 48),
            max_results=youtube.get("max_results", 25),
        ))
    return collectors


def run(config: dict, storage: Storage, analyze: bool = True) -> dict:
    """Run one collection cycle. Returns summary stats."""
    min_score = config.get("min_virality_score", 0)
    per_source_cap = config.get("max_posts_per_source", 50)

    kept: List[UGCPost] = []
    for collector in build_collectors(config):
        posts = score_posts(collector.collect())
        eligible = [p for p in posts if p.virality_score >= min_score]
        kept.extend(eligible[:per_source_cap])

    new_count = storage.upsert_posts(kept)
    log.info("stored %d posts (%d new)", len(kept), new_count)

    analyzed_count = 0
    analysis_cfg = config.get("analysis", {})
    if analyze and analysis_cfg.get("enabled") and kept:
        if not Analyzer.available():
            log.info("analysis: ANTHROPIC_API_KEY not set, skipping")
        else:
            ranked = sorted(kept, key=lambda p: p.virality_score, reverse=True)
            top = ranked[:analysis_cfg.get("top_n", 30)]
            pending_keys = set(storage.unanalyzed_keys([p.key for p in top]))
            to_analyze = [p for p in top if p.key in pending_keys]
            if to_analyze:
                analyzer = Analyzer(
                    niche=config.get("niche", ""),
                    model=analysis_cfg.get("model", "claude-opus-4-8"),
                    batch_size=analysis_cfg.get("batch_size", 10),
                )
                analyses = analyzer.analyze(to_analyze)
                storage.save_analyses(analyses)
                analyzed_count = len(analyses)
                log.info("analyzed %d posts", analyzed_count)

    return {
        "collected": len(kept),
        "new": new_count,
        "analyzed": analyzed_count,
    }
