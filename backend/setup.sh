#!/bin/bash

env=""
migrations=""
static=""
superuser=""

read -p "[1 / 4] Create mamba env and download packages? [y / n] : " env
read -p "[2 / 4] Create migrations? [y / n] : " migrations
read -p "[3 / 4] Collect static files? [y / n] : " static
read -p "[4 / 4] Create superuser? [y / n] : " superuser

eval "$(micromamba shell hook --shell bash)"

# `tmp` directory is for Django logging
#
# Script creates 2 files:
# tmp/server_debug.log - logging with DEBUG == True
# tmp/server_prod.log - logging with DEBUG == False
logging() {
	mkdir $PWD/tmp

	if [ ! -f "tmp/server_debug.log" ]
		then
			touch tmp/server_debug.log
	fi
		
	if [ ! -f "tmp/server_prod.log" ]
		then
			touch tmp/server_prod.log
	fi
}

create_env() {
	micromamba deactivate
	micromamba env remove -n phils_network
	micromamba env create -f ./env.yml
	micromamba activate phils_network
	pip list
	echo "Env script: venv created."
}

create_migrations() {
	micromamba activate phils_network
	python manage.py makemigrations
	python manage.py migrate
	echo "Migrations script: migrations created."
}

collect_static() {
	micromamba activate phils_network
	python manage.py collectstatic
}

create_superuser() {
	micromamba activate phils_network
	python manage.py createsuperuser
}


if [ ! -d "tmp" ]
	then
		logging
fi

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

# Collect static files
if [ $static = "y" ]
	then
		collect_static
fi

# Create super user
if [ $superuser = "y" ]
	then
		create_superuser
fi

echo "Main script: Done."