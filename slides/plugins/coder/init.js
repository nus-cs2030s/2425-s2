(function() {
  /* Options
  coder: {
  }
  */
  // const META = '>>> ';
  let BASE = '';
  const BLANK = [['ㅤ',''],
                 ['ㅤ',''], // Hangul Filler Character (Unicode U+3164, HTML &#12644)
                 ['‎',''],  // ??
                 ['​',''],  // &#32;
                 ['​ ',''], // &#160;  (&nbsp;)
                 [' ',''], // &#8194; (&ensp;)
                 [' ',''], // &#8195; (&emsp;)
                 [' ',''], // &#8196; (&emsp13;)
                 [' ',''], // &#8197; (&emsp14;)
                 [' ',''], // &#8198;
                 [' ',''], // &#8199; (&numsp;)
                 [' ',''], // &#8200; (&puncsp;)
                 [' ',''], // &#8201; (&thinsp;)
                 [' ',''], // &#8202; (&hairsp;)
                 [' ',''], // &#8239;
                 [' ',''], // &#8287; (MediumSpace)
                 ['　',''], // &#12288;
                 ];
  /* Helper Functions */
  function codes_processClassList(classList) {
    const res = {};
    for(let i=0; i<classList.length; i++) {
      if(classList[i].indexOf('[')>=0) {
        const clss  = classList[i].slice(0,classList[i].indexOf('['));
        const props = classList[i].slice(classList[i].indexOf('[')+1,-1);
        
        classList.remove(classList[i]);
        classList.add(clss);
        
        for(const prop of props.split('|')) {
          const dct = prop.split('=');
          res[dct[0]] = dct[1];
        }
      }
    }
    return res;
  }
  function codes_processNames(code,vals,opt,slideshow) {
    // Preprocess
    vals = vals.split(';');
    const name = vals[0];
    const pre  = vals[1] ?? '';
    
    // Process
    const hdiv = document.createElement('div');
    hdiv.className = 'remark-code-header'
    const ndiv = document.createElement('div');
    ndiv.innerHTML = `<p class="remark-code-title"><i class="fa-solid fa-file-code"></i>&nbsp;<samp>${name}</samp></p>`;
    hdiv.append(ndiv);
    
    // Events
    let res = '';
    for(const child of code.childNodes) {
      res += pres[pre](child,opt);
    }
    ndiv.onclick = function() {
      var el = document.createElement('a');
      el.setAttribute('href',  'data:text/plain;charset=utf-8,'
      + encodeURIComponent(res));
      el.setAttribute('download', name);

      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    };
    
    // Finalise
    code.parentElement.prepend(hdiv);
    return 1;
  }
              function codes_hasMeta(code) {
                if(code && code.childNodes[0] && code.childNodes[0].classList) {
                  return code.childNodes[0].classList.contains('hljs-meta');
                } else {
                  return false;
                }
              }
              function codes_replaceBlank(txt) {
                for(const blank of BLANK) {
                  txt = txt.replaceAll(blank[0],blank[1]);
                }
                return txt;
              }
          function codes_processCodes_cmnt(clone) {
            for(const cmnt of clone.getElementsByClassName('hljs-comment')) {
              cmnt.innerHTML = '';
            }
            return clone;
          }
          function codes_processCodes_meta(clone) {
            for(const meta of clone.getElementsByClassName('hljs-meta')) {
              meta.innerHTML = '';
            }
            return clone;
          }
          function codes_processCodes_outp(clone) {
            for(const outp of clone.getElementsByClassName('hljs-output')) {
              outp.innerHTML = '';
            }
            return clone;
          }
          function codes_processCodes_errs(clone) {
            for(const errs of clone.getElementsByClassName('hljs-error')) {
              errs.innerHTML = '';
            }
            return clone;
          }
      function codes_processNames_print(code,opt) {
        let clone = code.cloneNode(true);
        if(codes_hasMeta(code)) {
          clone = codes_processCodes_meta(clone);
          clone = codes_processCodes_cmnt(clone);
          let txt = codes_replaceBlank(clone.textContent);
          return `print(${txt.trimEnd()})\r\n`;
        } else {
          return '';
        }
      }
      function codes_processNames_shell(code,opt) {
        let clone = code.cloneNode(true);
        if(codes_hasMeta(code)) {
          clone = codes_processCodes_meta(clone);
          clone = codes_processCodes_cmnt(clone);
          let txt = codes_replaceBlank(clone.textContent);
          return `${txt.trimEnd()}\r\n`;
        } else {
          return '';
        }
      }
      function codes_processNames_codes(code,opt) {
        let clone = code.cloneNode(true);
        if(codes_hasMeta(code)) {
          clone = codes_processCodes_meta(clone);
        }
        clone = codes_processCodes_outp(clone);
        let txt = codes_replaceBlank(clone.textContent);
        return `${txt.trimEnd()}\r\n`;
      }
      function codes_processNames_id(code,opt) {
        let clone = code.cloneNode(true);
        if(codes_hasMeta(code)) {
          clone = codes_processCodes_meta(clone);
        }
        let txt = codes_replaceBlank(clone.textContent);
        return `${txt.trimEnd()}\r\n`;
      }
      function codes_processNames_nones(code,opt) {
        return '';
      }
  function codes_processSteps(code,vals,kind,opt,slideshow) {
    try {
      // Preprocess
      vals = vals.split(';');
      const line = [];
      for(const lines of vals) {
        line.push(codes_processSteps_getLine(lines,opt));
      }
      const codes = [];
      const process = stepper[kind]
      for(const lns of line) {
        codes.push(process(code,lns,opt));
      }
      codes.push(code.cloneNode(true));
      const cmnts = codes_processSteps_uncomment(codes,opt);
      const shadow = [cmnts,codes];

      let curr = 0;
      let cmnt = 0;
      let last = shadow[0].length-1;
    
      // Process
      const sdiv = document.createElement('div');
      sdiv.className = 'remark-code-footer'
        const fdiv = document.createElement('span');
        fdiv.innerHTML = '<i class="fa-solid fa-backward-fast"></i>';
        fdiv.className = 'remark-code-footer-btn remark-code-btn-active';
        const bdiv = document.createElement('span');
        bdiv.innerHTML = '<i class="fa-solid fa-backward-step"></i>';
        function bdiv_className() {
          if(curr === 0) {
            bdiv.className = 'remark-code-footer-btn remark-code-btn-passive';
          } else {
            bdiv.className = 'remark-code-footer-btn remark-code-btn-active';
          }
        } bdiv_className();
        const ndiv = document.createElement('span');
        ndiv.innerHTML = '<i class="fa-solid fa-forward-step"></i>';
        function ndiv_className() {
          if(curr === last) {
            ndiv.className = 'remark-code-footer-btn remark-code-btn-passive';
          } else {
            ndiv.className = 'remark-code-footer-btn remark-code-btn-active';
          }
        } ndiv_className();
        const ldiv = document.createElement('span');
        ldiv.innerHTML = '<i class="fa-solid fa-forward-fast"></i>';
        ldiv.className = 'remark-code-footer-btn remark-code-btn-active';
        const cdiv = document.createElement('span');
        cdiv.innerHTML = '<i class="fa-solid fa-comment"></i>';
        cdiv.className = 'remark-code-footer-btn remark-code-btn-active';
        sdiv.appendChild(fdiv);
        sdiv.appendChild(bdiv);
        sdiv.appendChild(ndiv);
        sdiv.appendChild(ldiv);
        sdiv.appendChild(cdiv);

      // Events
      fdiv.onclick = function(e) {
        curr = 0;
        code.innerHTML = shadow[cmnt][curr].innerHTML;
        bdiv_className();
        ndiv_className();
      };
      bdiv.onclick = function(e) {
        if(curr === 0) { return; }
        if(curr === last) { curr = last; }
        curr--;
        code.innerHTML = shadow[cmnt][curr].innerHTML;
        bdiv_className();
        ndiv_className();
      };
      ndiv.onclick = function(e) {
        if(curr === last) { return; }
        curr++;
        code.innerHTML = shadow[cmnt][curr].innerHTML;
        bdiv_className();
        ndiv_className();
      };
      ldiv.onclick = function(e) {
        curr = last;
        code.innerHTML = shadow[cmnt][curr].innerHTML;
        bdiv_className();
        ndiv_className();
      };
      cdiv.onclick = function(e) {
        cmnt = shadow.length-1-cmnt;
        code.innerHTML = shadow[cmnt][curr].innerHTML;
        if(cmnt === 0) {
          cdiv.innerHTML = '<i class="fa-solid fa-comment"></i>';
        } else {
          cdiv.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
        }
      };

      window.addEventListener('beforeprint', function(e) {
        code.innerHTML = shadow[shadow.length-1][last].innerHTML;
      });
      window.addEventListener('afterprint', function(e) {
        code.innerHTML = shadow[cmnt][curr].innerHTML;
      });

      // Finalise
      code.parentElement.append(sdiv);
      code.innerHTML = shadow[cmnt][curr].innerHTML;
      return 2;
    } catch(e) {console.error(e);}
  }
  function codes_processStep(code,vals,kind,opt,slideshow) {
    try {
      // Preprocess
      vals = vals.split(';');
      const line = [];
      for(const lines of vals) {
        line.push(codes_processSteps_getLine(lines,opt));
        break;
      }
      const codes = [];
      const process = stepper[kind]
      for(const lns of line) {
        codes.push(process(code,lns,opt));
      }
      codes.push(code.cloneNode(true));

      // Finalise
      code.innerHTML = codes[0].innerHTML;
      return 0;
    } catch(e) {console.error(e);}
  }
      function codes_processSteps_setLine(code,lns,opt) {
        const clone = code.cloneNode(true);
        for(let i=0; i<clone.childNodes.length; i++) {
          if(lns.indexOf(i) < 0) {
            clone.childNodes[i].classList.add("remark-code-hidden");
          }
        }
        return clone;
      }
      function codes_processEmphs_setLine(code,lns,opt) {
        const clone = code.cloneNode(true);
        for(let i=0; i<clone.childNodes.length; i++) {
          if(lns.indexOf(i) < 0) {
            clone.childNodes[i].classList.add("remark-code-unhighlighted");
          }
        }
        return clone;
      }
      function codes_processLites_setLine(code,lns,opt) {
        const clone = code.cloneNode(true);
        for(let i=0; i<clone.childNodes.length; i++) {
          if(lns.indexOf(i) >= 0) {
            clone.childNodes[i].classList.add("remark-code-hilite");
          }
        }
        return clone;
      }
      function codes_processShows_setLine(code,lns,opt) {
        const clone = code.cloneNode(true);
        for(let i=0; i<clone.childNodes.length; i++) {
          if(lns.indexOf(i) < 0) {
            clone.childNodes[i].classList.add("remark-code-dispnone");
          }
        }
        return clone;
      }
      function codes_processSteps_uncomment(codes,opt) {
        const cmnts = [];
        for(const code of codes) {
          const clone = code.cloneNode(true);
          for(const cmnt of clone.getElementsByClassName('hljs-comment')) {
            cmnt.classList.add("remark-code-hidden");
          }
          cmnts.push(clone);
        }
        return cmnts;
      }
      function codes_processSteps_getLine(lines,opt) {
        // Number is decremented by 1 to match index
        let line = [];
        for(const lns of lines.split(',')) {
          if(lns.indexOf('-') >= 0) {
            const rng = lns.split('-');
            const s = parseInt(rng[0]),
                  e = parseInt(rng[1]);
            if(e < s) { throw "range error"; }
            for(let i=s-1; i<e; i++) {
              line.push(i);
            }
          } else {
            line.push(parseInt(lns-1));
          }
        }
        return line;
      }
  function codes_processCopy(code,pre,kind,opt,slideshow) {
    // Process
    const cdiv = document.createElement('div');
    cdiv.className = 'remark-code-copy remark-code-btn-active';
    cdiv.innerHTML = '<i class="fa-solid fa-copy"></i>';
    
    // Events
    let res = '';
    for(const child of code.childNodes) {
      res += pres[pre](child,opt);
    }
    if(res !== '') {
      cdiv.onclick = function() {
        navigator.clipboard.writeText(res);
        cdiv.innerHTML = '<i class="fa-solid fa-copy" style="color:#006400"></i>';
        setTimeout(function() {
          cdiv.innerHTML = '<i class="fa-solid fa-copy"></i>';
        }, 1500)
      };

      // Finalise
      code.parentElement.prepend(cdiv);
    }
  }
  /* Dictionary of Processes */
  const proc  = {
    name : codes_processNames,
    steps: codes_processSteps,
    emphs: codes_processSteps,
    lites: codes_processSteps,
    step : codes_processStep,
    emph : codes_processStep,
    lite : codes_processStep,
    show : codes_processStep,
    copy : codes_processCopy,
  }
  const pres  = {
    print: codes_processNames_print,
    codes: codes_processNames_codes,
    shell: codes_processNames_shell,
    nones: codes_processNames_nones,
    '':    codes_processNames_id,
  }
  const stepper  = {
    steps: codes_processSteps_setLine,
    emphs: codes_processEmphs_setLine,
    lites: codes_processLites_setLine,
    step: codes_processSteps_setLine,
    emph: codes_processEmphs_setLine,
    lite: codes_processLites_setLine,
    show: codes_processShows_setLine,
    '':    codes_processNames_id,
  }
  const clsnm = ['remark-code-none','remark-code-headed','remark-code-footed','remark-code-both'];
  
  function initCoderJS(opt, slideshow) {
    const codes = document.getElementsByClassName('remark-code');
    const temps = [];
    for(const code of codes) { temps.push(code); }
    for(const code of temps) {
      const props = codes_processClassList(code.classList);
      let clsn = 0, copied = false;
      for(const key in props) {
        if(key === 'copy') { copied = true; }
        clsn = clsn | proc[key](code,props[key],key,opt,slideshow);
      }
      if(!copied) {
        codes_processCopy(code,'codes','',opt,slideshow);
      }
      code.classList.add(clsnm[clsn]);
    }
  }
  
  function initCoderCSS(opt, slideshow) {
    let head = document.getElementsByTagName('head')[0];
    let link  = document.createElement('link');
    link.href = BASE+'plugins/coder/style.css';
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
    initCoderJS(opt, slideshow);
    initCoderCSS(opt, slideshow);
  }
  
  remark.register(init);
})();