from fastapi import FastAPI, Depends, HTTPException, Request, Response, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import crud
import models, schemas
from database import engine, get_db
from auth import Token, get_current_user, get_password_hash, authenticate_user, create_access_token, CredentialsException

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

templates = Jinja2Templates(directory="templates")

@app.exception_handler(CredentialsException)
def exception_handler(request: Request, exc: CredentialsException) -> Response:
    return RedirectResponse(url='/login')


@app.get("/", response_class=HTMLResponse)
def index(request: Request, user = Depends(get_current_user)):
    return templates.TemplateResponse('home.html', {
        'user': user,
        'request': request,
    })


@app.get("/login", response_class=HTMLResponse)
def get_login(request: Request):
    return templates.TemplateResponse('login.html', {
        'request': request,
    })


@app.get("/register")
def get_register(request: Request):
    return templates.TemplateResponse('register.html', {
        'request': request,
    })


# called after user's successful login, set cookie and redirect to /
def logged_in_response(user):
    access_token = create_access_token(data={"sub": user.username})

    # Status code 302_FOUND makes our POST into a GET
    response = RedirectResponse("/", status_code=302)
    response.set_cookie("access_token", access_token)
    return response



@app.post("/login")
def post_login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)

    return logged_in_response(user)


@app.post("/logout")
async def logout():
    response = RedirectResponse("/", status_code=302)
    response.set_cookie("access_token", "logged_out")
    return response


@app.post("/register", response_model=Token)
def post_register(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    if crud.get_user_by_sub(db, form_data.username):
        raise HTTPException(status_code=400, detail="User exists")

    user = schemas.UserCreate(
        username=form_data.username,
        hashed_password=get_password_hash(form_data.password),
    )
    crud.add_user(db, user)

    return logged_in_response(user)


@app.post("/userinfo")
def userinfo_post(
        bio: str = Form(...),
        user = Depends(get_current_user),
        db = Depends(get_db)):

    user.bio = bio
    db.commit()

    return RedirectResponse("/", status_code=302)


app.mount('/', StaticFiles(directory='public', html=True))
