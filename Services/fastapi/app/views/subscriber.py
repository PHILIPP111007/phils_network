from fastapi import APIRouter, Request
from sqlmodel import delete, select

from app.database import SessionDep
from app.enums import DeleteOption, SubscriberStatus
from app.models import Subscriber


router = APIRouter(tags=["subscriber"])


@router.get("/api/v2/subscriber/{id}/")
async def get_subscriber(session: SessionDep, request: Request, id: int):
	async def _filter(user_id: int, subscribe_id: int) -> list[Subscriber]:
		query = await session.exec(
			select(Subscriber).where(
				Subscriber.user_id == user_id,
				Subscriber.subscribe_id == subscribe_id,
			)
		)
		query = query.unique().all()
		return query

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
async def post_subscriber(session: SessionDep, request: Request, id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	subscribe = Subscriber(user_id=request.state.user.id, subscribe_id=id)
	session.add(subscribe)
	await session.commit()

	return {"ok": True}


@router.delete("/api/v2/delete_subscriber/{option}/{id}/")
async def delete_subscriber(
	session: SessionDep,
	request: Request,
	option: int,
	id: int,
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	if not option:
		return {"ok": False, "error": "Not provided an option."}

	subscribe = None
	if option == DeleteOption.DELETE_FRIEND.value:
		subscribe = await session.exec(
			select(Subscriber).where(
				Subscriber.user_id == request.state.user.id,
				Subscriber.subscribe_id == id,
			)
		)
		subscribe = subscribe.first()
		if not subscribe:
			return {"ok": False, "error": "Not found subscriber."}

	elif option == DeleteOption.DELETE_SUBSCRIBER.value:
		subscribe = await session.exec(
			select(Subscriber).where(
				Subscriber.user_id == id,
				Subscriber.subscribe_id == request.state.user.id,
			)
		)
		subscribe = subscribe.first()
		if not subscribe:
			return {"ok": False, "error": "Not found subscriber."}

	else:
		return {"ok": False, "error": "Wrong option."}

	if subscribe:
		await session.exec(delete(Subscriber).where(Subscriber.id == subscribe.id))
		await session.commit()

	return {"ok": True}
