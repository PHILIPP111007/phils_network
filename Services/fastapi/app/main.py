from database import SessionDep, engine
from fastapi import FastAPI, Request
from models import OnlineStatus, Token, User
from sqlmodel import Session, select

app = FastAPI(
    title="phils_network",
    version="0.1.0",
)


# Middleware to store user in request context
@app.middleware("http")
async def add_user_to_request(request: Request, call_next):
    token = request.headers.get("Authorization")

    if token:
        token = token.split(" ")[1]  # Remove "Bearer"
        with Session(engine) as session:
            tokens = session.exec(select(Token).where(Token.key == token)).all()
            if tokens:
                token = tokens[0]
                users = session.exec(select(User).where(User.id == token.user_id)).all()
                if users:
                    user = users[0]
                if user:
                    request.state.user = User(id=user.id, username=user.username)
                else:
                    request.state.user = None
    else:
        request.state.user = None

    response = await call_next(request)
    return response


@app.post("/api/v2/online_status/")
async def post_online_status(session: SessionDep, request: Request):
    if not request.state.user:
        return {"ok": False, "error": "can not authenticate"}

    online_statuses = session.exec(
        select(OnlineStatus).where(OnlineStatus.user_id == request.state.user.id)
    ).all()

    if not online_statuses:
        online_status = OnlineStatus(is_online=False, user_id=request.state.user.id)
        session.add(online_status)
        session.commit()

    return {"ok": True}
