# phils_network

Minimalistic social network written using Django and React.

## What supports this app
1. Accounts and adding friends. Each user has the opportunity to maintain their own blog, subscribe to other people and see their blogs.

2. Dark theme.

3. Lazy loading of pages, posts and messages.

4. You can create a conversation and chat with friends.

\
Have fun and if you want please leave feedback!

## Technologies used

* Django \
https://www.djangoproject.com/

* Django REST framework \
https://www.django-rest-framework.org/

* django-channels \
https://channels.readthedocs.io/en/stable/index.html

* daphne \
https://pypi.org/project/daphne/

* gunicorn \
https://docs.gunicorn.org/en/stable/index.html

* React \
https://react.dev/learn

## Installation

Go to backend directory.

```sh
cd backend
```

Run `setup.sh` script to create venv, DB migrations and superuser.
```sh
bash setup.sh
```

Activate python virtual enviroment.
```sh
source venv/bin/activate
```

\
**Phils_network** supports two servers: `daphne` and `gunicorn` (with `uvicorn` async workers).


* Run backend app with `daphne`:
```sh
python manage.py runserver
```

* Run backend app with `gunicorn`:
```sh
gunicorn -c gunicorn.conf.py
```

\
By default debug is True, so if needed, go to the `.env.toml` file and replace `DEBUG` variable from `“1”` to `“0"`. With `DEBUG == False` gunicorn starts in daemonized mode. See `gunicorn.conf.py` file for more information about gunicorn configuration.

Logging takes place in the tmp folder. If DEBUG, file - `backend/tmp/server_debug.log` else `backend/tmp/server_prod.log`.

\
Then go to the frontend directory.

```sh
cd ../frontend
```

Install npm packages.
```sh
npm install
```

Create production frontend app.
```sh
npm run build
```

Run the frontend app.
```sh
serve -s build
```
