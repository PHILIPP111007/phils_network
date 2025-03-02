__all__ = ["get_session", "SessionDep", "engine"]


from os import environ
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

PG_HOST = environ.get("PG_HOST", "db")
PG_PORT = environ.get("PG_PORT", "5432")
PG_NAME = environ.get("PG_NAME", "postgres")
PG_USER = environ.get("PG_USER", "postgres")
PG_PASSWORD = environ.get("DB_PASSWORD", "postgres")


DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_NAME}"

engine = create_engine(DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]

# docker exec -it ad3ce97519e1 sh
# psql postgres --username=postgres --password=postgres --host=db --port=5432
