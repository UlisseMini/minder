from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# NOTE: When you add problems, use relationships and foreign keys


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    bio = Column(String)

    problems = relationship("Problem", back_populates="owner")



class Problems(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True)
    tex = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="problems")
