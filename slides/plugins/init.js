$j(document).ready(function() {
  /* Cytoscape */
  let nodes = {};
  let edges = {__len__: 0};
  let elems = [];
  let fresh = 0;
  
  function freshName() {
    fresh++;
    return `node_${fresh}`;
  }
  function getCode() {
    return $j("#relalg").val().replaceAll("∧", "⋀").replaceAll("∨", "⋁").replaceAll("←","↤");
  }
  function addNode(id,lbl,cls) {
    if(id === '') { id = 'ε'; }
    if(nodes[id] === undefined) {
      const node = {
        group: 'nodes',
        data: {
          id  : id,
          lbl : lbl,
          w   : Math.max(lbl.length*8,20),
          type: 'node'
        },
        classes: 'node ' + cls
      };
      // cy.add(node);
      nodes[id] = node;
      elems.push(node);
    }
    return id;
  }
  function addEdge(src,dst) {
    if(src === '') { src = 'ε'; }
    const id = src+'->'+dst;
    if(edges[id] === undefined) {
      const edge = {
        group: 'edges',
        data: {
          id: id,
          source: src,
          target: dst
        },
        classes: 'edge'
      };
      // cy.add(edge);
      edges[id] = edge;
      edges.__len__++;
      elems.push(edge);
    }
  }
  // function addElem(src,dst,lbl) {
    // addNode(src,lbl);
    // addNode(dst);
    // addEdge(src,dst,'edge');
  // }
  
  /* Treant */
  const config = {
    container      : "#canvas",
    rootOrientation: "WEST",
    nodeAlign      : "BOTTOM",
    animateOnInit  : true,

    siblingSeparation: 20,
    subTeeSeparation : 60,
    scrollbar        : "fancy",

    connectors: {
      type: 'step'
    },
    node: {
      HTMLclass  : 'node',
      collapsable: true,
    },
    animation: {
      nodeAnimation      : "easeOutBounce",
      nodeSpeed          : 700,
      connectorsAnimation: "bounce",
      connectorsSpeed    : 700,
    },
  }
  code_editor = editor("code");
  cons_editor = editor("cons", {write:false, number:false, theme:"ace/theme/monokai", mode: "ace/mode/text"});
  document.getElementById("upload").addEventListener('change', code_editor.read, false);
  
  const _graphLbl = {
    '-'  :'-', '\\/':'∪', '/\\':'∩', '*':'×',
    '%S' :'σ', '%P' :'π', '%R' :'ρ',
    '#'  :'⋈', '#j' :'⋈',
    '#l' :'⟕', '#r' :'⟖', '#f' :'⟗',
    '#ln':'⟕', '#rn':'⟖', '#fn':'⟗'
  }
  const _condStr = {
    "<=" : "≤", ">=" : "≥",
    "<"  : "<", ">"  : ">",
    "==" : "=", "<>" : "≠",
    "===": "≡", "=/=": "≢",
    "&"  : "⋀", "|"  : "⋁",
  };
  function _arr(arrs) {
    let res = [];
    for(let i=0; i<arrs.length; i++) {
      res.push(`${arrs[i].o_name.val} ↤ ${arrs[i].n_name.val}`);
    }
    return res;
  }
  function _str(cond) {
    let l_arg, r_arg, arg;
    switch(cond.op) {
      case "===": // NULL equality
      case "=/=": // NULL inequality
      case "==":  // strict equality
      case "<>":  // strict inequality
      case "<=":  // less than or equal
      case ">=":  // greater than or equal
      case "<":   // less than
      case ">":   // greater than
      case "&":   // and
      case "|":   // or
        l_arg = _str(cond.l_arg);
        r_arg = _str(cond.r_arg);
        return `(${l_arg} ${_condStr[cond.op]} ${r_arg})`;
      case "~":   // not
        return `¬(${_str(cond.arg)})`;
      case "%c":  // constant
        switch(typeof(cond.val)) {
          case 'number': return `${cond.val}`;
          case 'string': return `'${cond.val}'`;
          case 'object': return "NULL";
        }
        throw ''; //ra$InvalidType(alg.val, alg.type, alg.op);
      case "%n":  // names
        return `${cond.val}`;
      default:    // ERROR
        throw ''; //ra$InvalidOperation(alg.op);
    }
  }
  function graph(alg,kls) {
    let src, dst1, dst2;
    switch(alg.op) {
      case '%S': // Selection
        src = freshName();
        addNode(src,`${_graphLbl[alg.op]}[${_str(alg.l_arg)}]`,kls);
        dst1 = graph(alg.r_arg,kls);
        addEdge(src,dst1);
        return src;
      case '%P': // Projection
        src = freshName();
        addNode(src,`${_graphLbl[alg.op]}[${alg.l_arg.join(",")}]`,kls);
        dst1 = graph(alg.r_arg,kls);
        addEdge(src,dst1);
        return src;
      case '%R': // Renaming
        src = freshName();
        addNode(src,`${_graphLbl[alg.op]}[${_arr(alg.l_arg).join(",")}]`,kls);
        dst1 = graph(alg.r_arg,kls);
        addEdge(src,dst1);
        return src;
      
      case '-'  : case '\\/': case '/\\': case '*':
      case '#'  : case '#j' :
      case '#l' : case '#r' : case '#f' :
      case '#ln': case '#rn': case '#fn':
        if(alg.cond === undefined) {
          src = freshName();
          addNode(src,_graphLbl[alg.op],kls);
          dst1 = graph(alg.l_arg,kls);
          dst2 = graph(alg.r_arg,kls);
          addEdge(src,dst1);
          addEdge(src,dst2);
          return src;
        } else {
          src = freshName();
          addNode(src,`${_graphLbl[alg.op]}[${_str(alg.cond)}]`,kls);
          dst1 = graph(alg.l_arg,kls);
          dst2 = graph(alg.r_arg,kls);
          addEdge(src,dst1);
          addEdge(src,dst2);
        }
        return src;
      
      case '%T':
        src = freshName();
        addNode(src,alg.arg,kls);
        return src;
      case '%n': case '%c':
        src = freshName();
        addNode(src,alg.val,kls);
        return src;
    }
  }
  function _draw(alg) {
    try {
      graph(alg,'unmarked');
      cytoscape({
        container: document.getElementById('cy'),
        style: [
          {
            selector: '.node',
            css: {
              shape  : 'rectangle',
              content: 'data(lbl)',
              color  : 'black',
              height : 25,
              width  : 'data(w)',
              'font-size': '16px',
              'text-valign': 'center',
              'text-halign': 'center'
            }
          },
          {
            selector: '.cond',
            css: {
              'background-color': '#ddd',
            }
          },
          {
            selector: '.unmarked',
            css: {
              'background-color': 'white',
            }
          },
          {
            selector: '.edge',
            css: {
              'curve-style': 'bezier',
              width: 1,
            }
          },
        ],
        layout: {
          name: 'dagre'
        },
        elements: elems
      });
    } catch(e) { console.log(e); }
  }
  function auto() {
    code_editor.RES();
    cons_editor.load("");
    try {
      let alg = null;
      nodes = {};
      edges = {__len__: 0};
      elems = [];
      fresh = 0;
      
      try {
        alg = alg_parser.parse(getCode());
        _draw(alg);
      } catch(e) {
        throw {
          message : e.message,
          location: e.location,
          source  : "alg"
        };
      }
      
      let tbl = null;
      try {
        tbl = tbl_parser.parse(code_editor.value());
      } catch(e) {
        throw {
          message : e.message,
          location: e.location,
          source  : "tbl"
        };
      }
      let res = ra.exec(alg, tbl)
      let chart = {
        chart        : config,
        nodeStructure: res.tbl,
      };
      new Treant(chart);
      cons_editor.load("Normalised Expression:\n" + res.norm);
    } catch(e) {
      new Treant({chart: config,nodeStructure: []});
      switch(e.source) {
        case 'tbl':
          code_editor.err(e.location.start.line-1);
          break;
        case 'alg':
          break;
        default:
      }
      cons_editor.load(e.message);
    }
  }
  $j("#play").click(auto);
  
  function write(id) {
    return function() {
      let val = $j("#relalg").val();
      let sidx = document.getElementById("relalg").selectionStart;
      let eidx = document.getElementById("relalg").selectionEnd;
      $j("#relalg").val(val.slice(0, sidx) + $j(id).html() + val.slice(eidx));
      $j("#relalg").focus();
      document.getElementById("relalg").selectionStart = sidx + 1;
      document.getElementById("relalg").selectionEnd   = sidx + 1;
    };
  }
  $j("#sel" ).click(write("#sel" ));
  $j("#proj").click(write("#proj"));
  $j("#ren" ).click(write("#ren" ));
  $j("#cup" ).click(write("#cup" ));
  $j("#cap" ).click(write("#cap" ));
  $j("#cart").click(write("#cart"));
  $j("#nat" ).click(write("#nat" ));
  $j("#lout").click(write("#lout"));
  $j("#rout").click(write("#rout"));
  $j("#fout").click(write("#fout"));
  $j("#arr" ).click(write("#arr" ));
  $j("#not" ).click(write("#not" ));
  $j("#land").click(write("#land"));
  $j("#lor" ).click(write("#lor" ));
  $j("#neq" ).click(write("#neq" ));
  $j("#lte" ).click(write("#lte" ));
  $j("#gte" ).click(write("#gte" ));
  $j("#eqv" ).click(write("#eqv" ));
  $j("#neqv").click(write("#neqv"));
  
  let _c = document.getElementById('canvas');
  let _w = _c.offsetWidth;
  let _h = _c.offsetHeight;
  _c = _c.parentNode;
  let _s = 1;
  function _resize(scl) {
    const _scl = 100/scl;
    // const svg = _c.getElementsByTagName('svg')[0];
    _c.style.width  = `${_w/scl}px`;
    _c.style.height = `${_h/scl}px`;
    // svg.width  = `${_w/scl}px`;
    // svg.height = `${_h/scl}px`;
    _c.style.transform = `scale(${scl})`;
    _c.style['transform-origin'] = '0 0';
  }
  $j("#zoom-in" ).click((e) => {_s+=0.05;_resize(_s);});
  $j("#zoom-out").click((e) => {_s-=0.05;_resize(_s);});
  
  function save(file,content) {
    return function() {
      let link = document.createElement('a');
      link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content()));
      link.setAttribute('download', file);
      if (document.createEvent) {
        let event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        link.dispatchEvent(event);
      } else {
        link.click();
      }
    }
  }
  
  function norm_expr() {
    let res = '';
    try {
      res = ra.str(alg_parser.parse((getCode())));
    } catch(e) { }
    return res;
  }
  function sql_equiv() {
    let res = '';
    try {
      const tbls = tbl_parser.parse(code_editor.value());
      const algs = alg_parser.parse((getCode()));
      const sqls = [];
      for(const tbl of tbls) {
        let sql = `
DROP TABLE IF EXISTS ${tbl.name};
CREATE TABLE ${tbl.name} (
  ${tbl.head.map((val) => {return val + ' INTEGER'}).join(',\n  ')}
);`
        for(const row of tbl.data) {
          let ins = `\nINSERT INTO ${tbl.name} VALUES (${row.join(',')}); `;
          sql += ins;
        }
        sqls.push(sql);
      }
      res = sqls.join('\n') + '\n\n' + ra.exec(algs,tbls).sql + ';';
    } catch(e) { console.log(e); }
    return res;
  }
  // window.sql_code = sql_equiv;
  // $j("#save").click(save("expr.alg", norm_expr));
  $j("#sql" ).click(save("code.sql", sql_equiv));
  $j(function () { $j('[data-toggle="tooltip"]').tooltip(); })
  
  document.addEventListener('keydown', (event) => {
    if(event.ctrlKey && event.key == "Enter") {
      auto();
    }
  });
  function dlCanvas() {
    let cvs = document.getElementById('cy');
    cvs = cvs.getElementsByTagName('canvas');
    cvs = cvs[cvs.length-1];
    let png = cvs.toDataURL('image/png');
    png = png.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
    
    let link = document.createElement('a');
    link.setAttribute('href', png);
    link.setAttribute('download', 'ra.png');
    if (document.createEvent) {
      let event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      link.dispatchEvent(event);
    } else {
      link.click();
    }
  };
  document.getElementById('dl').addEventListener('click', dlCanvas, false);
  document.getElementById('fs').addEventListener('click', function(e) {
    let cyDiv = document.getElementById('cy-div');
    cyDiv.classList.toggle('cy-min');
    cyDiv.classList.toggle('cy-full');
    try {
      nodes = {};
      edges = {__len__: 0};
      elems = [];
      fresh = 0;
      _draw(alg_parser.parse(getCode()));
    } catch(e) {}
  }, false);
});