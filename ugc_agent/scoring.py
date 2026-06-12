"""Virality scoring.

The score rewards engagement *velocity* — raw engagement discounted by post
age — so a 2-hour-old post with 5k upvotes outranks a 3-day-old post with
20k. Scores are mapped onto a 0-100 scale with a log curve so a handful of
mega-viral posts don't flatten everything else to zero.
"""

from __future__ import annotations

import math

from .models import UGCPost

# Comments and shares signal stronger engagement than a passive like/upvote.
LIKE_WEIGHT = 1.0
COMMENT_WEIGHT = 2.5
SHARE_WEIGHT = 4.0
VIEW_WEIGHT = 0.01

# Sub-linear age decay: old posts fade but aren't erased entirely.
AGE_DECAY_EXPONENT = 1.1

# Velocity that maps to a score of ~50. Tuned so typical front-page Reddit
# content lands in the 40-70 band.
MIDPOINT_VELOCITY = 500.0


def engagement(post: UGCPost) -> float:
    total = (
        post.likes * LIKE_WEIGHT
        + post.comments * COMMENT_WEIGHT
        + post.shares * SHARE_WEIGHT
    )
    if post.views:
        total += post.views * VIEW_WEIGHT
    return total


def virality_score(post: UGCPost) -> float:
    velocity = engagement(post) / (post.age_hours ** AGE_DECAY_EXPONENT)
    if velocity <= 0:
        return 0.0
    # log-logistic squash onto 0-100, centered at MIDPOINT_VELOCITY
    score = 100.0 / (1.0 + (MIDPOINT_VELOCITY / velocity) ** 0.6)
    return round(score, 2)


def score_posts(posts: list[UGCPost]) -> list[UGCPost]:
    """Score posts in place and return them sorted best-first."""
    for post in posts:
        post.virality_score = virality_score(post)
    return sorted(posts, key=lambda p: p.virality_score, reverse=True)
