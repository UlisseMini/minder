from serve import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_register_login():
    auth = {"username": "foo", "password": "bar"}

    resp = client.post("/login", data=auth)
    assert resp.status_code == 400

    resp = client.post("/register", data=auth)
    assert resp.status_code == 200

    resp = client.post("/login", data=auth)
    assert resp.status_code == 200

