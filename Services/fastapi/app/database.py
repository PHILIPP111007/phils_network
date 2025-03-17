__all__ = ["get_session", "SessionDep", "engine"]


from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from app.constants import PG_HOST, PG_NAME, PG_PASSWORD, PG_PORT, PG_USER

DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_NAME}"

engine = create_engine(DATABASE_URL)


def get_session():
	with Session(engine) as session:
		yield session


SessionDep = Annotated[Session, Depends(get_session)]


# docker ps
# docker exec -it d8044b2f4c35 sh
# psql postgres --username=postgres --host=db --port=5432
