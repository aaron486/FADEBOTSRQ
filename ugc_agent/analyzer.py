"""Claude-powered relevance and repurposing analysis.

Sends batches of scored posts to Claude with a structured-output schema and
gets back per-post relevance, hook strength, and a repurposing idea.
"""

from __future__ import annotations

import logging
import os
from typing import List

import anthropic

from .models import AnalysisBatch, PostAnalysis, UGCPost

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a viral content scout for a social media brand. \
You evaluate user-generated content for relevance to the brand's niche and \
its potential for repurposing into short-form social content. Be honest in \
your scoring: most content is mediocre, and a 8+ hook_strength should be \
rare. Judge hook strength by whether the first moment of the content would \
stop a scroll."""


def _format_post(post: UGCPost) -> str:
    views = f", views={post.views}" if post.views is not None else ""
    return (
        f"<post key=\"{post.key}\">\n"
        f"platform: {post.platform} | media: {post.media_type}\n"
        f"title: {post.title}\n"
        f"engagement: likes={post.likes}, comments={post.comments}, "
        f"shares={post.shares}{views} | age_hours={post.age_hours:.1f} "
        f"| virality_score={post.virality_score}\n"
        f"text: {post.text[:500]}\n"
        f"</post>"
    )


class Analyzer:
    def __init__(self, niche: str, model: str = "claude-opus-4-8",
                 batch_size: int = 10):
        self.niche = niche
        self.model = model
        self.batch_size = batch_size
        self.client = anthropic.Anthropic()

    @staticmethod
    def available() -> bool:
        return bool(os.environ.get("ANTHROPIC_API_KEY")
                    or os.environ.get("ANTHROPIC_AUTH_TOKEN"))

    def analyze(self, posts: List[UGCPost]) -> List[PostAnalysis]:
        results: List[PostAnalysis] = []
        for start in range(0, len(posts), self.batch_size):
            batch = posts[start:start + self.batch_size]
            try:
                results.extend(self._analyze_batch(batch))
            except anthropic.APIError as exc:
                log.warning("analysis batch failed: %s", exc)
        return results

    def _analyze_batch(self, batch: List[UGCPost]) -> List[PostAnalysis]:
        posts_block = "\n\n".join(_format_post(p) for p in batch)
        prompt = (
            f"Brand niche:\n{self.niche}\n\n"
            f"Analyze each of the following {len(batch)} posts. Return exactly "
            f"one analysis per post, using each post's `key` attribute as "
            f"post_key.\n\n{posts_block}"
        )
        response = self.client.messages.parse(
            model=self.model,
            max_tokens=16000,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
            output_format=AnalysisBatch,
        )
        parsed = response.parsed_output
        if parsed is None:
            log.warning("analysis batch returned no parseable output "
                        "(stop_reason=%s)", response.stop_reason)
            return []
        valid_keys = {p.key for p in batch}
        analyses = [a for a in parsed.analyses if a.post_key in valid_keys]
        dropped = len(parsed.analyses) - len(analyses)
        if dropped:
            log.warning("analysis: dropped %d results with unknown post keys", dropped)
        return analyses
