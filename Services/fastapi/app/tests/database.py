from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
import pytest

from app.main import app
from app.database import get_session, test_engine


@pytest.fixture(name="test_engine")
async def test_engine_fixture():
	"""Тестовый движок БД"""
	# Создаем таблицы
	async with test_engine.begin() as conn:
		await conn.run_sync(SQLModel.metadata.create_all)

	yield test_engine

	# Очищаем
	async with test_engine.begin() as conn:
		await conn.run_sync(SQLModel.metadata.drop_all)

	await test_engine.dispose()


@pytest.fixture(name="session")
async def session_fixture(test_engine):
	"""Тестовая сессия"""
	async with AsyncSession(test_engine) as session:
		yield session


@pytest.fixture(name="client")
def client_fixture(session: AsyncSession):
	"""Асинхронный клиент для тестов"""

	def get_test_session():
		yield session

	# Переопределяем зависимость БД
	app.dependency_overrides[get_session] = get_test_session

	with TestClient(app, base_url="http://") as client:
		yield client

	# Очищаем переопределения
	app.dependency_overrides.clear()
