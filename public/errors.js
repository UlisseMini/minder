// if you're reading this pls don't spam my error reporting D:
const WEBHOOK_URL = "https://discord.com/api/webhooks/835594618355187726/G71v6dX-8FOvGvfIlVYNXX0ckHM1QQya0cFahIauffrmSMU_wz9M8x5C60wjPN-r3QIl?wait=true"

const webhook = async (jsonBody, file, filename) => {
  let form = new FormData()
  form.append('payload_json', JSON.stringify(jsonBody))
  if (file) {
    form.append('file', file, filename)
  }

  const resp = await fetch(WEBHOOK_URL, {method: "POST", body: form})
  api.throwOnStatus(resp)

  return resp
}

function crash(exc) {
  document.body.innerHTML = `
  <h1>An error has occured</h1>
  <p>Reporting...</p>
  <pre style="color: red;">${exc.toString()}</pre>
  `

  const p = document.body.querySelector("p")
  if (window.location.hostname != "localhost") {
    const c = "```"
    let content = ""
    content += `Error: ${c}${exc.toString()}${c}\n\n`
    content += `User Agent: \`${navigator.userAgent}\`\n`
    content += `Stack: ${c}${exc.stack}${c}\n\n`
    content += `jwt: \`${JSON.stringify(parseJWT(localStorage.access_token))}\`\n`
    content += `date: \`${Date.now()}\`\n`

    const file = new Blob(
      [JSON.stringify({state, localStorage}, null, 2)],
      {type: 'application/json'}
    )
    webhook({content: content}, file, 'state.json')
      .then(r => {
        p.innerText = r.status == 200
          ? "Reported to uli, hopefully he fixes it soon"
          : `Failed to report, webhook returned ${r.status}`
      })
      .catch(e => {
        p.innerText = `Webhook threw: ${e.toString()}`
      })
  } else {
    p.innerText = "In development, not reporting"
  }

  console.error(exc.toString())
}

window.onerror = (e) => crash(e)
window.onunhandledrejection = (e) => {crash(e.reason)}


