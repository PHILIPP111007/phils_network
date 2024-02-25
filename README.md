# phils_network

Minimalistic social network written using Django and React.

## What supports this app
1. Accounts and adding friends. Each user has the opportunity to maintain their own blog, subscribe to other people and see their blogs.

2. Dark theme.

3. You can create a conversation and chat with friends.

4. Lazy loading of pages, posts and messages.

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

* Redis \
https://redis.io/docs/

* Postgres \
https://www.postgresql.org/

* React \
https://react.dev/learn


## Installation

Postgres.
```sh
brew install postgresql@15
brew services run postgresql@15

createuser -s postgres
createdb phils_network --owner=postgres --username=postgres
psql phils_network --username=postgres
```

Redis.
```sh
brew install redis
```

Run redis server in the new terminal window (to use the chat).
```sh
redis-server
```

Install micromamba
```sh
brew install micromamba
```

Run `setup.sh` script to create venv, DB migrations, superuser and collect static files.
```sh
bash backend/setup.sh
```

Activate micromamba enviroment.
```sh
micromamba activate phils_network
```

If you want to test data base, run:
```sh
python backend/manage.py shell < test_db.py
```

\
**Phils_network** supports two servers: `daphne` and `gunicorn` (with `uvicorn` async workers).


* Run backend app with `daphne`:
```sh
python backend/manage.py runserver
```

* Run backend app with `gunicorn`:
```sh
bash backend/gunicorn_rc
```

\
By default debug is True, so if needed, go to the `/phils_network/backend/.env.toml` file and replace `DEBUG` variable from `“1”` to `“0"`. With `DEBUG == False` gunicorn starts in daemonized mode. See `/phils_network/backend/gunicorn.conf.py` file for more information about gunicorn configuration.

Logging takes place in the tmp folder. If DEBUG, file - `/phils_network/backend/tmp/server_debug.log` else `/phils_network/backend/tmp/server_prod.log`.

\
Then go to the frontend directory.

```sh
cd ../frontend
```

Install npm packages.
```sh
npm install
```

\
By default, django server runs on the 0.0.0.0 host and 8000 port (see `/phils_network/backend/.env.toml` file). So make sure that SERVER_HOST and SERVER_PORT variables in the `/phils_network/frontend/.env` file are similar to your backend.

Create production frontend app.
```sh
npm run build
```

Run the frontend app.
```sh
serve -s build
```
