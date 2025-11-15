from enum import StrEnum


class WebSocketGroup(StrEnum):
	CHAT_GROUP = "chat_{}"
	DELETE_MESSAGE_GROUP = "delete_message_{}"
	LIKE_MESSAGE_GROUP = "like_message_{}"
	VIDEO_STREAMING_GROUP = "video_streaming_group_{}"
	AUDIO_STREAMING_GROUP = "audio_streaming_group_{}"
