from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlmodel import delete, select

from app.database import SessionDep
from app.enums import DeleteOption, SubscriberStatus
from app.models import Subscriber

router = APIRouter(tags=["subscriber"])


class Option(BaseModel):
	option: int


@router.get("/api/v2/subscriber/{id}/")
async def get_subscriber(
	session: SessionDep, request: Request, id: int
) -> dict[str, int]:
	async def _filter(user_id: int, subscribe_id: int) -> list[Subscriber]:
		return (
			session.exec(
				select(Subscriber).where(
					Subscriber.user_id == user_id,
					Subscriber.subscribe_id == subscribe_id,
				)
			)
			.unique()
			.all()
		)

	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user_1 = await _filter(user_id=request.state.user.id, subscribe_id=id)
	user_2 = await _filter(user_id=id, subscribe_id=request.state.user.id)

	# If we are friends, I can see his blog.
	if user_1 and user_2:
		status = SubscriberStatus.IS_FRIEND.value
	elif user_1:
		status = SubscriberStatus.ME_SUBSCRIBER.value
	elif user_2:
		status = SubscriberStatus.HE_SUBSCRIBER.value
	else:
		status = SubscriberStatus.NO_DATA.value

	return {"ok": True, "status": status}


@router.post("/api/v2/subscriber/{id}/")
async def post_subscriber(
	session: SessionDep, request: Request, id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	subscribe = Subscriber(user_id=request.state.user.id, subscribe_id=id)
	session.add(subscribe)
	session.commit()

	return {"ok": True}


@router.delete("/api/v2/subscriber/{id}/")
async def delete_subscriber(
	session: SessionDep, request: Request, id: int, option: Option
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	if not option.option:
		return {"ok": False, "error": "Not provided an option."}

	subscribe = None
	if option.option == DeleteOption.DELETE_FRIEND.value:
		subscribe = session.exec(
			select(Subscriber).where(
				Subscriber.user_id == request.state.user.id,
				Subscriber.subscribe_id == id,
			)
		).first()
		if not subscribe:
			return {"ok": False, "error": "Not found subscriber."}

	elif option.option == DeleteOption.DELETE_SUBSCRIBER.value:
		subscribe = session.exec(
			select(Subscriber).where(
				Subscriber.user_id == id,
				Subscriber.subscribe_id == request.state.user.id,
			)
		).first()
		if not subscribe:
			return {"ok": False, "error": "Not found subscriber."}

	if subscribe:
		session.exec(delete(Subscriber).where(Subscriber.id == subscribe.id))
		session.commit()

	return {"ok": True}
