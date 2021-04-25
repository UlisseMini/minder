const api = {}

class APIError extends Error {
  constructor(message, json) {
    super(message)
    this.name = "APIError"
    this.msg = message
    this.json = json
  }

  toString() {
    return JSON.stringify({
      name: this.name,
      msg: this.msg,
      json: this.json,
    }, null, 2)
  }
}

api.throwOnStatus = async (resp, json) => {
  if (resp.status != 200) {
    throw new APIError(`bad status ${resp.status} from ${resp.url}`, json || await resp.json())
  }
}


api.login = async (username, password) => {
  return await fetch("/api/login", {
    method: "POST",
    body: new URLSearchParams({"username": username, "password": password})
  })
}

api.register = async (username, password) => {
  return await fetch("/api/register", {
    method: "POST",
    body: new URLSearchParams({"username": username, "password": password})
  })
}

api.profile = async () => {
  return await fetch("/api/profile", {
    headers: {
      "Authorization": `Bearer ${localStorage.access_token}`,
    }
  })
}

api.bio = async (bio) => {
  return await fetch("/api/bio", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({bio: bio}),
  })
}

api.problems = {}

api.problems.update = async (problem) => {
  return await fetch(`/api/problems/update?id=${problem.id}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(problem),
  })
}

api.problems.add = async (problem) => {
  return await fetch(`/api/problems/add`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(problem),
  })
}

api.problems.get = async () => {
  return await fetch(`/api/problems/get`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${localStorage.access_token}`,
    },
  })
}
