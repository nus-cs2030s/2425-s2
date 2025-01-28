(function() {
  /* Options
  itools: {
    
  }
  */
  let BASE = '';
  const CLOSED = 0;
  const OPENED  = 1;
  let area;
  let button;
  let content;
  let state = CLOSED;
  let num = 0;
  const BTN  = [];
  const CONT = [];
  
    /* Helper */
    function load(lib, next) {
      // console.log('loading', lib);
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = lib;
      script.onreadystatechange = next;
      script.onload = next;
      document.head.appendChild(script);
    }
    function $qna(mod,topic,size=100) {
      const ifrm = document.createElement('iframe');
      ifrm.src = `https://sets.netlify.app/module/${mod}/topic/${topic}`;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
    function $replit(user,hash,size=100) {
      const ifrm = document.createElement('iframe');
      ifrm.src = `https://replit.com/@${user}/${hash}?lite=true`;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
    function $replit_embed(user,hash,size=100) {
      const ifrm = document.createElement('iframe');
      ifrm.src = `https://replit.com/@${user}/${hash}?embed=true`;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
    function $pyodide(id,size=100) {
      const ifrm = document.createElement('iframe');
      ifrm.src = `https://pyodide.org/en/stable/console.html`;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
    function $dbfiddle(sub='',size=100) {
      const ifrm = document.createElement('iframe');
      ifrm.src = `https://www.db-fiddle.com/${sub}`;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
    function $dbfduk(sub='',size=100) {
      if(sub !== '') {
        sub = '&fiddle=' + sub;
      }
      const ifrm = document.createElement('iframe');
      ifrm.src = `https://dbfiddle.uk/?rdbms=postgres_13`;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
    function $lnk(lnk,size=100) {
      const ifrm = document.createElement('iframe');
      ifrm.src = lnk;
      ifrm.className = `remark-itools-elem iframe-${size}`;
      ifrm.frameborder = '0';
      return ifrm;
    }
  
  function initIToolsElem(opt, slideshow) {
    area = document.createElement('div');
    area.className = 'remark-itools-area remark-itools-hidden';
    
    button = document.createElement('div');
    button.className = 'remark-itools-btn';
    area.appendChild(button);
    
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-toolbox';
    button.appendChild(icon);
    
    content = document.createElement('div');
    content.className = 'remark-itools-content'
    area.appendChild(content);
    document.getElementsByTagName('body')[0].appendChild(area);
    
    slideshow.itools = {
      'add': iToolsAdd,
      'tool': {
        'replit'  : $replit,
        'qna'     : $qna,
        'pyodide' : $pyodide,
        'dbfiddle': $dbfiddle,
        'dbfduk'  : $dbfduk,
        'lnk'     : $lnk,
      }
    };
    
    for(const cont of CONT) {
      iToolsAdd(cont[0], cont[1], cont[2]);
    }
  }
      function iToolsAdd(icon, name, html) {
        num++;
        const tab = document.createElement('div');
        tab.className = 'remark-itools-content-tab';
        
        const btn = document.createElement('input');
        btn.type = 'radio';
        btn.id = 'tab-' + num;
        btn.className = 'remark-itools-content-tab-btn';
        tab.appendChild(btn);
        
        const lbl = document.createElement('label');
        lbl.for = 'tab-' + num;
        lbl.className = 'remark-itools-content-tab-lbl';
          const icn = document.createElement('i');
          icn.className = `fa-solid fa-${icon}`;
          const nme = document.createTextNode('  ' + name);
          const rld = document.createElement('span');
          rld.className = 'remark-itools-reload';
          rld.innerHTML = '<i class="fa-solid fa-repeat"></i>'
          rld.addEventListener('click', function(e) {
            html.src = html.src;
          }, false);
        lbl.appendChild(icn);
        lbl.appendChild(nme);
        lbl.appendChild(rld);
        tab.appendChild(lbl);
        
        const txt = document.createElement('div');
        txt.className = 'remark-itools-content-tab-txt';
        txt.appendChild(html);
        tab.appendChild(txt);
        
        content.appendChild(tab);
        if(num === 1) { btn.checked = true; }
        BTN.push([btn,lbl]);
        lbl.addEventListener('click', function(e) {
          let found = 0;
          for(const _btn of BTN) {
            if(e.target === _btn[1]) {
              found++;
            }
          }
          if(found > 0) {
            for(const _btn of BTN) {
              if(e.target === _btn[1]) {
                _btn[0].checked = true;
              } else {
                _btn[0].checked = false;
              }
            }
          }
        });
      }
  
  function initIToolsJS(opt, slideshow) {
    button.addEventListener('click', function(e) {
      if(state === CLOSED) {
        area.classList.add('remark-itools-showing');
        area.classList.remove('remark-itools-hidden');
        area.classList.remove('remark-itools-hiding');
        area.classList.add('remark-itools-shown');
      } else {
        area.classList.add('remark-itools-hiding');
        area.classList.remove('remark-itools-shown');
        area.classList.remove('remark-itools-showing');
        area.classList.add('remark-itools-hidden');
      }
      state = 1 - state;
    });
    
    document.getElementsByClassName('remark-slides-area')[0].addEventListener('click', function(e) {
      if(state === OPENED) {
        area.classList.add('remark-itools-hiding');
        area.classList.remove('remark-itools-shown');
        area.classList.remove('remark-itools-showing');
        area.classList.add('remark-itools-hidden');
        state = CLOSED;
      }
    });
  }
  
  function initIToolsCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = BASE+'plugins/itools/style.css';
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
    initIToolsElem(opt, slideshow);
    initIToolsJS(opt, slideshow);
    initIToolsCSS(opt, slideshow);
  }
  
    function iToolsPush(icon, name, html) {
      CONT.push([icon, name, html]);
    }
    window.$itools = {
      'push': iToolsPush,
      'tool': {
        'replit'  : $replit,
        'embed'   : $replit_embed,
        'qna'     : $qna,
        'pyodide' : $pyodide,
        'dbfiddle': $dbfiddle,
        'dbfduk'  : $dbfduk,
        'lnk'     : $lnk,
      }
    };
  remark.register(init);
})();