#!/bin/bash

venv=""
migrations=""
superuser=""

read -p "[1 / 3] Create venv and download packages? [y / n] : " venv
read -p "[2 / 3] Create migrations? [y / n] : " migrations
read -p "[3 / 3] Create superuser? [y / n] : " superuser

if [ $venv = "y" ]
    then
        if [ ! -d "venv" ]
            then
                python3 -m venv venv
        fi

        source $PWD/venv/bin/activate
        pip install --upgrade pip

        if [ -f "requirements.in" ]
            then
                pip install -r requirements.in
                pip freeze > requirements.txt
            else
                if [ -f "requirements.txt" ]
                    then
                        pip install -r requirements.txt
                    else
                        echo "Venv script: requirements file does not exist."
                fi
        fi

        pip list
        echo "Venv script: venv created."
fi

if [ $migrations = "y" ]
    then
        if [ -d "venv" ]
            then
                source $PWD/venv/bin/activate
                python manage.py makemigrations
                python manage.py migrate
                echo "Migrations script: migrations created."
            else
                echo "Migrations script: you dont have venv."
        fi
fi

if [ $superuser = "y" ]
    then
        if [ -d "venv" ]
            then
                source $PWD/venv/bin/activate
                python manage.py createsuperuser
            else
                echo "Migrations script: you dont have venv."
        fi
fi

if [ ! -d "tmp" ]
    then
        mkdir $PWD/tmp
fi

echo "Main script: Done."