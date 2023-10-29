import json

from django.contrib.auth.models import User

from rest_framework.test import APITestCase


USER_USERNAME = 'admin'
USER_FIRST_NAME = 'Test'
USER_LAST_NAME = 'Test'
USER_EMAIL = 'example@example.com'
USER_PASSWORD = '123'


class UserTestCase(APITestCase):

    def setUp(self) -> None:
        self.username = USER_USERNAME
        self.first_name = USER_FIRST_NAME
        self.last_name = USER_LAST_NAME
        self.password = USER_PASSWORD
        self.email = USER_EMAIL

        User.objects.create_user(
            username=self.username,
            first_name=self.first_name,
            last_name=self.last_name,
			password=self.password,
            email=self.email
        )

    def test_get_user(self) -> None:
        user = User.objects.get(username=self.username)
        self.assertTrue(user)
        self.assertEqual(user.username, USER_USERNAME)
        self.assertEqual(user.first_name, USER_FIRST_NAME)
        self.assertEqual(user.last_name, USER_LAST_NAME)
        self.assertEqual(user.email, USER_EMAIL)

    
    def test_login(self) -> None:
        resp = self.client.post('/auth/token/login/', \
                                {'username': self.username, 'password': self.password}, \
                                    format='json')

        token: dict[str, str] = json.loads(resp.content)

        assert 'auth_token' in token

    def test_auth(self) -> None:
        user = User.objects.get(username=self.username)

        self.assertTrue(user.is_authenticated)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_anonymous)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
