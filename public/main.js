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
  const resp = await fetch("/api/login", {
    method: "POST",
    body: new URLSearchParams({"username": username, "password": password})
  })

  return await resp.json()
}

api.register = async (username, password) => {
  const resp = await fetch("/api/register", {
    method: "POST",
    body: new URLSearchParams({"username": username, "password": password})
  })

  return await resp.json()
}

const hookRegisterForm = () => {
  $("register-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    const json = await api.register(e.target.username.value, e.target.password.value)
    onAccessToken(json['access_token'])

    return false
  })
}

const hookLoginForm = () => {
  $("login-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    const json = await api.login(e.target.username.value, e.target.password.value)
    onAccessToken(json['access_token'])

    return false
  })
}

const hookLogoutForm = () => {
  $("logout-form").addEventListener("submit", () => {
    localStorage.removeItem("access_token")
    onLoggedOut()
  })
}

const onAccessToken = (access_token) => {
  if (typeof access_token != 'string') {
    alert(`access token isn't a string, got ${access_token}`)
  }

  localStorage.setItem('access_token', access_token)
  if (!isLoggedIn()) {
    alert('obtained access token but isLoggedIn -> false')
  }
  onLoggedIn()
}


const navigate = (page) => window.location.hash = '#' + page

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

// called when we are logged in
const onLoggedIn = () => {
  navigate('home')
}

// called when we are logged out
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
