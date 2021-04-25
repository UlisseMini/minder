const elementAttrs = {
  TEXTAREA: "value",
  INPUT: "value",

  default: "innerText",
}

const setSlots = (el, data) => {
  el.querySelectorAll('[slot]').forEach(e => {
    const attr = elementAttrs[e.tagName] || elementAttrs.default
    const keys = e.slot.split('.')
    let value = data
    keys.forEach(key => value = value[key])

    if (value !== undefined) {e[attr] = value}
  })
}

const getSlots = (el) => {
  const data = {}
  el.querySelectorAll('[slot]').forEach(e => {
    const attr = elementAttrs[e.tagName]
    if (!attr)
      throw `no attr for ${e.tagName} elements, remember innerText screws up whitespace`
    data[e.slot] = e[attr]
  })
  return data
}

const template = (name, data) => {
  const el = document.querySelector(`[data-tmpl="${name}"]`).cloneNode(true)
  el.removeAttribute("data-tmpl")

  if (data) setSlots(el, data)

  return el
}

const $ = (a, b) => b ? a.querySelector(b) : document.querySelector(a)
const $$ = (a, b) => b ? a.querySelectorAll(b) : document.querySelectorAll(a)

export {$, $$, setSlots, getSlots, template}
