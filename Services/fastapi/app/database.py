__all__ = ["get_session", "SessionDep", "engine"]


from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import StaticPool
from sqlmodel.ext.asyncio.session import AsyncSession

from app.constants import PG_HOST, PG_NAME, PG_PASSWORD, PG_PORT, PG_USER, TESTING

PROD_DATABASE_URL = (
	f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_NAME}"
)

TEST_DATABASE_URL = "sqlite+aiosqlite://"


engine = None
if TESTING == "1":
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
# docker exec -it db_phils_network sh
# psql postgres --username=postgres --host=db_phils_network --port=5432
