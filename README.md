# FADEBOTSRQ

## Viral UGC Collection Agent

An agent that collects trending user-generated content from public sources,
scores it for virality, and uses Claude to flag what's relevant to your niche
and how to repurpose it.

### How it works

```
collect (Reddit, YouTube)  →  score (engagement velocity)  →  filter
        →  analyze (Claude: relevance, hook strength, repurpose idea)
        →  store (SQLite)  →  report / export (JSON)
```

- **Reddit** — public JSON listing endpoints, no API key needed. Note:
  Reddit blocks requests from datacenter/cloud IPs (403); run from a
  residential/office connection, or swap in the OAuth API if you have Reddit
  app credentials.
- **YouTube** — official Data API v3, needs `YOUTUBE_API_KEY` (skipped if unset).
- **Scoring** — engagement velocity (likes/comments/shares discounted by post
  age), squashed onto a 0–100 scale. A fresh post climbing fast outranks an
  old post with more raw engagement.
- **Analysis** — batches of top-scored posts go to Claude (`claude-opus-4-8`)
  with a structured-output schema; you get back per-post relevance (0–10),
  hook strength (0–10), a category, a summary, and a concrete repurposing
  idea. Needs `ANTHROPIC_API_KEY` (skipped if unset). Already-analyzed posts
  aren't re-sent, so repeat runs are cheap.
- **Storage** — SQLite (`ugc.db`), deduped on `platform:post_id`. Engagement
  numbers refresh on every run.

### Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in keys, then export them (or use direnv/dotenv)
```

Edit `config.yaml` to set your niche description, subreddits, YouTube search
queries, and score thresholds. The defaults target sports-betting content.

### Usage

```bash
# Run one collection cycle (collect + score + analyze + store)
python -m ugc_agent collect

# Collect without spending Claude tokens
python -m ugc_agent collect --no-analyze

# See the leaderboard
python -m ugc_agent report --limit 25
python -m ugc_agent report --relevant-only   # only Claude-confirmed on-niche posts

# Export for downstream tooling
python -m ugc_agent export --out ugc_export.json --relevant-only
```

Run it on a schedule (e.g. hourly cron) to build a continuously refreshed
database of viral candidates:

```cron
0 * * * * cd /path/to/FADEBOTSRQ && python -m ugc_agent collect >> ugc_agent.log 2>&1
```

### Tests

```bash
pip install pytest
pytest
```

### Adding a platform

Collectors are small classes with a single `collect() -> list[UGCPost]`
method — see `ugc_agent/collectors/reddit.py`. TikTok, Instagram, and X don't
offer free public content APIs; if you have API access (e.g. TikTok Research
API, X API tier), add a collector that maps results into `UGCPost` and wire it
up in `ugc_agent/agent.py:build_collectors`.
