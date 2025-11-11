__all__ = ["get_session", "SessionDep", "engine"]


from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import StaticPool
from sqlmodel.ext.asyncio.session import AsyncSession

from app.constants import (
	DEVELOPMENT,
	PG_HOST,
	PG_NAME,
	PG_PASSWORD,
	PG_PORT,
	PG_USER,
	TESTING,
)

PROD_DATABASE_URL = (
	f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_NAME}"
)
TEST_DATABASE_URL = "sqlite+aiosqlite://"
DEVEL_DATABASE_URL = "sqlite+aiosqlite:///../django/db.sqlite3"


engine = None
if DEVELOPMENT == "1":
	engine = create_async_engine(
		DEVEL_DATABASE_URL,
		connect_args={"check_same_thread": False},
		poolclass=StaticPool,
		echo=True,
	)
elif TESTING == "1":
	engine = create_async_engine(
		TEST_DATABASE_URL,
		connect_args={"check_same_thread": False},
		poolclass=StaticPool,
		echo=False,
	)
else:
	engine = create_async_engine(PROD_DATABASE_URL)


async def get_session():
	async with AsyncSession(engine) as session:
		yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


# docker ps
# docker exec -it db sh
# psql postgres --username=postgres --host=db --port=5432
