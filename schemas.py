from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    "This schema is returned from our api endpoints"

    bio: Optional[str]

    class Config:
        # automatically try getattr when creating user from an object
        orm_mode = True