from sqlalchemy import Column, String, Integer
from database import Base

# NOTE: When you add problems, use relationships and foreign keys


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    bio = Column(String)



