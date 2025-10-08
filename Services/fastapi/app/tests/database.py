from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
import pytest

from app.main import app
from app.database import engine


@pytest.fixture(name="test_engine")
async def test_engine_fixture():
	async with engine.begin() as conn:
		await conn.run_sync(SQLModel.metadata.create_all)

	yield engine

	async with engine.begin() as conn:
		await conn.run_sync(SQLModel.metadata.drop_all)

	await engine.dispose()


@pytest.fixture(name="session")
async def session_fixture(test_engine):
	async with AsyncSession(test_engine) as session:
		yield session


@pytest.fixture(name="client")
def client_fixture(session: AsyncSession):
	with TestClient(app, base_url="http://") as client:
		yield client

	app.dependency_overrides.clear()
