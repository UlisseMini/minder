from pydantic import BaseModel
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    class Config:
        orm_mode = True


class UserCreate(UserBase):
    hashed_password: str


class BioUpdate(BaseModel):
    bio: str


class Problem(BaseModel):
    name: str
    tex: str


class ProblemDB(Problem):
    id: int

    class Config:
        orm_mode = True


class User(UserBase):
    "This schema is returned from our api endpoints"

    bio: Optional[str]
    problems: List[ProblemDB]

    class Config:
        # automatically try getattr when creating user from an object
        orm_mode = True


class ProblemGet(ProblemDB):
    "A problem from /api/problems/get includes the author name and id"
    author_id: int
    author: UserBase

    class Config:
        orm_mode = True
