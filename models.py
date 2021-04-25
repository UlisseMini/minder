from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(32), unique=True, index=True)
    hashed_password = Column(String)
    bio = Column(String(256), default=lambda: '', nullable=False)

    problems = relationship("Problem", back_populates="author")


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True)
    name = Column(String(64))
    tex = Column(String(1024))
    author_id = Column(Integer, ForeignKey("users.id"))

    author = relationship("User", back_populates="problems")
