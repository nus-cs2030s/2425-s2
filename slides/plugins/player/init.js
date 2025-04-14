(function() {
  /* Options
  player: {
    size  : 'small' (20px) / 'medium' (24px) / 'large' (28px) (default: 'large')
    layout: 'vertical' / 'horizontal' (default: 'vertical')
    time  : <number> (default: 15)
  }
  */
  let BASE = '';
  const BTN = [
    /* Slide   */
    {'color': '#111'   , 'icon': 'caret-left' , 'class': 'remark-player-button-btn remark-player-button-on remark-player-button-L'},
    //{'color': '#111'   , 'icon': 'circle-play', 'class': 'remark-player-button-btn remark-player-button-on'},
    {'color': '#111'   , 'icon': 'caret-right', 'class': 'remark-player-button-btn remark-player-button-on remark-player-button-R'},
    
  ];
  const SIZE = {
    'small' : 'remark-player-button-small' ,
    'medium': 'remark-player-button-medium',
    'large' : 'remark-player-button-large' ,
  };
  const BTNS = [];
  let LAST = 0;
  let TIME = 15;
  let INTV = null;
  
  function initPlayerElem(opt, slideshow) {
    let size = opt && opt.player && (opt.player.size ?? 'medium');
    if(!SIZE.hasOwnProperty(size)) {
      size = 'large';
    }
    let time = opt && opt.player && (opt.player.time ?? '15');
    try {
      time = parseInt(time);
    } catch(e) {
      time = 15;
    }
    if(isNaN(time)) {
      time = 15;
    }
    TIME = time*1000;
    
    const buttons = document.createElement('div');
    buttons.className = 'remark-player-button';
    
    for(const button of BTN) {
      const span = document.createElement('span');
      span.className = SIZE[size] + ' ' + button.class + ' remark-player-button-button';
      span.style.color = button.color;
      const icon = document.createElement('i');
      icon.className = `fa-solid fa-${button.icon}`;
      span.appendChild(icon);
      buttons.appendChild(span);
      BTNS.push(span);
    }
    document.getElementsByTagName('body')[0].appendChild(buttons);
    
    LAST = slideshow.getSlides().length-1;
  }
  
  function initPlayerJS(opt, slideshow) {
    BTNS[0].onclick = slideshow.gotoPreviousSlide;
    //BTNS[1].onclick = play_pause(slideshow);
    BTNS[1].onclick = slideshow.gotoNextSlide;
    slideshow.on('showSlide', _update);
    
    let curr = slideshow.getCurrentSlideIndex();
    let ctmx = slideshow.getSlideCount();
    if(curr > ctmx) { curr = ctmx; slideshow.gotoSlide(curr); }
    if(curr <= 0)   { curr = 1;    slideshow.gotoSlide(curr); }
    _update(slideshow.getSlides()[curr]);
  }
    function play_pause(slideshow) {
      return function() {
        if(INTV === null) {
          INTV = setInterval(slideshow.gotoNextSlide, TIME);
          BTNS[1].innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
        } else {
          clearInterval(INTV);
          INTV = null;
          BTNS[1].innerHTML = '<i class="fa-solid fa-circle-play"></i>';
        }
      }
    }
    function _update(slide) {
      const curr = slide.getSlideIndex();
      if(curr === 0) {
        BTNS[0].classList.remove('remark-player-button-btn');
        BTNS[0].classList.add('remark-player-button-off');
      } else {
        BTNS[0].classList.remove('remark-player-button-off');
        BTNS[0].classList.add('remark-player-button-btn');
      }
      if(curr === LAST) {
        BTNS[1].classList.remove('remark-player-button-btn');
        BTNS[1].classList.add('remark-player-button-off');
        if(INTV !== null) {
          play_pause();
        }
      } else {
        BTNS[1].classList.remove('remark-player-button-off');
        BTNS[1].classList.add('remark-player-button-btn');
      }
    }
  
  function initPlayerCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = BASE+'plugins/player/style.css';
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
    initPlayerElem(opt, slideshow);
    initPlayerJS(opt, slideshow);
    initPlayerCSS(opt, slideshow);
  }
  
  remark.register(init);
})();