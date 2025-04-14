(function() {
  /* Options
  iframe: {
  }
  */
  
  let BASE = '';
  const iframes = [];
  function initIFrameElem(opt, slideshow) {
    let idx = 0;
    for(const container of document.getElementsByClassName('remark-slide-container')) {
      for(const iframe of container.getElementsByTagName('iframe')) {
        iframes.push([idx, iframe.src, iframe, false]);
        iframe.src = ' ';
      }
      idx++;
    }
  }
  
  function initIFrameJS(opt, slideshow) {
    slideshow.on('showSlide', _update);
    let curr = slideshow.getCurrentSlideIndex();
    let ctmx = slideshow.getSlideCount();
    if(curr > ctmx) { curr = ctmx; slideshow.gotoSlide(curr); }
    if(curr <= 0)   { curr = 1;    slideshow.gotoSlide(curr); }
    _update(slideshow.getSlides()[curr]);
    
    window.addEventListener('beforeprint', function(e) {
      for(const iframe of iframes) {
        if(iframe[3] === false) {
          iframe[2].src = iframe[1];
          iframe[3] = true;
        }
      }
    });
  }
    function _update(slide) {
      let idx = slide.getSlideIndex();
      for(const iframe of iframes) {
        if(iframe[3] === false && iframe[0] === idx) {
          iframe[2].src = iframe[1];
          iframe[3] = true;
        }
      }
    }
  
  function initIFrameCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = BASE+'plugins/iframe/style.css';
    link.rel  = 'stylesheet';
    link.type = 'text/css'; 
    document.head.appendChild(link);
  }
  
  function init(opt, slideshow) {
    if (opt && opt.base) {
      BASE = opt.base;
      if (BASE[BASE.length-1] != '/') {
        BASE = BASE + '/';
      }
    }
    initIFrameElem(opt, slideshow);
    initIFrameJS(opt, slideshow);
    initIFrameCSS(opt, slideshow);
  }
  
  remark.register(init);
})();