const elementAttrs = {
  TEXTAREA: "value",
  INPUT: "value",

  default: "innerText",
}

const setSlots = (el, data) => {
  el.querySelectorAll('[slot]').forEach(e => {
    const attr = elementAttrs[e.tagName] || elementAttrs.default
    const value = data[e.slot]
    if (value) {e[attr] = value}
  })
}

const getSlots = (el) => {
  const data = {}
  el.querySelectorAll('[slot]').forEach(e => {
    data[e.slot] = e[elementAttrs[e.tagName] || elementAttrs.default]
  })
  return data
}

const template = (name, data) => {
  const el = document.querySelector(`[data-tmpl="${name}"]`).cloneNode(true)
  el.removeAttribute("data-tmpl")

  if (data) setSlots(el, data)

  return el
}
