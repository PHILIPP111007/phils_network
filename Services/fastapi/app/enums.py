__all__ = ["SubscriberStatus", "DeleteOption", "FilterOption"]

from enum import IntEnum


class SubscriberStatus(IntEnum):
	IS_FRIEND = 1
	ME_SUBSCRIBER = 2
	HE_SUBSCRIBER = 3
	NO_DATA = 4


class DeleteOption(IntEnum):
	DELETE_FRIEND = 1
	DELETE_SUBSCRIBER = 2


class FilterOption(IntEnum):
	FRIENDS = 1
	SUBSCRIPTIONS = 2
	SUBSCRIBERS = 3
	SUBSCRIBERS_COUNT = 4
