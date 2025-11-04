__all__ = ["get_subscribers_sets"]


from sqlmodel import select

from app.database import SessionDep
from app.models import Subscriber


async def get_subscribers_sets(session: SessionDep, id: int) -> tuple[set, set]:
	subscriptions = await session.exec(
		select(Subscriber.subscribe_id).where(Subscriber.user_id == id)
	)
	subscriptions = set(subscriptions.unique().all())

	subscribers = await session.exec(
		select(Subscriber.user_id).where(Subscriber.subscribe_id == id)
	)
	subscribers = set(subscribers.unique().all())
	return subscriptions, subscribers
