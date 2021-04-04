from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from typing import Optional

# TODO: Put in dotenv
SECRET_KEY = '46b68f0d199dbd9a6ed746b361d621fee29c7956438b36b3632cdf98649d44f4'
ALGORITHM = 'HS256'
EXPIRES_DELTA = timedelta(minutes=15)


# relative url, so if our api is foo.bar/api/v1 token would be at foo.bar/api/v1/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="./token")

users_db = {
    'john': {
        'username': 'john',
        'hashed_password': r'$2b$12$KuBfNGGZ3Uac6RNITnI6OefXOaQFo6q6FVrtzXN3XI/wdWYvUxHCS',
        'email': 'john@heyyyyyyyyy.com',
    },

    'alice': {
        'username': 'alice',
        'hashed_password': r'$2b$12$zxT4rQpUQNx3.07I42rAouulPCBM8eIfJy7Z1OWwWj60Q/s1ex.s2',
        'email': 'alice@bobross.com',
    }
}

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    "Data stored (and signed) in the jwt token"
    username: Optional[str] = None


class User(BaseModel):
    username: str
    email: Optional[str] = None


class UserInDB(User):
    hashed_password: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)

def fake_decode_token(token: str):
    return User(username=token)


def get_user(db, username):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)


def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + EXPIRES_DELTA
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user(users_db, username=token_data.username)
    if user is None:
        return credentials_exception

    return user



@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    incorrect_auth_exception = HTTPException(
        status_code=400,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = authenticate_user(users_db, form_data.username, form_data.password)
    if not user:
        raise incorrect_auth_exception

    # What does sub stand for?
    # A: Convention with jwt, stands for "subject" (aka user's identification)
    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


# if response_model is not declared then UserInDB is returned, along with hashed_password!
@app.get('/users/me', response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

