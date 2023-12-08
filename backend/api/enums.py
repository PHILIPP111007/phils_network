import enum


class SubscriberStatus(enum.Enum):
	"""Implements subscriber status."""

	IS_FRIEND = 1
	ME_SUBSCRIBER = 2
	HE_SUBSCRIBER = 3
	NO_DATA = 4


class DeleteOption(enum.Enum):
	DELETE_FRIEND = 1
	DELETE_SUBSCRIBER = 2


class FilterOption(enum.Enum):
	FRIENDS = 1
	SUBSCRIPTIONS = 2
	SUBSCRIBERS = 3
	SUBSCRIBERS_COUNT = 4
