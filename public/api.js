const api = {}

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

