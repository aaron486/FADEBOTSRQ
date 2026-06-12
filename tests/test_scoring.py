from datetime import datetime, timedelta, timezone

from ugc_agent.models import UGCPost
from ugc_agent.scoring import score_posts, virality_score


def make_post(post_id: str, hours_old: float, likes: int,
              comments: int = 0, shares: int = 0) -> UGCPost:
    return UGCPost(
        platform="test",
        post_id=post_id,
        url=f"https://example.com/{post_id}",
        title=post_id,
        created_at=datetime.now(timezone.utc) - timedelta(hours=hours_old),
        likes=likes,
        comments=comments,
        shares=shares,
    )


def test_score_in_range():
    post = make_post("a", hours_old=5, likes=10_000, comments=500)
    score = virality_score(post)
    assert 0 < score <= 100


def test_zero_engagement_scores_zero():
    assert virality_score(make_post("dead", hours_old=10, likes=0)) == 0.0


def test_fresh_post_beats_stale_post_with_same_engagement():
    fresh = make_post("fresh", hours_old=2, likes=5_000)
    stale = make_post("stale", hours_old=72, likes=5_000)
    assert virality_score(fresh) > virality_score(stale)


def test_velocity_beats_raw_volume():
    # 2h old with 5k upvotes is hotter than 3 days old with 20k
    rising = make_post("rising", hours_old=2, likes=5_000)
    old_hit = make_post("old", hours_old=72, likes=20_000)
    assert virality_score(rising) > virality_score(old_hit)


def test_score_posts_sorts_descending():
    posts = score_posts([
        make_post("low", hours_old=48, likes=100),
        make_post("high", hours_old=1, likes=10_000, comments=1_000),
        make_post("mid", hours_old=12, likes=2_000),
    ])
    scores = [p.virality_score for p in posts]
    assert scores == sorted(scores, reverse=True)
    assert posts[0].post_id == "high"
