from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles

import crud
import models, schemas
from database import engine, get_db
from auth import Token, get_current_user, get_password_hash, authenticate_user, create_access_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

api = APIRouter()

@api.post("/login", response_model=Token)
def api_login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    "Login a registered user"
    user = authenticate_user(db, form_data.username, form_data.password)
    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@api.post("/register", response_model=Token)
def api_register(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    "Register a new user"
    if crud.get_user_by_sub(db, form_data.username):
        raise HTTPException(status_code=400, detail="User exists")

    user = schemas.UserCreate(
        username=form_data.username,
        hashed_password=get_password_hash(form_data.password)
    )
    crud.add_user(db, user)

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@api.get("/profile", response_model=schemas.User)
def profile(user = Depends(get_current_user)):
    "Get profile info"
    return user


@api.post("/bio")
def bio(data: schemas.BioUpdate, user = Depends(get_current_user), db = Depends(get_db)):
    "Update bio"
    user.bio = data.bio
    db.commit()
    return {'status': 'ok'}


@api.post("/problem/add")
def add_problem(problem: schemas.Problem, user = Depends(get_current_user), db = Depends(get_db)):
    "Add a problem"
    db_problem = models.Problem(**problem.dict(), author_id=user.id)
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)

    return problem



app.include_router(api, prefix='/api')
app.mount('/', StaticFiles(directory='public', html=True))
