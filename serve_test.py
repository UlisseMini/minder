from serve import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_register_login():
    auth = {"username": "foo", "password": "bar"}

    # LOGIN FAIL
    resp = client.post("/login", data=auth)
    assert resp.status_code == 400

    # REGISTER
    resp = client.post("/register", data=auth)
    assert resp.status_code == 200

    # /users/me (register token)
    register_token = resp.json()['access_token']
    headers = {'Authorization': 'Bearer ' + register_token}
    resp = client.get('/users/me', headers=headers)
    assert resp.status_code == 200
    assert resp.json()['username'] == auth['username']

    # LOGIN
    resp = client.post("/login", data=auth)
    assert resp.status_code == 200
    assert resp.json()['token_type'] == 'bearer'

    # /users/me (login token)
    access_token = resp.json()['access_token']
    headers = {'Authorization': 'Bearer ' + access_token}

    resp = client.get('/users/me', headers=headers)
    assert resp.status_code == 200
    assert resp.json()['username'] == auth['username']

