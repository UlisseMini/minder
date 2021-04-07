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

function render(text, target) {
  console.log('render', text, target)
  const temp = h('p', {'id': target.id}, [text])

  let errors = []

  renderMathInElement(temp, {
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "$", right: "$", display: false},
      {left: "\\(", right: "\\)", display: false},
      {left: "\\[", right: "\\]", display: true}
    ],
    errorCallback: (msg) => {
      errors.push(msg)
    }
  })

  if (errors.length == 0) {
    target.replaceWith(temp)
    $('edit-errors').innerText = ''
  } else {
    $('edit-errors').innerText = errors.join('\n')
  }
}

function main() {
  $("editor").replaceWith(
    h('div', {'id': 'editor'}, [
      h('textarea', {'id': 'edit-textarea'}),
      h('p', {'style': 'color: red;', 'id': 'edit-errors'}),
      h('p', {'id': 'edit-target'}),
    ])
  )

  function oninput(e) {
    render(e.target.value, $('edit-target'))
  }

  $('edit-textarea').oninput = oninput

  $('edit-textarea').value = `Solve for x in $x^2 - 2x + 3 = 0$`
  oninput({
    target: $('edit-textarea')
  })
}

document.addEventListener('DOMContentLoaded', main)
