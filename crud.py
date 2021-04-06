from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_sub(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def add_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user
