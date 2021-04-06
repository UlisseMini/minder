from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import crud
import models, schemas
from database import SessionLocal, engine, get_db
from auth import * # FIXME

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise IncorrectAuthException

    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/register")
def register(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    if crud.get_user_by_sub(db, form_data.username):
        raise HTTPException(status_code=400, detail="User exists")

    user = schemas.UserCreate(
        username=form_data.username,
        password=form_data.password,
    )
    crud.add_user(db, user)

    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


# if response_model is not declared then UserInDB is returned, along with hashed_password!
@app.get('/users/me', response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


app.mount('/', StaticFiles(directory='public', html=True))
