(function() {
  /* Options
  quizzes: {
    poll: "lc" / "inline" (default: "inline")
    alt: true / false (default: false)
    hide: true / false (default: false)
  }
  */
  let BASE = '';
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let IS_LC = false;
  let IS_HIDE = false;
  
  /* Hash */
  function HASH(str) {
    str = str ?? '';
    var hash = 0;
    for (var i = 0; i<str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash;
    }
    return hash;
  }
  const PARAMS = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  let KEY = 0;
  let ALT = false;
  
  /* General Helper */
  let _num = 0;
  function fresh$(lbl) {
    _num++;
    return `${lbl}_${_num}`;
  }
  
  /* Correctness Helper */
  function QUIZ_N(alp,txt,hnt,btn,cmnt,exp,act) {
    let hash = HASH(PARAMS.k) ?? 0;
    if(hash !== KEY) { return; }
    alp.style.color = '#600';
    txt.style.color = '#600';
    hnt.style.color = '#600';
    btn.style.color = '#600';
    switch(typeof(cmnt)) {
      case 'string':
        hnt.innerHTML = cmnt;
        btn.innerHTML = '<i class="fa-solid fa-circle-xmark remark-quizzes-icon-N"></i>';
        break;
      case 'function':
        hnt.innerHTML = cmnt(exp,act);
        btn.innerHTML = '<i class="fa-solid fa-circle-xmark remark-quizzes-icon-N"></i>';
        break;
    }
    return 1;
  }
  function QUIZ_Y(alp,txt,hnt,btn,cmnt,exp,act) {
    let hash = HASH(PARAMS.k) ?? 0;
    if(hash !== KEY) { return; }
    alp.style.color = '#060';
    txt.style.color = '#060';
    hnt.style.color = '#060';
    btn.style.color = '#060';
    switch(typeof(cmnt)) {
      case 'string':
        hnt.innerHTML = cmnt;
        btn.innerHTML = '<i class="fa-solid fa-circle-check remark-quizzes-icon-Y"></i>';
        break;
      case 'function':
        hnt.innerHTML = cmnt(exp,act);
        btn.innerHTML = '<i class="fa-solid fa-circle-check remark-quizzes-icon-Y"></i>';
        break;
    }
    return 1;
  }
  function QUIZ_R(alp,txt,hnt,btn,cmnt) {
    let hash = HASH(PARAMS.k) ?? 0;
    if(hash !== KEY) { return; }
    btn.innerHTML = '<i class="fa-solid fa-circle-question remark-quizzes-icon-normal"></i>';
    alp.style.color = null;
    txt.style.color = null;
    hnt.style.color = null;
    btn.style.color = null;
    hnt.innerHTML = '';
    return 0;
  }
  
  /* Element Helper*/
  function QUIZ$POLL(poll, qrimg, _elems, kind) {
    if(poll && poll.length > 0) {
      if(qrimg && qrimg.length > 0) {
        const _qr = document.createElement('img');
        _qr.className = 'remark-quizzes-qr remark-quizzes-qr-sm';
        _qr.src = qrimg[0].innerHTML;
        _qr.width  = 150;
        _qr.height = 150;
        
        _qr.onclick = function(e) {
          _qr.classList.toggle('remark-quizzes-qr-lg');
          _qr.classList.toggle('remark-quizzes-qr-sm');
        }
        
        _elems.push(_qr);
      }
      
      const div = document.createElement('div');
      div.className = 'remark-quizzes-poll' + IS_LC;
        let poll_height = IS_LC === '-lc' ? 300 : 250;
        let poll_id     = poll[0].innerHTML;
        if(poll_id.indexOf('|') >= 0) {
          poll_id = poll_id.split('|');
          poll_height = poll_id[1];
          poll_id     = poll_id[0];
        }
        const _poll = document.createElement('iframe');
        _poll.className = 'remark-quizzes-poll-iframe' + (IS_HIDE ? '-hide' : '');
        _poll.src = `https://embed.polleverywhere.com/${kind}/${poll_id}?preview=true&controls=none`;
        _poll.width  = 250;
        _poll.height = poll_height;
        _poll.frameborder = 0;
        div.appendChild(_poll);
        
        const btn = document.createElement('span');
        btn.innerHTML = IS_HIDE ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-solid fa-eye"></i>';
        btn.className = 'remark-quizzes-poll-btn';
        div.appendChild(btn);
        
        let t = IS_HIDE ? 1 : 0;
        div.onclick = function(e) {
          if(t === 0) {
            btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
          } else {
            btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
          }
          t = 1-t;
          _poll.classList.toggle('remark-quizzes-poll-iframe-hide');
        }
      _elems.push(div);
    }
  }
  function QUIZ$TIME(time, _elems) {
    if(time && time.length > 0) {
      const _time = document.createElement('div');
      _time.className = 'remark-quizzes-timer remark-quizzes-done';
        const _timeLBL = document.createElement('span');
        _timeLBL.className = 'remark-quizzes-timer-label';
        _timeLBL.innerHTML = time[0].innerHTML;
        _time.appendChild(_timeLBL);
      _elems.push(_time);
      
      /* Events */
      let END  = 0;
      let IID  = null;
      let TMR  = _time;
      let LBL  = _timeLBL;
      let TIME = time[0].innerHTML;
      
      function $timeS() {
        if(IID === undefined) {
          IID = null;
          LBL.innerHTML = TIME;
          TMR.classList.remove('remark-quizzes-end')
          TMR.classList.add('remark-quizzes-done');
        } else if(IID === null) {
          END = TIME;
          IID = setInterval($timeC, 1000);
          TMR.classList.remove('remark-quizzes-done')
          TMR.classList.remove('remark-quizzes-end')
          TMR.classList.add('remark-quizzes-full');
        }
      }
      function $timeC() {
        END--;
        if(END >= 0) {
          if(END <= TIME/2) {
          TMR.classList.remove('remark-quizzes-full')
          TMR.classList.add('remark-quizzes-half');
          }
          if(END <= TIME/4) {
            TMR.classList.remove('remark-quizzes-half')
            TMR.classList.add('remark-quizzes-quarter');
          }
          LBL.innerHTML = END;
        } else {
          clearInterval(IID);
          //IID = null;
          IID = undefined;
          TMR.classList.remove('remark-quizzes-quarter')
          TMR.classList.add('remark-quizzes-end');
        }
      }
      LBL.onclick = $timeS;
    }
  }
  
  /* Helper */
  // TIME
  function TIME(elem) {
    try {
      let mrq = document.createElement('div');
      mrq.className = 'remark-quizzes-mrq' + IS_LC;
      
      const _elems = [];
      const time  = elem.getElementsByClassName('quizzes-time');
      QUIZ$TIME(time, _elems);
        
      elem.innerHTML = '';
      elem.appendChild(mrq);
      for(const _elem of _elems) {
        elem.appendChild(_elem);
      }
    } catch(e) {
      console.log(e);
    }
  }
  
  // MRQ
  const MRQ_CHK = [
    function(alp, txt, hnt, btn, cmnt) {
      let _=0;
      btn.onclick = function() {
        if(_===0) {
          _ = QUIZ_N(alp,txt,hnt,btn,cmnt);
        } else {
          _ = QUIZ_R(alp,txt,hnt,btn,cmnt);
        }
      };
      window.addEventListener('beforeprint', function() {
        QUIZ_N(alp,txt,hnt,btn,cmnt);
      });
      window.addEventListener('afterprint', function() {
        if(_===0) {
          QUIZ_R(alp,txt,hnt,btn,cmnt);
        }
      });
    },
    function(alp, txt, hnt, btn, cmnt) {
      let _=0;
      btn.onclick = function() {
        if(_===0) {
          _ = QUIZ_Y(alp,txt,hnt,btn,cmnt);
        } else {
          _ = QUIZ_R(alp,txt,hnt,btn,cmnt);
        }
      };
      window.addEventListener('beforeprint', function() {
        QUIZ_Y(alp,txt,hnt,btn,cmnt);
      });
      window.addEventListener('afterprint', function() {
        if(_===0) {
          QUIZ_R(alp,txt,hnt,btn,cmnt);
        }
      });
    }
  ];
  function MRQ(elem) {
    try {
      let mrq = document.createElement('div');
      mrq.className = 'remark-quizzes-mrq' + IS_LC;
      
        let pre = document.createElement('div');
        pre.className = 'remark-quizzes-pre';
          
          let num = document.createElement('span');
          num.className = 'remark-quizzes-pre-num';
          pre.appendChild(num);
          
          let qns = document.createElement('span');
          qns.className = 'remark-quizzes-pre-qns';
          qns.innerHTML = 'Choice';
          pre.appendChild(qns);
          
          let cmt = document.createElement('span');
          cmt.className = 'remark-quizzes-pre-cmt';
          cmt.innerHTML = 'Comment';
          pre.appendChild(cmt);
          
          let end = document.createElement('span');
          end.className = 'remark-quizzes-pre-btn';
          pre.appendChild(end);
        
        mrq.appendChild(pre);

      // Choices
      const choices = elem.getElementsByTagName('ol');
      const poll  = elem.getElementsByClassName('quizzes-poll');
      const time  = elem.getElementsByClassName('quizzes-time');
      const qrimg = elem.getElementsByClassName('quizzes-qr');
      
      if(choices.length > 0) {
        let _num = 0;
        
        for(const choice of choices[0].getElementsByTagName('li')) {
          let chc = document.createElement('div');
          chc.className = 'remark-quizzes-chc';
            
            let alp = document.createElement('span');
            alp.className = 'remark-quizzes-chc-num';
            alp.innerHTML = ALPHA[_num];
            chc.appendChild(alp);
            
            let txt = document.createElement('span');
            txt.className = 'remark-quizzes-chc-qns';
            txt.innerHTML = choice.getElementsByClassName('quiz-choice')[0].innerHTML;
            chc.appendChild(txt);
            
            let hnt = document.createElement('span');
            hnt.className = 'remark-quizzes-chc-cmt';
            let _cmnt = choice.getElementsByClassName('quiz-hint')[0].innerHTML;
            chc.appendChild(hnt);
            
            let btn = document.createElement('span');
            btn.className = 'remark-quizzes-chc-btn';
            btn.innerHTML = '<i class="fa-solid fa-circle-question remark-quizzes-icon-normal"></i>';
            chc.appendChild(btn);
            
            try {
              MRQ_CHK[choice.getElementsByClassName('quiz-ans')[0].innerHTML](alp,txt,hnt,btn,_cmnt);
            } catch(e) {}
          
          mrq.appendChild(chc);
          _num++;
        }
      }
      
      const _elems = [];
      QUIZ$POLL(poll, qrimg, _elems, 'multiple_choice_polls');
      QUIZ$TIME(time, _elems);
        
      elem.innerHTML = '';
      elem.appendChild(mrq);
      for(const _elem of _elems) {
        elem.appendChild(_elem);
      }
    } catch(e) {
      console.log(e);
    }
  }
  
  // RANK
  function RANK_CHK(btn,alphs,texts,ranks,answr,buttn) {
    const len = ranks.length;
    btn.addEventListener('click', function(e) {
      for(let i=0; i<len; i++) {
        if(ranks[i].value == answr[i]) {
          QUIZ_Y(alphs[i], texts[i], ranks[i], buttn[i], false);
        } else {
          QUIZ_N(alphs[i], texts[i], ranks[i], buttn[i], false);
        }
      }
    });
  }
  function RANK(elem) {
    try {
      let mrq = document.createElement('div');
      mrq.className = 'remark-quizzes-mrq' + IS_LC;
      
        let pre = document.createElement('div');
        pre.className = 'remark-quizzes-pre';
          
          let num = document.createElement('span');
          num.className = 'remark-quizzes-pre-num';
          pre.appendChild(num);
          
          let qns = document.createElement('span');
          qns.className = 'remark-quizzes-pre-qns';
          qns.innerHTML = 'Choice';
          pre.appendChild(qns);
          
          let cmt = document.createElement('span');
          cmt.className = 'remark-quizzes-pre-cmt';
          cmt.innerHTML = 'Rank';
          pre.appendChild(cmt);
          
          let end = document.createElement('span');
          end.className = 'remark-quizzes-pre-btn';
          pre.appendChild(end);
        
        mrq.appendChild(pre);

      // Choices
      const choices = elem.getElementsByTagName('ol');
      const poll  = elem.getElementsByClassName('quizzes-poll');
      const time  = elem.getElementsByClassName('quizzes-time');
      const qrimg = elem.getElementsByClassName('quizzes-qr');
      
      if(choices.length > 0) {
        let _num = 0;
        const _choices = choices[0].getElementsByTagName('li');
        const alphs = [];
        const texts = [];
        const ranks = [];
        const answr = [];
        const buttn = [];
        const limit = _choices.length;
        
        for(const choice of _choices) {
          let chc = document.createElement('div');
          chc.className = 'remark-quizzes-chc';
            
            let alp = document.createElement('span');
            alp.className = 'remark-quizzes-chc-num';
            alp.innerHTML = ALPHA[_num];
            chc.appendChild(alp);
            
            let txt = document.createElement('span');
            txt.className = 'remark-quizzes-chc-qns';
            txt.innerHTML = choice.getElementsByClassName('quiz-choice')[0].innerHTML;
            chc.appendChild(txt);
            
            let hnt = document.createElement('span');
            hnt.className = 'remark-quizzes-chc-cmt';
              let _labl = document.createElement('label');
              _labl.innerHTML = "Rank &nbsp;&nbsp;&nbsp;";
              _name = fresh$('rank');
              _labl.for = _name;
              hnt.appendChild(_labl);
              
              let _cmnt = _ranks(limit, _name, ranks.length+1);
              hnt.appendChild(_cmnt);
            chc.appendChild(hnt);
            
            let btn = document.createElement('span');
            if(_num === limit-1) {
              btn.className = 'remark-quizzes-chc-btn';
              btn.innerHTML = '<i class="fa-solid fa-circle-question remark-quizzes-icon-normal"></i>';
            } else {
              btn.className = 'remark-quizzes-chc-blank';
              btn.innerHTML = '';
            }
            chc.appendChild(btn);
            
            alphs.push(alp);
            texts.push(txt);
            ranks.push(_cmnt);
            answr.push(choice.getElementsByClassName('quiz-ans')[0].innerHTML);
            buttn.push(btn);
            
            if(_num === limit-1) { RANK_CHK(btn,alphs,texts,ranks,answr,buttn); }
          
          mrq.appendChild(chc);
          _num++;
        }
      }
      
      const _elems = [];
      QUIZ$POLL(poll, qrimg, _elems, 'ranking_poll');
      QUIZ$TIME(time, _elems);
        
      elem.innerHTML = '';
      elem.appendChild(mrq);
      for(const _elem of _elems) {
        elem.appendChild(_elem);
      }
    } catch(e) {
      console.log(e);
    }
  }
    function _ranks(limit, name, num) {
      const sel = document.createElement('select');
      sel.name = name;
      for(let i=1; i<=limit; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        if(num === i) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      }
      return sel;
    }
  
  function initQuizzesElem(opt, slideshow) {
    for(const mrq of document.getElementsByClassName('mrq')) {
      MRQ(mrq);
    }
    for(const rank of document.getElementsByClassName('rank')) {
      RANK(rank);
    }
    for(const timer of document.getElementsByClassName('timer-only')) {
      TIME(timer);
    }
  }
  
  function initQuizzesJS(opt, slideshow) {
  }
  
  function initQuizzesCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = BASE + (ALT ? 'plugins/quizzes/alt_style.css' : 'plugins/quizzes/style.css');
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
    try {
      ALT = !!opt.quizzes.alt;
      IS_HIDE = !!opt.quizzes.hide;
      KEY = opt.quizzes.key;
      KEY = parseInt(KEY);
      if(isNaN(KEY)) {
        KEY = 0;
      }
      IS_LC = opt.quizzes.poll;
      if(IS_LC !== 'lc' && IS_LC !== 'inline') {
        IS_LC = 'inline';
      }
      if(IS_LC === 'inline') {
        IS_LC = '';
      } else {
        IS_LC = '-' + IS_LC;
      }
      initQuizzesElem(opt, slideshow);
      initQuizzesJS(opt, slideshow);
      initQuizzesCSS(opt, slideshow);
    } catch(e) {
      KEY = 0;
    }
  }
  
  remark.register(init);
})();