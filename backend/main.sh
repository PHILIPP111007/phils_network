#!/bin/bash

venv=""
migrations=""
superuser=""

read -p "Create venv and download packages? [y / n] : " venv
read -p "Create migrations? [y / n] : " migrations
read -p "Create superuser? [y / n] : " superuser

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
            else
                if [ -f "requirements.txt" ]
                    then
                        pip install -r requirements.txt
                    else
                        echo "Venv script: requirements file does not exists."
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

echo "Main script: Done."