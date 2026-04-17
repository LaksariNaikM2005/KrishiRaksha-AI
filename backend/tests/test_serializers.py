from asyncio import run
from datetime import datetime, timezone

from app.models import Farm, ForumComment, ForumPost, MarketplaceListing, SOSEvent, SOSStatus, User, UserRole
from app.routers.auth import get_profile
from app.routers.farms import _farm_to_dict
from app.routers.forum import _comment_to_dict, _post_to_dict
from app.routers.market import _listing_to_dict
from app.routers.sos import _sos_to_dict


def test_farm_serializer_preserves_zero_values() -> None:
    farm = Farm(
        id="farm-1",
        user_id="user-1",
        name="Test Farm",
        area_acres=0,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    data = _farm_to_dict(farm)

    assert data["area_acres"] == 0.0
    assert data["created_at"] == "2026-01-01T00:00:00+00:00"


def test_profile_serializer_preserves_zero_coordinates() -> None:
    user = User(
        id="user-1",
        phone="9000000000",
        role=UserRole.farmer,
        language_preference="hi",
        lat=0,
        lng=0,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    data = run(get_profile(current_user=user))

    assert data["lat"] == 0.0
    assert data["lng"] == 0.0
    assert data["created_at"] == "2026-01-01T00:00:00+00:00"


def test_forum_serializers_preserve_zero_coordinates() -> None:
    post = ForumPost(
        id="post-1",
        author_id="user-1",
        title="Hello",
        body="Body",
        lat=0,
        lng=0,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    comment = ForumComment(
        id="comment-1",
        post_id="post-1",
        author_id="user-1",
        body="Nice",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    post_data = _post_to_dict(post)
    comment_data = _comment_to_dict(comment)

    assert post_data["lat"] == 0.0
    assert post_data["lng"] == 0.0
    assert post_data["created_at"] == "2026-01-01T00:00:00+00:00"
    assert comment_data["created_at"] == "2026-01-01T00:00:00+00:00"


def test_sos_and_market_serializers_preserve_zero_values() -> None:
    sos = SOSEvent(
        id="sos-1",
        user_id="user-1",
        lat=0,
        lng=0,
        status=SOSStatus.active,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    listing = MarketplaceListing(
        id="listing-1",
        seller_id="user-1",
        product_name="Demo",
        price=0,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    sos_data = _sos_to_dict(sos)
    listing_data = _listing_to_dict(listing)

    assert sos_data["lat"] == 0.0
    assert sos_data["lng"] == 0.0
    assert sos_data["created_at"] == "2026-01-01T00:00:00+00:00"
    assert listing_data["price"] == 0.0
    assert listing_data["created_at"] == "2026-01-01T00:00:00+00:00"