#!/bin/bash

env=""
migrations=""
static=""
superuser=""

read -p "[1 / 3] Create mamba env and download packages? [y / n] : " env
read -p "[2 / 3] Create migrations? [y / n] : " migrations
read -p "[3 / 3] Create superuser? [y / n] : " superuser

eval "$(micromamba shell hook --shell bash)"

create_env() {
	micromamba deactivate
	micromamba env remove -n phils_network
	micromamba env create -f ./env.yml
	micromamba activate phils_network
	pip list
	pip freeze > requirements.txt
	echo "Env script: venv created."
}

create_migrations() {
	micromamba activate phils_network
	python manage.py makemigrations
	python manage.py migrate
	echo "Migrations script: migrations created."
}

create_superuser() {
	micromamba activate phils_network
	python manage.py createsuperuser
}

# Create venv and install packages
if [ $env = "y" ]
	then
		create_env
fi

# Make migrations
if [ $migrations = "y" ]
	then
		create_migrations
fi

# Create super user
if [ $superuser = "y" ]
	then
		create_superuser
fi

echo "Main script: Done."