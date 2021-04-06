from sqlalchemy.orm import Session
import models, schemas

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_sub(db: Session, username: str) -> models.User:
    return db.query(models.User).filter(models.User.username == username).first()


def add_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user
