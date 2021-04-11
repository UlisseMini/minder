function $(x) {return document.getElementById(x)}

// Raising an exception and alerting might be better
// If I'm going this route I should use sentry tbh
// FIXME: Possible but unlikely/hard to exploit XSS
function crash(msg) {
  console.error(msg)

  if (typeof msg != 'string') {msg = JSON.stringify(msg, null, 2)}

  document.body.innerHTML = `
  <h1>An error has occured</h1>
  <p>Please report this to <code>uli#4334</code> on discord, or <a href="https://github.com/UlisseMini/minder/issues">on github</a></p>
  <p>Include a screenshot of the dev console and network tab if possible.</p>
  <pre style="color: red;">${msg}</pre>
  `
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
    if (resp.status == 400) {
      // should be unknown user or pass
      alert(json['detail'])
    } else {
      crash(json)
    }
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
      if (!isLoggedIn()) {
        console.log("token expired")
        e.target.save.value = "Save"
        onLoggedOut()
        return false
      }

      const json = await resp.json()
      crash({status: resp.status, json: json})
    }

    e.target.save.value = "Saved"
    setTimeout(() => e.target.save.value = "Save", 1000)

    return false
  })
}

const onAccessToken = (access_token) => {
  if (typeof access_token != 'string') {
    crash(`access token isn't a string, got ${access_token}`)
    return
  }

  localStorage.setItem('access_token', access_token)
  if (!isLoggedIn()) {
    crash('obtained access token but isLoggedIn -> false')
    return
  }
  onLoggedIn()
}

// An object doesn't work for some reason, if h = document.createElement we know
// h('p') != h('p')
// so you would expect
// x = {}; x[h('p')] = 5; x[h('p')] == undefined
// but it isn't! it gives us 5, a Map works though.
const templateText = new Map()

// TODO: once to prevent memory leaks when template is used
const populate = (el, data, once) => {
  // once means we're only populating once.

  // Replace our children's text
  // TODO: Only children we care about? faster.
  Array.from(el.children).forEach(child => populate(child, data))

  // Check that we have text \w templates before we replace
  // If we don't do this we'll reset text without templates in it!
  if ((!el.firstChild || !el.firstChild.nodeValue)
    || !el.firstChild.nodeValue.match(/{\w+}/g)) {
    return el
  }

  // Save template text for next time
  if (!once && !templateText.get(el)) {templateText.set(el, el.firstChild.nodeValue)}

  // Replace our text
  let text = once ? el.firstChild.nodeValue : templateText.get(el)
  Object.entries(data).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, value)
  })
  el.firstChild.nodeValue = text

  return el
}

const navigate = (page, data) => {
  window.location.hash = '#' + page
  if (data) populate($(page), data)
}

const template = (name, data) => {
  const id = name + '-template'
  const el = $(id).cloneNode(true)
  el.classList.remove('hidden')
  el.removeAttribute('id')
  if (data) {populate(el, data, true)}
  return el
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
    const json = await resp.json()
    crash({status: resp.status, json: json})
    return
  }
  const profile = await resp.json()

  // Render our problems
  profile.problems = [
    {name: 'yes', tex: '2+2'},
    {name: 'no', tex: '3+3'}
  ]

  const children = profile.problems.map(data => template('problem', data))
  $('my-problems').replaceChildren(...children)

  navigate('home', profile)
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
