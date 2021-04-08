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
    resp = client.post(f'/api/bio', headers=headers, json={'bio': bio})
    assert resp.status_code == 200

    resp = client.get('/api/profile', headers=headers)
    assert resp.status_code == 200
    assert resp.json()['bio'] == bio

    # api/problems/add
    problem = {
        'name': 'Riemann hypothesis',
        'tex': '$2 + 2$',
    }
    resp = client.post('/api/problems/add', headers=headers, json=problem)
    assert resp.status_code == 200
    db_problem = resp.json()
    assert problem == db_problem

    # check that the problem was added
    resp = client.get('/api/problems/get', headers=headers)
    assert resp.status_code == 200
    print(resp.json())
    assert len(resp.json()) == 1 # only one problem so far
    for k in problem:
        # there are extra fields like id and author_id, we don't care about those.
        assert resp.json()[0][k] == problem[k]
