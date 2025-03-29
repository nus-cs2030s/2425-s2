(function() {
  /* Options
  toc: {
    title : 'single' / 'multi' (default: 'multi')
    unique: false    / true    (default: true   )
  }
  */
  let BASE = '';
  const CLOSED = 0;
  const OPENED  = 1;
  let area;
  let button;
  let content;
  let state = CLOSED;
  let slides = [];
  
  function initTOCElem_area(opt, slideshow) {
    area = document.createElement('div');
    area.className = 'remark-ltoc-area remark-ltoc-hidden';
    button = document.createElement('div');
    button.className = 'remark-ltoc-btn';
    area.appendChild(button);
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-bars';
    button.appendChild(icon);
    content = document.createElement('div');
    content.className = 'remark-toc-content'
    area.appendChild(content);
    document.getElementsByTagName('body')[0].appendChild(area);
    
    const _toc = document.createElement('span');
    _toc.className = 'remark-toc-content-label';
    _toc.innerHTML = '<i class="fa-solid fa-book-open-reader"></i> Table of Content';
    content.appendChild(_toc);
  }
  function initTOCElem_content(opt, slideshow) {
    const isSingle = opt && opt.toc && opt.toc.title && opt.toc.title === 'single';
    if(isSingle) {
      initTOCElem_content_single(opt, slideshow);
    } else {
      initTOCElem_content_multi(opt, slideshow);
    }
  }
      function initTOCElem_content_single(opt, slideshow) {
        const isUnique = opt ?? opt.toc ?? opt.toc.unique;
        
        /* Titles */
        let title = document.getElementsByClassName('titles')[0];
        let lnk, nm, index;
        const ul = document.createElement('ul');
        
        if(title && title.id !== '') {
          lnk = title.id.slice(6);
          nm  = lnk.replaceAll('_',' ');
        
          const tt = document.createElement('li');
          tt.className = 'remark-toc-content-title';
          const tt_a = document.createElement('a');
          tt_a.href = '#' + lnk;
          tt_a.innerHTML = '<i class="fa-solid fa-book-bookmark"></i> ' + nm;
          tt.appendChild(tt_a);
          ul.appendChild(tt);
          
          index = slideshow.getSlideByName(lnk).getSlideIndex();
          slides = [[index, tt]];
        }
        
        /* Subtitles */
        const subtitles = document.getElementsByClassName('subtitles');
        const subttl = {};
        for(const subtitle of subtitles) {
          if(subttl[subtitle.id] !== undefined && isUnique) { continue; }
          if(subtitle.id !== '') {
            subttl[subtitle.id] = true;
            lnk = subtitle.id.slice(6);
            nm  = lnk.replaceAll('_',' ');
            
            const st = document.createElement('li');
            st.className = 'remark-toc-content-subtitle';
            const st_a = document.createElement('a');
            st_a.href = '#' + lnk;
            st_a.innerHTML = '<i class="fa-solid fa-bookmark"></i> ' + nm;
            st.appendChild(st_a);
            ul.appendChild(st);
            
            index = slideshow.getSlideByName(lnk).getSlideIndex();
            slides.push([index, st]);
          }
        }
        content.appendChild(ul);
      }
      function initTOCElem_content_multi(opt, slideshow) {
        function hasKlass(classList, klass) {
          for(const kls of classList) {
            if(kls === klass) {
              return true;
            }
          }
          return false;
        }
        const ul = document.createElement('ul');
        
        /* All Titles & Subtitle */
        const isUnique = opt ?? opt.toc ?? opt.toc.unique;
        const alltitles = document.querySelectorAll('.titles,.subtitles');
        const ttl = {};
        const sub = {};
        
        for(const title of alltitles) {
          let isTitle = hasKlass(title.classList, 'titles');
          
          if(isTitle) {
            if(ttl[title.id] !== undefined && isUnique) { continue; }
          } else {
            if(sub[title.id] !== undefined && isUnique) { continue; }
          }
          if(title.id !== '') {
            if(isTitle) {
              ttl[title.id] = true;
            } else {
              sub[title.id] = true;
            }
            lnk = title.id.slice(6);
            nm  = lnk.replaceAll('_',' ');
            
            const st = document.createElement('li');
            st.className = isTitle ? 'remark-toc-content-title' : 'remark-toc-content-subtitle';
            const st_a = document.createElement('a');
            st_a.href = '#' + lnk;
            st_a.innerHTML = (isTitle ? '<span class="fa-solid fa-book-bookmark remark-toc-content-icon"></span> ' : '<span class="fa-solid fa-bookmark remark-toc-content-icon"></span> ') + '<span class="remark-toc-content-link">' + nm + '</span>';
            st.appendChild(st_a);
            ul.appendChild(st);
            
            index = slideshow.getSlideByName(lnk).getSlideIndex();
            slides.push([index, st]);
          }
        }
        content.appendChild(ul);
      }
  
  function initTOCElem(opt, slideshow) {
    initTOCElem_area(opt, slideshow);
    initTOCElem_content(opt, slideshow);
  }
  function initTOCJS(opt, slideshow) {
    button.addEventListener('click', function(e) {
      if(state === CLOSED) {
        area.classList.add('remark-ltoc-showing');
        area.classList.remove('remark-ltoc-hidden');
        area.classList.remove('remark-ltoc-hiding');
        area.classList.add('remark-ltoc-shown');
      } else {
        area.classList.add('remark-ltoc-hiding');
        area.classList.remove('remark-ltoc-shown');
        area.classList.remove('remark-ltoc-showing');
        area.classList.add('remark-ltoc-hidden');
      }
      state = 1 - state;
    });
    
    document.getElementsByClassName('remark-slides-area')[0].addEventListener('click', function(e) {
      if(state === OPENED) {
        area.classList.add('remark-ltoc-hiding');
        area.classList.remove('remark-ltoc-shown');
        area.classList.remove('remark-ltoc-showing');
        area.classList.add('remark-ltoc-hidden');
        state = CLOSED;
      }
    });
    
    function update(slide) {
      /* Update Active */
      let index = slide.getSlideIndex();
      let found = false;
      for(let i=slides.length-1; i>=0; i--)  {
        const sld = slides[i];
        sld[1].classList.remove('remark-toc-content-active');
        if(!found && sld[0] <= index) {
          found = true;
          sld[1].classList.add('remark-toc-content-active');
        }
      }
    }
    slideshow.on('showSlide', update);
    const _allSlides = slideshow.getSlides();
    if(_allSlides.length > 0) {
      let curr = slideshow.getCurrentSlideIndex();
      let ctmx = slideshow.getSlideCount();
      if(curr > ctmx) { curr = ctmx; slideshow.gotoSlide(curr); }
      if(curr <= 0)   { curr = 1;    slideshow.gotoSlide(curr); }
      update(slideshow.getSlides()[curr]);
    }
  }
  
  function initTOCCSS(opt, slideshow) {
    let head = document.getElementsByTagName('head')[0];
    let link  = document.createElement('link');
    link.href = BASE+'plugins/toc/style.css';
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
    initTOCElem(opt, slideshow);
    initTOCJS(opt, slideshow);
    initTOCCSS(opt, slideshow);
  }
  
  remark.register(init);
})();