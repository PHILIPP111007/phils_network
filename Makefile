# Variables
SHELL = zsh
DEV_ENV = DEVELOPMENT=1
MICROMAMBA_ENV = phils_network
DJANGO_DIR = Services/django
FASTAPI_DIR = Services/fastapi
REACT_DIR = Front/react

help:
	@echo "Available targets:"
	@echo "\tcreate_env  - Create Python env"
	@echo "\tlist        - List Python packages"
	@echo "\tdjango      - Run Django with Gunicorn"
	@echo "\tfastapi     - Run FastAPI with Uvicorn"
	@echo "\treact       - Run React"

create_env:
	eval "$$(micromamba shell hook --shell $(SHELL))" && \
	cd Services/ && \
	micromamba env create -f ./env.yml

list:
	eval "$$(micromamba shell hook --shell $(SHELL))" && \
	micromamba activate $(MICROMAMBA_ENV) && \
	pip list

django:
	@echo "Starting django..."
	eval "$$(micromamba shell hook --shell $(SHELL))" && \
	micromamba activate $(MICROMAMBA_ENV) && \
	cd $(DJANGO_DIR) && \
	export $(DEV_ENV) && \
	export DEBUG=1 && \
	python manage.py migrate && \
	bash gunicorn.sh

fastapi:
	@echo "Starting fastapi..."
	eval "$$(micromamba shell hook --shell $(SHELL))" && \
	micromamba activate $(MICROMAMBA_ENV) && \
	cd $(FASTAPI_DIR) && \
	export $(DEV_ENV) && \
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1

react:
	@echo "Starting react..."
	cd $(REACT_DIR) && \
	sudo npm install && \
	sudo VITE_DEVELOPMENT=1 npm run dev
