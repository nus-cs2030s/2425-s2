(function() {
  /* Options
  sublink: {
  }
  */
  let BASE = '';
  function initSublinkElem(opt, slideshow) {
    let page = 0, h3p = [], h3c = [], h3s = [],
                  h4p = [], h4c = [], h4s = [];
    for(const slide of document.getElementsByClassName('remark-slide')) {
      page += 1;
      const lcs = slide.getElementsByClassName('lc');
      if(lcs.length === 0) {
        let h3t = [], h3id = '', prev = null;
        for (const p of h3p) {
          if (h3id != p.id) {
            if (prev != null) {
              h3t.push(prev);
            }
            h3id = p.id
            prev = p;
          }
        }
        if (prev != null) { h3t.push(prev); }
        for (const l of h3c) {
          const h3 = l.getElementsByTagName('h3');
          const s3 = h3.length;
          if (s3 > 0) {
            h3[s3-1].getElementsByTagName('a')[0].classList.add('current');
          }
          for (let i=s3; i<h3t.length; i++) {
            l.append(h3t[i].cloneNode(true));
          }
        }
        let h4t = [], h4id = '', prv = null;
        for (const p of h4p) {
          if (p == null) { continue; }
          if (h4id != p.id) {
            if (prv != null) {
              h4t.push(prv);
            }
            h4id = p.id
            prv = p;
          }
        }
        if (prv != null) { h4t.push(prv); }
        for (const l of h4c) {
          const h4 = l.getElementsByTagName('h4');
          const s4 = h4.length;
          if (s4 > 0) {
            h4[s4-1].getElementsByTagName('a')[0].classList.add('current');
          }
          for (let i=s4; i<h4t.length; i++) {
            l.append(h4t[i].cloneNode(true));
          }
        }
        h3p = []; h3c = []; h3s = [];
        h4p = []; h4c = []; h4s = [];
      } else {
        let h3idx = -1;
        let h3lst = null;
        let h4lst = null;
        for(const h3 of lcs[0].getElementsByTagName('h3')) {
          h3idx += 1;
          if(h3idx >= h3s.length) {
            h3s.push(page);

            let h4t = [], h4id = '', prev = null;
            for (const p of h4p) {
              if (p == null) { continue; }
              if (h4id != p.id) {
                if (prev != null) {
                  h4t.push(prev);
                }
                h4id = p.id
                prev = p;
              }
            }
            if (prev != null) { h4t.push(prev); }
            for (const l of h4c) {
              const h4 = l.getElementsByTagName('h4');
              const s4 = h4.length;
              if (s4 > 0) {
                h4[s4-1].getElementsByTagName('a')[0].classList.add('current');
              }
              for (let i=s4; i<h4t.length; i++) {
                l.append(h4t[i].cloneNode(true));
              }
            }
            
            h4p = []; h4c = []; h4s = [];
          }
          h3.innerHTML = `<a href="#${h3s[h3idx]}">${h3.innerHTML}</a>`;
          h3lst = h3;
        }
        h3p.push(h3lst);
        let h4idx = -1;
        for(const h4 of lcs[0].getElementsByTagName('h4')) {
          h4idx += 1;
          if(h4idx >= h4s.length) {
            h4s.push(page);
          }
          h4.innerHTML = `<a href="#${h4s[h4idx]}">${h4.innerHTML}</a>`;
          h4lst = h4;
        }
        h4p.push(h4lst);
        h3c.push(lcs[0]);
        h4c.push(lcs[0]);
        // if (h3lst != null) {
          // h3lst.getElementsByTagName('a')[0].classList.add('current');
        // }
        // if (h4lst != null) {
          // h4lst.getElementsByTagName('a')[0].classList.add('current');
        // }
      }
    }
    // FINAL
    let h3t = [], h3id = '', prev = null;
    for (const p of h3p) {
      if (h3id != p.id) {
        if (prev != null) {
          h3t.push(prev);
        }
        h3id = p.id
        prev = p;
      }
    }
    if (prev != null) { h3t.push(prev); }
    for (const l of h3c) {
      const h3 = l.getElementsByTagName('h3');
      const s3 = h3.length;
      if (s3 > 0) {
        h3[s3-1].getElementsByTagName('a')[0].classList.add('current');
      }
      for (let i=s3; i<h3t.length; i++) {
        l.append(h3t[i].cloneNode(true));
      }
    }
    let h4t = [], h4id = '', prv = null;
    for (const p of h4p) {
      if (p == null) { continue; }
      if (h4id != p.id) {
        if (prv != null) {
          h4t.push(prv);
        }
        h4id = p.id
        prv = p;
      }
    }
    if (prv != null) { h4t.push(prv); }
    for (const l of h4c) {
      const h4 = l.getElementsByTagName('h4');
      const s4 = h4.length;
      if (s4 > 0) {
        h4[s4-1].getElementsByTagName('a')[0].classList.add('current');
      }
      for (let i=s4; i<h4t.length; i++) {
        l.append(h4t[i].cloneNode(true));
      }
    }
    h3p = []; h3c = []; h3s = [];
    h4p = []; h4c = []; h4s = [];
  }
  
  function initSublinkCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = BASE+'plugins/sublink/style.css';
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
    initSublinkElem(opt, slideshow);
    initSublinkCSS(opt, slideshow);
  }
  
  remark.register(init);
})();