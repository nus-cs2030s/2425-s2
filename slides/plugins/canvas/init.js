(function() {
  /* Options
  canvas: {
    size: 'small' (16px) / 'medium' (20px) / 'large' (24px) (default: 'medium')
    layout: 'vertical' / 'horizontal' (default: 'vertical')
  }
  */
  let BASE = '';
  const BTN = [
    /* Canvas  */
    {'color': '#111'   , 'icon': 'square-pen' , 'class': 'remark-canvas-button-btn'},
    
    {'color': '#111'   , 'icon': 'ellipsis-vertical', 'class': 'remark-canvas-button-sep'},
    
    /* Control */
    {'color': '#111'   , 'icon': 'pencil'     , 'class': 'remark-canvas-button-pen remark-canvas-button-off'},
    {'color': '#111'   , 'icon': 'highlighter', 'class': 'remark-canvas-button-pen remark-canvas-button-off'},
    {'color': '#111'   , 'icon': 'eraser'     , 'class': 'remark-canvas-button-pen remark-canvas-button-off'},
    {'color': '#111'   , 'icon': 'pen-fancy'  , 'class': 'remark-canvas-button-pen remark-canvas-button-off'},
    
    {'color': '#111'   , 'icon': 'ellipsis-vertical', 'class': 'remark-canvas-button-sep'},
    
    /* Colours */
    {'color': '#111'   , 'icon': 'square'     , 'class': 'remark-canvas-button-clr remark-canvas-button-off'},
    {'color': '#FE2712', 'icon': 'square'     , 'class': 'remark-canvas-button-clr remark-canvas-button-off'},
    {'color': '#559E54', 'icon': 'square'     , 'class': 'remark-canvas-button-clr remark-canvas-button-off'},
    {'color': '#0247FE', 'icon': 'square'     , 'class': 'remark-canvas-button-clr remark-canvas-button-off'},
    {'color': '#FEFE33', 'icon': 'square'     , 'class': 'remark-canvas-button-clr remark-canvas-button-off'},
    
    {'color': '#111'   , 'icon': 'ellipsis-vertical', 'class': 'remark-canvas-button-sep'},
    
    /* Trash   */
    {'color': '#111'   , 'icon': 'trash-can'  , 'class': 'remark-canvas-button-trs remark-canvas-button-off'},
    
  ];
  const SIZE = {
    'small' : 'remark-canvas-button-small' ,
    'medium': 'remark-canvas-button-medium',
    'large' : 'remark-canvas-button-large' ,
  };
  const WIDTH = [1, 16  , 31, 0];
  const OPAQS = [1, 0.03, 1 , 0];
  
  let shown = 0;
  
  /* Initialise Canvas Element */
  function initCanvasElem(containers, opt, slideshow) {
    let canvasContainers = [];
    // Initialise Canvas per Slide
    for(const container of containers) {
      let canvasContainer = document.createElement('div');
      canvasContainer.className = 'remark-slide-canvas-container';
      let canvas = document.createElement('canvas');
      canvas.className = 'remark-slide-canvas';
      canvasContainer.appendChild(canvas);
      container.appendChild(canvasContainer);
      canvasContainers.push(canvasContainer);
    }
    
    return canvasContainers;
  }
  
  /* Initialise Canvas Buttons */
  function initCanvasButtons(containers, opt, slideshow) {
    let size = opt && opt.canvas && (opt.canvas.size ?? 'medium');
    if(!SIZE.hasOwnProperty(size)) {
      size = 'medium';
    }
    const layout = opt && opt.canvas && (opt.canvas.layout ?? 'vertical');
    if(layout !== 'vertical' && layout !== 'horizontal') {
      layout = 'vertical';
    }
    const buttons = document.createElement('div');
    buttons.className = 'remark-canvas-button';
    for(const button of BTN) {
      const span = document.createElement('span');
      span.className = SIZE[size] + ' ' + button.class + ' remark-canvas-button-button';
      span.style.color = button.color;
      const icon = document.createElement('i');
      icon.className = `fa-solid fa-${button.icon}`;
      span.appendChild(icon);
      buttons.appendChild(span);
      if(layout === 'vertical') {
        buttons.appendChild(document.createElement('br'));
      }
    }
    document.getElementsByTagName('body')[0].appendChild(buttons);
  }
  
  /* Initialise Canvas Actions */
  function initCanvasAction(canvasContainers, opt, slideshow) {
    const STATE = ['source-over', 'multiply', 'destination-out'];
    const L_BTN = 1;
    const R_BTN = 2;
    let pen_color = '#111';
    let pen_width = 1;
    let pen_opacy = 1;
    let color = 0;
    let state = 0;
    let $func = [];
    let $ptxs = [];
    
    /* Helper Function */
    function initCanvas(ctn, btn, scl, clrs, cont) {
      /* STATE */
      let cvs = ctn.getElementsByTagName('canvas')[0];
      var is_down = false;
      
      let ctx = cvs.getContext('2d');
      cvs.style.cursor = 'url('+BASE+'"plugins/canvas/resc/pencil.png") 0 24,crosshair';
      
      cvs.width  = parseInt(scl.style.width );
      cvs.height = parseInt(scl.style.height);
      
      function get_ptx(e) {
        let scale = scl.style.transform;
        scale = parseFloat(scale.slice(scale.indexOf('(')+1,-1));
        
        let lOff = parseFloat(scl.style.left);
        let tOff = parseFloat(scl.style.top );
        
        let ptX = (e.pageX-lOff) / scale;
        let ptY = (e.pageY-tOff) / scale;
        return [ptX, ptY];
      }
      
      function pointer(c) {
        switch(c ?? state) {
          case 0:
            cvs.style.cursor = 'url('+BASE+'"plugins/canvas/resc/pencil.png") 0 24,crosshair';
            break;
          case 1:
            cvs.style.cursor = 'url('+BASE+'"plugins/canvas/resc/hiliter.png") 0 24,crosshair';
            break;
          case 2:
            cvs.style.cursor = 'url('+BASE+'"plugins/canvas/resc/eraser.png") 0 24,crosshair';
            break;
          case 3:
            cvs.style.cursor = 'url('+BASE+'"plugins/canvas/resc/laser.png") 16 16,crosshair';
            break;
        }
      }
      $ptxs.push(pointer);
      
      function _d(e) {
        is_down = true;
        e.stopPropagation();
        e.preventDefault();
        if(e.buttons === L_BTN) {
          ctx.globalCompositeOperation = STATE[state];
          ctx.lineWidth = pen_width;
          ctx.strokeStyle = colour(pen_color, pen_opacy);
          pointer();
        }
        if(e.buttons === R_BTN) {
          ctx.globalCompositeOperation = STATE[2];
          ctx.lineWidth = 31;
          ctx.strokeStyle = colour(pen_color, 1);
          pointer(2);
        }
        ctx.beginPath();
        let pt = get_ptx(e);
        let ptX = pt[0];
        let ptY = pt[1];
        ctx.moveTo(ptX, ptY);
      }
      function _m(e) {
        if(is_down) {
          e.stopPropagation();
          e.preventDefault();
          let pt = get_ptx(e);
          let ptX = pt[0];
          let ptY = pt[1];
          ctx.lineTo(ptX, ptY);
          ctx.stroke();
        }
      }
      function _u(e) {
        if(is_down) {
          ctx.closePath();
          e.stopPropagation();
          e.preventDefault();
          pointer();
        }
        is_down=false;
      }
      function pd(e) {
        e.stopPropagation();
        e.preventDefault();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          buttons: L_BTN
        });
        cvs.dispatchEvent(mouseEvent);
      }
      function pm(e) {
        e.stopPropagation();
        e.preventDefault();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          buttons: L_BTN
        });
        cvs.dispatchEvent(mouseEvent);
      }
      function pu(e) {
        e.stopPropagation();
        e.preventDefault();
        var mouseEvent = new MouseEvent("mouseup", {});
        cvs.dispatchEvent(mouseEvent);
      }
      
      cvs.addEventListener('mousedown', _d, false);
      cvs.addEventListener('mousemove', _m, false);
      cvs.addEventListener('mouseup', _u, false);
      cvs.addEventListener('touchstart', pd, false);
      cvs.addEventListener('touchmove', pm, false);
      cvs.addEventListener('touchend', pu, false);
      
      
      cvs.onpointercancel = function(e) {
        e.stopPropagation();
        e.preventDefault();
      }
      cvs.oncontextmenu = function(e) {
        e.stopPropagation();
        e.preventDefault();
      }
      
      let png_img = document.createElement('div');
      png_img.className = "canvas-png-image";
      ctn.parentNode.insertBefore(png_img,ctn);
      
      function $show(e) {
        if (shown == 1) {
          let png = cvs.toDataURL("image/png");
          let img = document.createElement('img');
          img.src = png;
          img.className = "canvas-image";
          png_img.appendChild(img)
          ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
        cvs.classList.toggle('canvas-show');
        ctn.classList.toggle('container-show');
      }
      $func.push($show);
      btn.addEventListener('click', $show);
      
      function clr(e) {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        png_img.innerHTML = "";
      }
      
      return clr;
    }
    
    function colour(clr, trans) {
      let clrs = clr.slice(clr.indexOf('(')+1,-1).split(', ');
      let res = `rgba(${clrs[0]}, ${clrs[1]}, ${clrs[2]}, ${trans})`;
      return res;
    }
    
    /* Initialisation */
    let ctn = canvasContainers;
    let slr = document.getElementsByClassName('remark-canvas-button-slr');
    let btn = document.getElementsByClassName('remark-canvas-button-btn');
    let clr = document.getElementsByClassName('remark-canvas-button-clr');
    let pen = document.getElementsByClassName('remark-canvas-button-pen');
    let trs = document.getElementsByClassName('remark-canvas-button-trs');
    let scl = document.getElementsByClassName('remark-slide-scaler');
    let act = {};
    let ers = []
    for(let i=0; i<ctn.length; i++) {
      ers.push(initCanvas(ctn[i], btn[0], scl[i], clr));
    }
    
    trs[0].addEventListener('click', function(e) {
      ers[slideshow.getCurrentSlideIndex()]();
    });
    function $toggle(e) {
      btn[0].classList.toggle('remark-canvas-button-on');
      for(let i=0; i<clr.length; i++) {
        clr[i].classList.toggle('remark-canvas-button-btn');
        clr[i].classList.toggle('remark-canvas-button-off');
        if(i === color) {
          clr[i].classList.toggle('remark-canvas-button-on');
        }
      }
      for(let i=0; i<pen.length; i++) {
        pen[i].classList.toggle('remark-canvas-button-btn');
        pen[i].classList.toggle('remark-canvas-button-off');
        if(i === state) {
          pen[i].classList.toggle('remark-canvas-button-on');
        }
      }
      trs[0].classList.toggle('remark-canvas-button-on');
      trs[0].classList.toggle('remark-canvas-button-off');
      shown = 1 - shown;
    }
    btn[0].addEventListener('click', $toggle);
    for(let i=0; i<clr.length; i++) {
      clr[i].onclick = function(e) {
        if(shown === 1) {
          pen_color = clr[i].style.color;
          clr[color].classList.toggle('remark-canvas-button-on');
          clr[i].classList.toggle('remark-canvas-button-on');
          color = i;
        }
      };
      act[i+1] = clr[i].onclick;
    }
    pen_color = clr[0].style.color;
    for(let i=0; i<pen.length; i++) {
      pen[i].onclick = function(e) {
        if(shown === 1) {
          pen_width = WIDTH[i];
          pen_opacy = OPAQS[i];
          pen[state].classList.toggle('remark-canvas-button-on');
          pen[i].classList.toggle('remark-canvas-button-on');
          state = i;
          for(const $ptx of $ptxs) {
            $ptx();
          }
        }
      };
    }
    
    act['q'] = function() {
      $toggle();
      for(const $f of $func) {
        $f();
      }
    };
    return act;
  }
  
  function initCanvasEvent(action, canvasContainers, opt, slideshow) {
    window.addEventListener('keypress', function(e) {
      if(shown === 1) {
        if(action.hasOwnProperty(e.key)) {
          action[e.key]();
        }
        e.stopPropagation();
      } else {
        if(action.hasOwnProperty(e.key)) {
          action[e.key]();
        }
      }
    });
  }
  
  function initCanvasCSS(opt, slideshow) {
    let head = document.getElementsByTagName('head')[0];
    let link  = document.createElement('link');
    link.href = BASE+'plugins/canvas/style.css';
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
    let containers = document.getElementsByClassName('remark-slide-scaler');
    if(containers.length === 0) return;
    
    let canvasContainers = initCanvasElem(containers, opt, slideshow);
    initCanvasButtons(containers, opt, slideshow);
    let action = initCanvasAction(canvasContainers, opt, slideshow);
    initCanvasEvent(action, canvasContainers, opt, slideshow);
    initCanvasCSS(opt, slideshow);
  }
  
  remark.register(init);
})();