from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import crud
import models, schemas
from database import engine, get_db
from auth import Token, get_current_user, get_password_hash, authenticate_user, create_access_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)

    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/register", response_model=Token)
def register(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    if crud.get_user_by_sub(db, form_data.username):
        raise HTTPException(status_code=400, detail="User exists")

    user = schemas.UserCreate(
        username=form_data.username,
        hashed_password=get_password_hash(form_data.password),
    )
    crud.add_user(db, user)

    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


# if response_model is not declared then UserInDB is returned, along with hashed_password!
@app.get('/users/me', response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


app.mount('/', StaticFiles(directory='public', html=True))
