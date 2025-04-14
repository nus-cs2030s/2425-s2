(function() {
  /* Options
  tbl: {
  }
  */
  let BASE = '';
  function initTOCElem(opt, slideshow) {
    // Cell
    for(let cell of document.getElementsByClassName("tbl-cell")) {
      const cls  = cell.innerHTML;
      const elem = findCell(cell);
      if(elem) {
        elem.classList.add(cls);
      }
    }
    // Row
    for(let row of document.getElementsByClassName("tbl-row")) {
      const cls  = row.innerHTML;
      const elem = findRow(row);
      if(elem) {
        elem.classList.add(cls);
      }
    }
    // Span
    for(let cell of document.getElementsByClassName("tbl-span")) {
      const val  = cell.innerHTML;
      const elem = findCell(cell);
      if(elem) {
        console.log(elem);
        elem.colSpan = val;
      }
    }
  }
    function findCell(cell) {
      while(cell.parentNode && cell.tagName !== 'TH' && cell.tagName !== 'TD') {
        cell = cell.parentNode;
      }
      return cell;
    }
    function findRow(cell) {
      while(cell.parentNode && cell.tagName !== 'TR') {
        cell = cell.parentNode;
      }
      return cell;
    }
  function initTOCCSS(opt, slideshow) {
    let link  = document.createElement('link');
    link.href = BASE+'plugins/tbl/style.css';
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
    initTOCElem(opt, slideshow);
    initTOCCSS(opt, slideshow);
  }
  
  remark.register(init);
})();