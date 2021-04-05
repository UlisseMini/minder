from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from typing import Optional
from pydantic import BaseModel

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


app = FastAPI()

class User(BaseModel):
    username: str
    email: Optional[str] = None


class UserInDB(User):
    hashed_password: str


def get_user(username):
    if username in users_db:
        user_dict = users_db[username]
        # This can return any object, auth doesn't care!
        return UserInDB(**user_dict)


# auth needs get_user in scope
from auth import *


@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise IncorrectAuthException

    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/register")
async def register(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username in users_db:
        raise HTTPException(status_code=400, detail="User exists")

    users_db[form_data.username] = dict(
        username=form_data.username,
        email='unknown@null.com', # TODO: add emails
        hashed_password=get_password_hash(form_data.password),
    )

    access_token = create_access_token(data={"sub": form_data.username})

    return {"access_token": access_token, "token_type": "bearer"}


# if response_model is not declared then UserInDB is returned, along with hashed_password!
@app.get('/users/me', response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


app.mount('/', StaticFiles(directory='public', html=True))
