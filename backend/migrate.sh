#!/bin/bash

# This script makes migrations
GREEN='\033[0;32m'
NC='\033[0m' # No Color
venvActived="venv activated"

if [ -d ".venv" ]; then source $PWD/.venv/bin/activate; echo $venvActived; fi
if [ -d "venv" ]; then source $PWD/venv/bin/activate; echo $venvActived; fi
if [ -d ".env" ]; then source $PWD/.env/bin/activate; echo $venvActived; fi

python manage.py makemigrations
python manage.py migrate

echo $'\nmigrations created!'

printf "${GREEN}Create super user? [y / n] :${NC}"
read answer

if [ $answer = "y" ]
    then
        python manage.py createsuperuser
fi