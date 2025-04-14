function initAhref() {
  function stop(e) {
    e.stopPropagation();
  }
  const hrefs = document.getElementsByTagName('a');
  let curr = window.location.href;
  curr = curr.slice(0,curr.indexOf('#'));
  for(const href of hrefs) {
    if (!href.href.startsWith(curr)) {
      href.target = '_blank';
    }
  }
}