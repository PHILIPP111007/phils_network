from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from backend.api.enums import FilterOption
from backend.api.serializers import BlogSerializer
from backend.api.services import SubscriberService, BlogService


class NewsAPIView(APIView):
	service_class = BlogService
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, loaded_posts: int) -> Response:
		self.check_permissions(request=request)

		friends = (
			SubscriberService.filter_by_option(
				pk=request.user.pk, option=FilterOption.FRIENDS.value, serializer=False
			)
			.only("pk")
			.values_list("pk", flat=True)
		)

		posts = self.service_class.filter_by_friends(
			friends=friends, loaded_posts=loaded_posts
		)

		if not posts.exists():
			return Response(
				{"ok": False, "error": "Not found posts."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "posts": self.serializer_class(posts, many=True).data},
			status=status.HTTP_200_OK,
		)
