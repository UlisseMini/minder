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

api.problems = {}

api.problems.update = async (id, problem) => {
  return await fetch(`/api/problems/update?id=${id}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(problem),
  })
}

const Editor = {
  root: $("editor"),

  query: function (sel) {
    return this.root.querySelector(sel)
  },

  save: async function () {
    const resp = await api.problems.update(this.problem.id, {
      tex: this.problem.tex,
      name: this.problem.name,
    })
    if (resp.status != 200) {
      crash(resp.json())
    }

    const problemJson = await resp.json()

    populateSlots(this.attached, problemJson)
    this.setProblem(problemJson)
    navigate("home")
  },

  setProblem: function (problem) {
    this.problem = problem
  },

  init: function () {
    this.query("textarea").addEventListener("input", (e) => {
      this.setProblem({...this.problem, tex: e.target.value})
      this.renderMath()
    })

    this.query('[name="problem-name"]').addEventListener("input", (e) => {
      this.setProblem({...this.problem, name: e.target.value})
    })

    this.query("form").addEventListener('submit', async (e) => {
      if (e.preventDefault) e.preventDefault()

      await this.save()

      return false
    })
  },

  populate: function (problem) {
    this.query('textarea').value = problem.tex
    this.query('[name="problem-id"]').value = problem.id
    this.query('[name="problem-name"]').value = problem.name

    this.setProblem(problem)
    this.renderMath()
  },

  attach: function (problemEl) {
    this.attached = problemEl
  },

  renderMath: function () {
    const target = document.createElement("p")
    target.id = "edit-target" // must be in sync with 
    target.innerText = Editor.problem.tex

    const errors = document.createElement("p")
    errors.style.color = "red"
    errors.id = "edit-errors"

    let errorsList = []

    // Provided by auto-render.js (katex extension)
    renderMathInElement(target, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false},
        {left: "\\(", right: "\\)", display: false},
        {left: "\\[", right: "\\]", display: true}
      ],
      errorCallback: (msg) => {
        errorsList.push(msg)
      }
    })

    errors.innerText = errorsList.join('\n')

    this.query("#edit-output").replaceChildren(errors, target)
  }
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


// FIXME: When you edit something edited it doesn't update since
// data is closed over
const hookProblemEdit = (el, data) => {
  el.querySelector("button").addEventListener('click', (e) => {
    if (e.preventDefault) e.preventDefault()

    Editor.populate(data)
    Editor.attach(el)
    Editor.renderMath()

    navigate('editor')

    return false
  })
  return el
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

const navigate = (page, data) => {
  if (data) populateSlots($(page), data)

  window.location.hash = '#' + page
}

const populateSlots = (el, data) => {
  el.querySelectorAll('[slot]').forEach(slotEl => {
    const name = slotEl.getAttribute('slot')

    // If no data, just don't populate
    if (data[name]) {
      slotEl.innerText = data[name]
    }
  })
}

const template = (id, data) => {
  const el = $(id).cloneNode(true)
  el.classList.remove('hidden')
  el.removeAttribute('id')
  if (data) {populateSlots(el, data)}

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
  console.log(profile.problems)

  // Render our problems
  const children = profile.problems.map(data => {
    const el = template('problem', data)
    return hookProblemEdit(el, data)
  })
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
  Editor.init()

  if (isLoggedIn()) {
    onLoggedIn()
  } else {
    onLoggedOut()
  }
}

document.addEventListener("DOMContentLoaded", contentLoaded)
