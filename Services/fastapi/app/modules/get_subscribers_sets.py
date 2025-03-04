__all__ = ["get_subscribers_sets"]


from sqlmodel import select

from app.database import SessionDep
from app.models import Subscriber


async def get_subscribers_sets(session: SessionDep, id: int):
    set_1 = (
        session.exec(select(Subscriber.subscribe_id).where(Subscriber.user_id == id))
        .unique()
        .all()
    )
    set_2 = (
        session.exec(select(Subscriber.user_id).where(Subscriber.subscribe_id == id))
        .unique()
        .all()
    )
    return set_1, set_2
