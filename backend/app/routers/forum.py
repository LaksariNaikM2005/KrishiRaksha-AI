"""Forum router: posts, comments, and upvotes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models import User, ForumPost, ForumComment, ForumCategory
from app.schemas import ForumPostCreate, ForumCommentCreate
from app.auth import get_current_user
from app.serializers import optional_float, optional_isoformat

router = APIRouter()

@router.get("/posts")
async def list_posts(
    category: Optional[str] = None,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    query = select(ForumPost)
    if category:
        query = query.where(ForumPost.category == category)
    if sort == "trending":
        query = query.order_by(desc(ForumPost.upvotes))
    else:
        query = query.order_by(desc(ForumPost.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()
    return [_post_to_dict(p) for p in posts]

@router.post("/posts")
async def create_post(
    data: ForumPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = ForumPost(author_id=current_user.id, **data.model_dump())
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return _post_to_dict(post)

@router.get("/posts/{post_id}")
async def get_post(post_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ForumPost).where(ForumPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return _post_to_dict(post)

@router.put("/posts/{post_id}/upvote")
async def upvote_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ForumPost).where(ForumPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.upvotes = (post.upvotes or 0) + 1
    await db.commit()
    return {"upvotes": post.upvotes}

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ForumPost).where(
        ForumPost.id == post_id, ForumPost.author_id == current_user.id
    ))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Not found or unauthorized")
    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted"}

@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ForumComment).where(ForumComment.post_id == post_id)
        .order_by(ForumComment.created_at)
    )
    return [_comment_to_dict(c) for c in result.scalars().all()]

@router.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    data: ForumCommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comment = ForumComment(post_id=post_id, author_id=current_user.id, body=data.body)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return _comment_to_dict(comment)

@router.put("/comments/{comment_id}/upvote")
async def upvote_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ForumComment).where(ForumComment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.upvotes = (comment.upvotes or 0) + 1
    await db.commit()
    return {"upvotes": comment.upvotes}

@router.get("/trending")
async def get_trending_posts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ForumPost).order_by(desc(ForumPost.upvotes)).limit(10)
    )
    return [_post_to_dict(p) for p in result.scalars().all()]

@router.get("/nearby")
async def get_nearby_posts(
    lat: float = 12.9716,
    lng: float = 77.5946,
    radius_km: float = 50,
    db: AsyncSession = Depends(get_db)
):
    """Posts near farmer's location (demo: returns all with lat/lng)."""
    result = await db.execute(
        select(ForumPost).where(ForumPost.lat.isnot(None)).limit(20)
    )
    return [_post_to_dict(p) for p in result.scalars().all()]

def _post_to_dict(post: ForumPost) -> dict:
    return {
        "id": str(post.id),
        "author_id": str(post.author_id),
        "title": post.title,
        "body": post.body,
        "category": post.category.value if post.category else "general",
        "tags": post.tags or [],
        "images": post.images or [],
        "upvotes": post.upvotes or 0,
        "is_expert_verified": post.is_expert_verified or False,
        "lat": optional_float(post.lat),
        "lng": optional_float(post.lng),
        "created_at": optional_isoformat(post.created_at),
    }

def _comment_to_dict(c: ForumComment) -> dict:
    return {
        "id": str(c.id),
        "post_id": str(c.post_id),
        "author_id": str(c.author_id),
        "body": c.body,
        "upvotes": c.upvotes or 0,
        "created_at": optional_isoformat(c.created_at),
    }
