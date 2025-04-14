(function() {
  /* Options
  tooltip: {
    position : 'top' / 'left' / 'bottom' / 'right' (default: 'top')
    size     : 'small' / 'medium' / 'large' / 'fit' (default: 'large')
    separator: <string> (default: '|')
    underline: true / false (default: true)
  }
  */
  let BASE = '';
  const POS  = ['top', 'left', 'bottom', 'right'];
  const SIZE = ['small', 'medium', 'large', 'fit'];
  function initTooltipJS(opt, slideshow) {
    let sep = opt && opt.tooltip && opt.tooltip.sep;
    if(typeof(sep) !== 'string' || sep === '') {
      sep = '|';
    }
    let uline = opt && opt.tooltip && opt.tooltip.underline;
    if(typeof(uline) !== 'boolean' && uline !== 'true' && uline !== 'false') {
      uline = true;
    }
    
    let size = opt && opt.tooltip && (opt.tooltip.size ?? 'large');
    if(SIZE.indexOf(size) < 0) {
      size = 'large';
    }
    let pos = opt && opt.tooltip && (opt.tooltip.position ?? 'top');
    if(POS.indexOf(pos) < 0) {
      pos = 'top';
    }
    
    initTooltipElem(document.getElementsByClassName('tooltip'), sep, size, pos, uline);
    
    for(const _pos of POS) {
      initTooltipElem(document.getElementsByClassName(`tooltip_${_pos}`), sep, size, _pos, uline);
      initTooltipElem(document.getElementsByClassName(`tooltip_${_pos}_noline`), sep, size, _pos, false);
    }
    for(const _size of SIZE) {
      initTooltipElem(document.getElementsByClassName(`tooltip_${_size}`), sep, _size, pos, uline);
      initTooltipElem(document.getElementsByClassName(`tooltip_${_size}_noline`), sep, _size, pos, false);
    }
    for(const _pos of POS) {
      for(const _size of SIZE) {
        initTooltipElem(document.getElementsByClassName(`tooltip_${_pos}_${_size}`), sep, _size, _pos, uline);
        initTooltipElem(document.getElementsByClassName(`tooltip_${_size}_${_pos}`), sep, _size, _pos, uline);
        initTooltipElem(document.getElementsByClassName(`tooltip_${_pos}_${_size}_noline`), sep, _size, _pos, false);
        initTooltipElem(document.getElementsByClassName(`tooltip_${_size}_${_pos}_noline`), sep, _size, _pos, false);
      }
    }
  }
    /* Common Tooltip */
    function initTooltipElem(ttips, sep, size, pos, uline) {
      const temps = [];
      for(const ttip of ttips) { temps.push(ttip); }
      for(const ttip of temps) {
        let tips = ttip.innerHTML.split(sep);
        if(tips.length > 1) {
          if(uline) {
            ttip.innerHTML = `<span data-cooltipz-dir="${pos}" data-cooltipz-size="${size}" aria-label="${tips[1]}" class="tooltip_">${tips[0]}</span>`;
          } else {
            ttip.innerHTML = `<span data-cooltipz-dir="${pos}" data-cooltipz-size="${size}" aria-label="${tips[1]}" class="tooltip">${tips[0]}</span>`;
          }
        }
      }
    }
  
  function initTooltipCSS(opt, slideshow) {
    let head = document.getElementsByTagName('head')[0];
    let link  = document.createElement('link');
    link.href = BASE+'plugins/tooltip/cooltipz.css';
    link.rel  = 'stylesheet';
    link.type = 'text/css'; 
    head.appendChild(link);
  }
  
  function init(opt, slideshow) {
    if (opt && opt.base) {
      BASE = opt.base;
      if (BASE[BASE.length-1] != '/') {
        BASE = BASE + '/';
      }
    }
    initTooltipJS(opt, slideshow);
    initTooltipCSS(opt, slideshow);
  }
  
  remark.register(init);
})();