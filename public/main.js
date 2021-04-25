// fun fact: these are actually provided by many browsers for debugging
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

HTMLElement.prototype.$ = function (x) {return this.querySelector(x)}
HTMLElement.prototype.$$ = function (x) {return this.querySelectorAll(x)}

// global state ):
const state = {}

const renderMath = (tex, outputEl) => {
  const target = document.createElement("p")
  target.id = "edit-target" // must be in sync with 
  target.innerText = tex

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

  outputEl.replaceChildren(errors, target)
}

const hookRegisterForm = () => {
  $("#register-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    const resp = await api.register(e.target.username.value, e.target.password.value)
    await handleAuthResp(resp)

    return false
  })
}

const hookLoginForm = () => {
  $("#login-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    const resp = await api.login(e.target.username.value, e.target.password.value)
    await handleAuthResp(resp)

    return false
  })
}

// Used in common between login and register, since they both return an auth response.
const handleAuthResp = async (resp) => {
  const json = await resp.json()
  if (resp.status == 200) {
    onAccessToken(json['access_token'])
  } else if (resp.status == 400) {
    // should be unknown user or pass
    alert(json['detail'])
  } else {
    await api.throwOnStatus(resp, json)
  }
}

const hookLogoutForm = () => {
  $("#logout-form").addEventListener("submit", (e) => {
    if (e.preventDefault) e.preventDefault()

    localStorage.removeItem("access_token")
    onLoggedOut()

    return false
  })
}

const hookBioForm = () => {
  $("#bio-form").addEventListener("submit", async (e) => {
    if (e.preventDefault) e.preventDefault()

    e.target.save.value = "Saving"

    const bio = e.target.bio.value
    const resp = await api.bio(bio)
    if (resp.status != 200) {
      // TODO: Abstract the check if logged in logic
      if (!isLoggedIn()) {
        console.log("token expired")
        e.target.save.value = "Save"
        onLoggedOut()
        return false
      }

      const json = await resp.json()
      await api.throwOnStatus(resp, json)
    }

    e.target.save.value = "Saved"
    setTimeout(() => e.target.save.value = "Save", 1000)

    return false
  })
}

const Problem = (data) => {
  const el = template('problem', data)
  renderMath(data.tex, el.$(`[data-tex-rendered]`))
  el.dataset.pid = data.id
  hookProblemEdit(el)
  return el
}

const saveEditor = async (problem) => {
  console.log(problem)
  const resp = problem.id
    ? await api.problems.update(problem)
    : await api.problems.add(problem)
  await api.throwOnStatus(resp)

  // problem may not have an id yet if we're adding, so
  // replace it with the problem from the db.
  problem = await resp.json()

  // if I use Problem in #editor this selector would grab the wrong guy.
  let problemElement = $(`#home [data-pid="${problem.id}"]`)
  if (problemElement) {
    problemElement.replaceWith(Problem(problem))
  } else {
    $("#my-problems").appendChild(Problem(problem))
  }

  navigate("home")
}

const renderEditor = (problem) => {
  setSlots($("#editor"), problem)
  renderMath(problem.tex, $("#edit-output"))
}

const hookEditor = () => {
  $("#edit-form").addEventListener("submit", (e) => {
    if (e.preventDefault) e.preventDefault()

    const problem = getSlots($("#editor-form"))
    saveEditor(problem)

    return false
  })

  $("#editor textarea").addEventListener("input", (e) => {
    const tex = e.target.value
    renderMath(tex, $("#edit-output"))
  })
}

// TODO: Have the API return a dict of id -> problem.
const problemById = (id) => {
  for (const p of state.profile.problems) {
    if (p.id == id) {return p}
  }
  throw new Error(`no problem id=${id} in problems=${JSON.stringify(state.profile.problems)}`)
}

const hookProblemEdit = (problemEl) => {
  problemEl.$("button").addEventListener('click', (e) => {
    if (e.preventDefault) e.preventDefault()

    const problem = problemById(problemEl.dataset.pid)

    renderEditor(problem)
    navigate('editor')

    return false
  })
}

const onAccessToken = (access_token) => {
  if (typeof access_token != 'string') {
    throw new Error(`access token isn't a string, got ${access_token}`)
  }

  localStorage.setItem('access_token', access_token)
  if (!isLoggedIn()) {
    throw new Error('obtained access token but isLoggedIn -> false')
  }
  onLoggedIn()
}

// TODO: Maybe instead of css hidden use replaceChild on app element with
// filled out template. aka "real" client side routing.
const navigate = (page) => {
  console.log('navigate', page)
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
  await api.throwOnStatus(resp)

  const profile = await resp.json()
  state.profile = profile
  console.log(profile.problems)

  // Render our problems
  const children = profile.problems.map((data) => Problem(data))
  $('#my-problems').replaceChildren(...children)

  setSlots($("#home"), profile)
  navigate('home')
}

const onLoggedOut = () => {
  state.profile = null
  navigate('login')
}

const hookNavigation = () => {
  $$('a[href^="#"]').forEach(el => {
    el.addEventListener("click", () => {
      navigate(el.getAttribute('href').slice(1))
    })
  })
}

const hookNewProblem = () => {
  const defaultProblem = {id: "", tex: "What is $2+2$?", name: "rain man hypothesis"}
  $("#new-problem").addEventListener("click", () => {
    renderEditor(defaultProblem)
    navigate("editor")
  })
}

const contentLoaded = () => {
  hookNavigation()
  hookLoginForm()
  hookRegisterForm()
  hookLogoutForm()
  hookBioForm()
  hookEditor()
  hookNewProblem()

  if (isLoggedIn()) {
    onLoggedIn()
  } else {
    onLoggedOut()
  }
}

document.addEventListener("DOMContentLoaded", contentLoaded)
