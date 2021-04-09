from datetime import datetime, timedelta
from passlib.context import CryptContext
from pydantic import BaseModel
from jose import JWTError, jwt

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

from dotenv import load_dotenv
load_dotenv()

import crud
from database import get_db

import os

SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = 'HS256'
EXPIRES_DELTA = timedelta(minutes=15)

# relative url, so if our api is foo.bar/api/v1 token would be at foo.bar/api/v1/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="./api/login")

CredentialsException = HTTPException(
    status_code=400,
    detail="Invalid access token",
    headers={"WWW-Authenticate": "Bearer"},
)

IncorrectAuthException = HTTPException(
    status_code=400,
    detail="Incorrect username or password",
    headers={"WWW-Authenticate": "Bearer"},
)

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    "Data stored (and signed) in the jwt token"
    username: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def authenticate_user(db, username: str, password: str):
    user = crud.get_user_by_sub(db, username)
    if not user:
        raise IncorrectAuthException
    if not verify_password(password, user.hashed_password):
        raise IncorrectAuthException
    return user


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + EXPIRES_DELTA
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(db = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise CredentialsException
    except JWTError:
        raise CredentialsException

    # subject is usually username or email, user identification in oauth2.
    user = crud.get_user_by_sub(db, sub)
    if not user:
        return CredentialsException

    return user
