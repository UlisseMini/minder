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

const onLoggedIn = () => {
  const jwt = parseJWT(localStorage.access_token)
  navigate('home', {username: jwt.sub})
}

const onLoggedOut = () => {
  navigate('login')
}

const contentLoaded = () => {
  hookLoginForm()
  hookRegisterForm()
  hookLogoutForm()

  if (isLoggedIn()) {
    onLoggedIn()
  } else {
    onLoggedOut()
  }
}

document.addEventListener("DOMContentLoaded", contentLoaded)
