from database import SessionDep
from fastapi import FastAPI
from models import Blog, User
from sqlmodel import select

app = FastAPI(
    title="phils_network",
    version="0.1.0",
)


@app.get("/api/v2/users/")
async def read_users(session: SessionDep) -> list[User]:
    users = session.exec(select(User)).all()
    return users


@app.get("/api/v2/blogs/")
async def read_blogs(session: SessionDep) -> list[Blog]:
    users = session.exec(select(Blog)).all()
    return users
