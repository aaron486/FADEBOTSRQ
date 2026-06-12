"""Data models shared across collectors, scoring, storage, and analysis."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


class UGCPost(BaseModel):
    """A single piece of user-generated content from any platform."""

    platform: str
    post_id: str
    url: str
    title: str
    author: str = ""
    created_at: datetime
    collected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    likes: int = 0
    comments: int = 0
    shares: int = 0
    views: Optional[int] = None

    media_type: str = "unknown"  # video | image | text | link
    media_url: Optional[str] = None
    text: str = ""

    virality_score: float = 0.0

    @property
    def age_hours(self) -> float:
        created = self.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - created
        return max(delta.total_seconds() / 3600.0, 0.1)

    @property
    def key(self) -> str:
        return f"{self.platform}:{self.post_id}"


class PostAnalysis(BaseModel):
    """Claude's assessment of one post."""

    post_key: str = Field(description="The platform:post_id key of the post being analyzed")
    relevant: bool = Field(description="Whether the content fits the configured niche")
    relevance_score: int = Field(description="0-10 fit with the niche", ge=0, le=10)
    hook_strength: int = Field(description="0-10 how strong the opening hook is for short-form repurposing", ge=0, le=10)
    content_category: str = Field(description="Short category label, e.g. 'bad beat', 'reaction', 'highlight', 'meme'")
    summary: str = Field(description="One-sentence summary of the content")
    repurpose_idea: str = Field(description="One concrete idea for repurposing this content for the brand")


class AnalysisBatch(BaseModel):
    """Structured output schema for one Claude analysis request."""

    analyses: List[PostAnalysis]
