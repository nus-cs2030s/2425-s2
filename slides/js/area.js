function initTextArea() {
  function stop(e) {
    e.stopPropagation();
  }
  for(const area of document.getElementsByTagName('textarea')) {
    area.addEventListener('keydown', stop);
    area.addEventListener('keypress', stop);
    area.addEventListener('keyup', stop);
  }
  for(const area of document.getElementsByTagName('input')) {
    area.addEventListener('keydown', stop);
    area.addEventListener('keypress', stop);
    area.addEventListener('keyup', stop);
  }
  for(const area of document.getElementsByClassName('ace_text-input')) {
    area.addEventListener('keydown', stop);
    area.addEventListener('keypress', stop);
    area.addEventListener('keyup', stop);
  }
  for(const area of document.getElementsByClassName('ace_editor')) {
    area.addEventListener('keydown', stop);
    area.addEventListener('keypress', stop);
    area.addEventListener('keyup', stop);
  }
}