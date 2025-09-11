__all__ = ["get_session", "SessionDep", "engine"]


from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

from app.constants import PG_HOST, PG_NAME, PG_PASSWORD, PG_PORT, PG_USER

DATABASE_URL = (
	f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_NAME}"
)

engine = create_async_engine(DATABASE_URL)


async def get_session():
	async with AsyncSession(engine) as session:
		yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


# docker ps
# docker exec -it d8044b2f4c35 sh
# psql postgres --username=postgres --host=db --port=5432
