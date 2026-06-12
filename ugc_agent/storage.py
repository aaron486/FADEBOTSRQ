"""SQLite storage with dedupe on (platform, post_id)."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import List, Optional

from .models import PostAnalysis, UGCPost

SCHEMA = """
CREATE TABLE IF NOT EXISTS posts (
    key            TEXT PRIMARY KEY,
    platform       TEXT NOT NULL,
    post_id        TEXT NOT NULL,
    url            TEXT NOT NULL,
    title          TEXT,
    author         TEXT,
    created_at     TEXT,
    collected_at   TEXT,
    likes          INTEGER,
    comments       INTEGER,
    shares         INTEGER,
    views          INTEGER,
    media_type     TEXT,
    media_url      TEXT,
    text           TEXT,
    virality_score REAL
);

CREATE TABLE IF NOT EXISTS analyses (
    post_key         TEXT PRIMARY KEY REFERENCES posts(key),
    relevant         INTEGER,
    relevance_score  INTEGER,
    hook_strength    INTEGER,
    content_category TEXT,
    summary          TEXT,
    repurpose_idea   TEXT
);

CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(virality_score DESC);
"""


class Storage:
    def __init__(self, path: str = "ugc.db"):
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    def upsert_posts(self, posts: List[UGCPost]) -> int:
        """Insert or refresh posts; returns how many were new."""
        new = 0
        for p in posts:
            existing = self.conn.execute(
                "SELECT 1 FROM posts WHERE key = ?", (p.key,)
            ).fetchone()
            if not existing:
                new += 1
            self.conn.execute(
                """INSERT INTO posts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(key) DO UPDATE SET
                     likes=excluded.likes, comments=excluded.comments,
                     shares=excluded.shares, views=excluded.views,
                     virality_score=excluded.virality_score,
                     collected_at=excluded.collected_at""",
                (p.key, p.platform, p.post_id, p.url, p.title, p.author,
                 p.created_at.isoformat(), p.collected_at.isoformat(),
                 p.likes, p.comments, p.shares, p.views,
                 p.media_type, p.media_url, p.text, p.virality_score),
            )
        self.conn.commit()
        return new

    def save_analyses(self, analyses: List[PostAnalysis]) -> None:
        for a in analyses:
            self.conn.execute(
                """INSERT INTO analyses VALUES (?,?,?,?,?,?,?)
                   ON CONFLICT(post_key) DO UPDATE SET
                     relevant=excluded.relevant,
                     relevance_score=excluded.relevance_score,
                     hook_strength=excluded.hook_strength,
                     content_category=excluded.content_category,
                     summary=excluded.summary,
                     repurpose_idea=excluded.repurpose_idea""",
                (a.post_key, int(a.relevant), a.relevance_score, a.hook_strength,
                 a.content_category, a.summary, a.repurpose_idea),
            )
        self.conn.commit()

    def unanalyzed_keys(self, keys: List[str]) -> List[str]:
        """Filter to keys that don't have an analysis yet."""
        if not keys:
            return []
        placeholders = ",".join("?" * len(keys))
        analyzed = {
            row["post_key"] for row in self.conn.execute(
                f"SELECT post_key FROM analyses WHERE post_key IN ({placeholders})", keys
            )
        }
        return [k for k in keys if k not in analyzed]

    def top_posts(self, limit: int = 50, relevant_only: bool = False) -> List[dict]:
        query = """
            SELECT p.*, a.relevant, a.relevance_score, a.hook_strength,
                   a.content_category, a.summary, a.repurpose_idea
            FROM posts p LEFT JOIN analyses a ON a.post_key = p.key
        """
        if relevant_only:
            query += " WHERE a.relevant = 1"
        query += " ORDER BY p.virality_score DESC LIMIT ?"
        return [dict(row) for row in self.conn.execute(query, (limit,))]

    def export_json(self, path: str, limit: int = 200,
                    relevant_only: bool = False) -> int:
        rows = self.top_posts(limit=limit, relevant_only=relevant_only)
        Path(path).write_text(json.dumps(rows, indent=2, default=str))
        return len(rows)

    def close(self) -> None:
        self.conn.close()
