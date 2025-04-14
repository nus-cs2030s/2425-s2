(function() {
  /* Options
  unprint: {
  }
  */
  let BASE = '';
  function init(opt, slideshow) {
    if (opt && opt.base) {
      BASE = opt.base;
      if (BASE[BASE.length-1] != '/') {
        BASE = BASE + '/';
      }
    }
    window.addEventListener('beforeprint', function(e) {
      let slds = document.getElementsByClassName('remark-slide-container');
      for(let i=0; i<slds.length-1; i++) {
        const csld = slds[i  ];
        const nsld = slds[i+1];
        const cnum = csld.querySelector('.remark-slide-number').innerHTML;
        const nnum = nsld.querySelector('.remark-slide-number').innerHTML;
        if(cnum === nnum) {
          csld.classList.add('remark-unprint-hide');
        } else if(csld.getElementsByClassName('UNPRINT').length > 0) {
          csld.classList.add('remark-unprint-hide');
        }
      }
    });
    window.addEventListener('afterprint', function(e) {
      let slds = document.getElementsByClassName('remark-slide-container');
      for(let i=0; i<slds.length-1; i++) {
        const csld = slds[i  ];
        const nsld = slds[i+1];
        const cnum = csld.querySelector('.remark-slide-number').innerHTML;
        const nnum = nsld.querySelector('.remark-slide-number').innerHTML;
        if(cnum === nnum) {
          csld.classList.remove('remark-unprint-hide');
        }
        if(csld.getElementsByClassName('UNPRINT').length > 0) {
          csld.classList.remove('remark-unprint-hide');
        }
      }
    });
    
    let link  = document.createElement('link');
    link.href = BASE+'plugins/unprint/style.css';
    link.rel  = 'stylesheet';
    link.type = 'text/css'; 
    document.head.appendChild(link);
  }
  
  remark.register(init);
})();