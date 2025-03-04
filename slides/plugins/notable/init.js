(function() {
  function initNotableElem(opt, slideshow) {
    for(const note of document.getElementsByClassName('notable')) {
      const h5 = note.getElementsByTagName('h5')[0];
      h5.classList.add('remark-notable-btn');
      const content = note.getElementsByClassName('content')[0];
      content.classList.add('remark-notable-hide');
      const txt = h5.innerHTML;
      
      let t = 1;
      h5.innerHTML = '&nbsp; [-]' + txt
      h5.onclick = function(e) {
        if (t == 0) { // close
          h5.innerHTML = '&nbsp; [-]' + txt
        } else {      // open
          h5.innerHTML = '&nbsp; [+]' + txt
        }
        t = 1 - t;
        content.classList.toggle('remark-notable-hide');
      }
    }
  }
  
  function initNotableJS(opt, slideshow) {
  }
  
  function initNotableCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = 'plugins/notable/style.css';
    link.rel  = 'stylesheet';
    link.type = 'text/css'; 
    document.head.appendChild(link);
  }
  
  function init(opt, slideshow) {
    initNotableElem(opt, slideshow);
    initNotableJS(opt, slideshow);
    initNotableCSS(opt, slideshow);
  }
  
  remark.register(init);
})();