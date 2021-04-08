from pydantic import BaseModel
from typing import Optional, List

class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    hashed_password: str


class BioUpdate(BaseModel):
    bio: str


class Problem(BaseModel):
    name: str
    tex: str


class User(UserBase):
    "This schema is returned from our api endpoints"

    bio: Optional[str]
    problems: List[Problem]

    class Config:
        # automatically try getattr when creating user from an object
        orm_mode = True
