from serve import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_register_login():
    auth = {"username": "foo", "password": "bar"}

    # LOGIN FAIL
    resp = client.post("/api/login", data=auth)
    assert resp.status_code == 400

    # REGISTER
    resp = client.post("/api/register", data=auth)
    assert resp.status_code == 200

    # /api/profile (register token)
    register_token = resp.json()['access_token']
    headers = {'Authorization': 'Bearer ' + register_token}
    resp = client.get('/api/profile', headers=headers)
    assert resp.status_code == 200
    assert resp.json()['username'] == auth['username']

    # /api/login
    resp = client.post("/api/login", data=auth)
    assert resp.status_code == 200
    assert resp.json()['token_type'] == 'bearer'

    # /api/profile (login token)
    access_token = resp.json()['access_token']
    headers = {'Authorization': 'Bearer ' + access_token}

    resp = client.get('/api/profile', headers=headers)
    assert resp.status_code == 200
    assert resp.json()['username'] == auth['username']
    assert 'password' not in resp.text

    # /api/bio test updating bio
    bio = "I love apples"
    resp = client.post(f'/api/bio?bio={bio}', headers=headers)
    assert resp.status_code == 200

    resp = client.get('/api/profile', headers=headers)
    assert resp.status_code == 200
    assert resp.json()['bio'] == bio
