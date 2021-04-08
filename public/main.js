function $(x) {return document.getElementById(x)}
function h(tag, attrs, children) {
  const el = document.createElement(tag)
  if (attrs) {
    for (let attr in attrs) {el.setAttribute(attr, attrs[attr])}
  }
  if (children) {
    children.forEach(child => el.append(child))
  }

  return el
}

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

const hookRegisterForm = () => {
  $("register-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    const resp = await api.register(e.target.username.value, e.target.password.value)
    await handleAuthResp(resp)

    return false
  })
}

const hookLoginForm = () => {
  $("login-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    const resp = await api.login(e.target.username.value, e.target.password.value)
    await handleAuthResp(resp)

    return false
  })
}

// Used in common between login and register, since they both return an auth response.
const handleAuthResp = async (resp) => {
  const json = await resp.json()
  if (resp.status != 200) {
    alert(json['detail'])
    return
  }

  onAccessToken(json['access_token'])
}

const hookLogoutForm = () => {
  $("logout-form").addEventListener("submit", (e) => {
    if (e.preventDefault) e.preventDefault()

    localStorage.removeItem("access_token")
    onLoggedOut()

    return false
  })
}

const hookBioForm = () => {
  $("bio-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    e.target.save.value = "Saving"

    const bio = e.target.bio.value
    const resp = await api.bio(bio)
    if (resp.status != 200) {
      const json = await resp.json()
      alert(json['detail'])
    }

    e.target.save.value = "Saved"
    setTimeout(() => e.target.save.value = "Save", 1000)

    return false
  })
}

const onAccessToken = (access_token) => {
  if (typeof access_token != 'string') {
    alert(`access token isn't a string, got ${access_token}`)
    return
  }

  localStorage.setItem('access_token', access_token)
  if (!isLoggedIn()) {
    alert('obtained access token but isLoggedIn -> false')
    return
  }
  onLoggedIn()
}

const populateText = (text, data) => {
  for (let attr in data) {
    text = text.replaceAll(`{${attr}}`, data[attr])
  }
  return text
}

const populate = (elem, data) => {
  elem.querySelectorAll("p, span, a, pre").forEach(child => {
    child.innerText = populateText(child.innerText, data)
  })

  elem.querySelectorAll("textarea").forEach(child => {
    child.value = populateText(child.value, data)
  })
}

const navigate = (page, data) => {
  if (data) {populate($(page), data)}
  window.location.hash = '#' + page
}

const parseJWT = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}

const isLoggedIn = () => {
  const tok = localStorage.access_token
  if (!tok) return false

  const jwt = parseJWT(tok)
  if (!jwt) return false
  if (Date.now() >= jwt['exp'] * 1000) return false

  return true
}

const onLoggedIn = async () => {
  const resp = await api.profile()
  if (resp.status != 200) {
    alert(`status ${resp.status} from /api/profile`)
    return
  }
  const profile = await resp.json()

  navigate('home', {...profile})
}

const onLoggedOut = () => {
  navigate('login')
}

const contentLoaded = () => {
  hookLoginForm()
  hookRegisterForm()
  hookLogoutForm()
  hookBioForm()

  if (isLoggedIn()) {
    onLoggedIn()
  } else {
    onLoggedOut()
  }
}

document.addEventListener("DOMContentLoaded", contentLoaded)
