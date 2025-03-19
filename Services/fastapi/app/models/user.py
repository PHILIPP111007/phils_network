__all__ = ["User"]


from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
	__tablename__ = "app_user"

	id: int = Field(primary_key=True)
	username: str
	email: str
	first_name: str
	last_name: str
	is_online: bool

	# Relations
	tokens: list["Token"] = Relationship(back_populates="user")
	blogs: list["Post"] = Relationship(back_populates="user")
	subscriber_user: list["Subscriber"] = Relationship(
		back_populates="user",
		sa_relationship_kwargs={
			"primaryjoin": "Subscriber.user_id==User.id",
			"lazy": "select",
		},
	)
	subscriber_subscribe: list["Subscriber"] = Relationship(
		back_populates="subscribe",
		sa_relationship_kwargs={
			"primaryjoin": "Subscriber.subscribe_id==User.id",
			"lazy": "select",
		},
	)
	room_creators: list["Room"] = Relationship(back_populates="creator")
	room_subscribers: list["RoomSubscribers"] = Relationship(back_populates="user")
	messages: list["Message"] = Relationship(back_populates="sender")
	viewed: list["MessageViewed"] = Relationship(back_populates="user")
	room_invitations_creators: list["RoomInvitation"] = Relationship(
		back_populates="creator",
		sa_relationship_kwargs={
			"primaryjoin": "RoomInvitation.creator_id==User.id",
			"lazy": "select",
		},
	)
	room_invitations_to_users: list["RoomInvitation"] = Relationship(
		back_populates="to_user",
		sa_relationship_kwargs={
			"primaryjoin": "RoomInvitation.to_user_id==User.id",
			"lazy": "select",
		},
	)
