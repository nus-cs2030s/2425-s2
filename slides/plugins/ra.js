ra = /*
 * Relational Algebra
 *   Table/Relation Structure
 *     {
 *       name: str,
 *       head: [str, str, ...],
 *       data: [
 *               [int, int, ...],
 *               [int, int, ...],
 *               :,
 *             ]
 *     }
 */
(function() {
  "use strict";
  /** Const **/
  const OP = {
    "<=" : ((x,y) => { return x  <= y; }), ">=" : ((x,y) => { return x  >= y; }),
    "<"  : ((x,y) => { return x  <  y; }), ">"  : ((x,y) => { return x  >  y; }),
    "==" : ((x,y) => { return x === y; }), "<>" : ((x,y) => { return x !== y; }),
    "===": ((x,y) => { return x === y; }), "=/=": ((x,y) => { return x !== y; }),
    "&"  : ((x,y) => {
              if(x === false || y === false) { return false; }
              if(x === null  || y === null ) { return null;  }
              return x && y;
            }),
    "|"  : ((x,y) => {
              if(x === true  || y === true ) { return true;  }
              if(x === null  || y === null ) { return null;  }
              return x || y;
            }),
  };
  const STR = {
    "<=" : "≤", ">=" : "≥",
    "<"  : "<", ">"  : ">",
    "==" : "=", "<>" : "≠",
    "===": "≡", "=/=": "≢",
    "&"  : "⋀", "|"  : "⋁",
  };
  const TXT = {
    "<=" : "<=" , ">=" : ">=",
    "<"  : "<"  , ">"  : ">" ,
    "==" : "="  , "<>" : "<>",
    "&"  : "AND", "|"  : "OR",
    "===": "IS DISTINCT FROM",
    "=/=": "IS NOT DISTINCT FROM",
  };
  const LBL = {
    '-'  :'-', '\\/':'∪', '/\\':'∩', '*':'×',
    '∪':'∪', '∩':'∩', '×':'×',
    'σ' :'σ', 'π' :'π', 'ρ' :'ρ',
    '%S' :'σ', '%P' :'π', '%R' :'ρ',
    '#'  :'⋈', '#j' :'⋈',
    '#l' :'⟕', '#r' :'⟖', '#f' :'⟗',
    '#ln':'⟕', '#rn':'⟖', '#fn':'⟗',
    '⋈'  :'⋈', '⟕'  :'⟕', '⟖'  :'⟖', '⟗':'⟗',
    "<=" : "≤", ">=" : "≥",
    "<"  : "<", ">"  : ">",
    "==" : "=", "<>" : "≠",
    "===": "≡", "=/=": "≢",
    "&"  : "⋀", "|"  : "⋁",
  }
  
  /** Names **/
  let num = 0;
  function exec$name() {
    num += 1;
    return `$T${num}`;
  }
  function name$num(name) {
    let idx = name.indexOf(":=");
    if(idx < 0) {
      return name;
    } else {
      return name.slice(0,idx-1);
    }
  }
  
  /** Error Messages **/
  function ra$TableColError(name,op,loc) {
    return new errors.CompileError(`Table ${name} has inconsistent number of columns`, op, [name,op], loc ?? 0);
  }
  function ra$TableDataError(name,op,loc) {
    return new errors.CompileError(`Table ${name} has inconsistent data type`, op, [name,op], loc ?? 0);
  }
  function ra$TableNotFound(name,op) {
    return new errors.RuntimeError(`Table ${name} not found for operation ${LBL[op]}`, op, [name,op]);
  }
  function ra$ColumnNotFound(name,op) {
    return new errors.RuntimeError(`Column ${name} not found for operation ${LBL[op]}`, op, [name,op]);
  }
  function ra$UnionIncompatible(head1,head2,op) {
    return new errors.RuntimeError(`Union incompatible headers [${head1.join(",")}] and [${head2.join(",")}] for operation ${LBL[op]}`, op, [head1,head2,op]);
  }
  function ra$DuplicateHeader(name,op) {
    return new errors.RuntimeError(`Duplicate header ${name} for operation ${LBL[op]}`, op, [name,op]);
  }
  function ra$InvalidOperation(op) {
    return new errors.RuntimeError(`Invalid operation ${LBL[op]}`, op, [op]);
  }
  function ra$InvalidType(val, type, op) {
    return new errors.RuntimeError(`Invalid type ${type} for ${val}`, op, [val, type, op]);
  }
  function ra$IncompatibleType(l_type, r_type, op) {
    return new errors.RuntimeError(`Incompatible type between attribute ${l_type} and ${r_type} for operation ${LBL[op]}`, op, [l_type, r_type, op]);
  }
  
  /** Tablify **/
  function REL(name,head,data) {
    let res = [];
    for(let i=0; i<data.length; i++) {
      if(!contains(res,data[i])) {
        res.push(data[i].slice());
      }
    }
    table$check({ name:name, head:head, data:res });
    return { name:name, head:head, data:res };
  }
  function TBL$head(head) {
    let res = '<thead class="table-dark"><tr>';
    for(let i=0; i<head.length; i++) {
      res += `<th><b>${head[i]}</b></th>`;
    }
    return res + "</tr></thead>";
  }
  function TBL$rows(row) {
    let res = "<tr>";
    for(let i=0; i<row.length; i++) {
      if(typeof(row[i]) === "number") {
        res += `<td>${row[i]}</td>`;
      } else if(typeof(row[i]) === "string") {
        res += `<td>"${row[i]}"</td>`;
      } else if(row[i] === null) {
        res += `<td>NULL</td>`;
      }
      
    }
    return res + "</tr>";
  }
  function TBL$data(data) {
    let res = '<tbody class="table-light table-striped">';
    for(let i=0; i<data.length; i++) {
      res += TBL$rows(data[i]);
    }
    return res + "</tbody>";
  }
  function TBL(tbl) {
    return `<center><i>${tbl.name}</i></center><table class="table table-sm table-bordered">${TBL$head(tbl.head)}${TBL$data(tbl.data)}</table>`;
  }
  function RET(rel, norm, child=[], sql='', name='') {
    child ??= []; sql ??= '';
    if(child.length > 0) {
      return {
        rel :rel,
        sql :sql,
        tbl :{
          innerHTML: TBL(rel),
          collapsed: true,
          children: child,
          childrenDropLevel: 1
        },
        norm:norm,
        name:name,
      };
    } else {
      return {
        rel :rel,
        sql :sql,
        tbl : {
          innerHTML: TBL(rel)
        },
        norm:norm,
        name:name,
      };
    }
  }
  function IND(sql) {
    return sql.split('\n').map((ln) => { return '  '+ln.replaceAll('$',''); }).join('\n');
  }
  
  /** Helper **/
  function table$checks(tbls) {
    for(let i=0; i<tbls.length; i++) {
      table$check(tbls[i]);
    }
  }
  function table$check(tbl) {
    let data = tbl.data, head = tbl.head, name = tbl.name;
    if(data.length === 0) return;
    if(data[0].length !== head.length) throw ra$TableColError(name,"type check");
    let type = [];
    for(let i=0; i<data[0].length; i++) {
      for(let j=0; j<data.length; j++) {
        if(data[j][i] !== null) {
          type.push(typeof(data[j][i]));
          break;
        }
        if(j === data.length-1) { // all NULL
          type.push(null);
          break;
        }
      }
    }
    for(let i=1; i<data.length; i++) {
      if(data[i].length !== head.length) throw ra$TableColError(name,"type check");
      let row = data[i];
      for(let j=0; j<row.length; j++) {
        if(typeof(row[j]) !== type[j] && row[j] !== null && type[j] !== null) throw ra$TableDataError(name,"type check");
      }
    }
  }
  function eq_row(row1, row2) {
    if(row1.length !== row2.length) {
      return false;
    } else {
      for(let i=0; i<row1.length; i++) {
        if(row1[i] !== row2[i]) {
          return false;
        }
      }
      return true;
    }
  }
  function contains(data, row) {
    for(let i=0; i<data.length; i++) {
      if(eq_row(data[i], row)) {
        return true;
      }
    }
    return false;
  }
  function compatible(head1, head2, op) {
    if(head1.length !== head2.length) {
      throw ra$UnionIncompatible(head1,head2,op);
    }
  }
  function disjoint(head1, head2, op) {
    let chk = {};
    for(let i=0; i<head1.length; i++) {
      if(chk[head1[i]] !== undefined) {
        throw ra$DuplicateHeader(head1[i],op);
      }
      chk[head1[i]] = 1;
    }
    for(let i=0; i<head2.length; i++) {
      if(chk[head2[i]] !== undefined) {
        throw ra$DuplicateHeader(head2[i],op);
      }
      chk[head2[i]] = 1;
    }
  }
  function concat(row1, row2) {
    let res = row1.slice();
    for(let i=0; i<row2.length; i++) {
      res.push(row2[i]);
    }
    return res;
  }
  function natcat(row1, row2, hdr1, hdr2) {
    let res = row1.slice();
    for(let i=0; i<hdr2.length; i++) {
      if(!contains(hdr1, hdr2[i])) {
        res.push(eval$find(hdr2[i], row2, hdr2, "⋈"));
      }
    }
    return res;
  }
  function nullrow(len) {
    let res = new Array(len);
    for(let i=0; i<len; i++) {
      res[i] = null;
    }
    return res;
  }
  
  /** Joins **/
  function inner$J(res,tbl1,tbl2,hdr,cond) {
    for(let i=0; i<tbl1.data.length; i++) {
      for(let j=0; j<tbl2.data.length; j++) {
        let row = concat(tbl1.data[i], tbl2.data[j]);
        if(eval$sel(cond, row, hdr) === true) {
          res.push(row);
        }
      }
    }
    return res;
  }
  function inner$N(res,tbl1,tbl2,hdr1,hdr2) {
    for(let i=0; i<tbl1.data.length; i++) {
      for(let j=0; j<tbl2.data.length; j++) {
        if(eval$nat(tbl1.data[i], tbl2.data[j], hdr1, hdr2)) {
          res.push(natcat(tbl1.data[i], tbl2.data[j], hdr1, hdr2));
        }
      }
    }
    return res;
  }
  function outer$L(res,tbl1,tbl2,hdr,cond) {
    for(let i=0; i<tbl1.data.length; i++) {
      let match = false;
      for(let j=0; j<tbl2.data.length; j++) {
        let row = concat(tbl1.data[i], tbl2.data[j]);
        if(eval$sel(cond, row, hdr) === true) {
          match = true;
          break;
        }
      }
      if(!match) {
        res.push(concat(tbl1.data[i], nullrow(tbl2.head.length)));
      }
    }
    return res;
  }
  function outer$R(res,tbl1,tbl2,hdr,cond) {
    for(let i=0; i<tbl2.data.length; i++) {
      let match = false;
      for(let j=0; j<tbl1.data.length; j++) {
        let row = concat(tbl1.data[j], tbl2.data[i]);
        if(eval$sel(cond, row, hdr) === true) {
          match = true;
          break;
        }
      }
      if(!match) {
        res.push(concat(nullrow(tbl1.head.length), tbl2.data[i]));
      }
    }
    return res;
  }
  function outer$LN(res,tbl1,tbl2,hdr1,hdr2) {
    for(let i=0; i<tbl1.data.length; i++) {
      let match = false;
      for(let j=0; j<tbl2.data.length; j++) {
        if(eval$nat(tbl1.data[i], tbl2.data[j], hdr1, hdr2)) {
          match = true;
          break;
        }
      }
      if(!match) {
        res.push(natcat(tbl1.data[i], nullrow(hdr2.length), hdr1, hdr2));
      }
    }
    return res;
  }
  function outer$RN(res,tbl1,tbl2,hdr1,hdr2) {
    let thdr = natcat(hdr1,hdr2,hdr1,hdr2);
    let shdr = natcat(hdr2,hdr1,hdr2,hdr1);
    for(let j=0; j<tbl2.data.length; j++) {
      let match = false;
      for(let i=0; i<tbl1.data.length; i++) {
        if(eval$nat(tbl1.data[i], tbl2.data[j], hdr1, hdr2)) {
          match = true;
          break;
        }
      }
      if(!match) {
        res.push(eval$proj(shdr, natcat(tbl2.data[j], nullrow(hdr1.length), hdr2, hdr1), thdr));
      }
    }
    return res;
  }
  
  /** Algebra Operations **/
  function exec$cup(arg1, arg2) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    compatible(tbl1.head, tbl2.head, "∪");
    for(let i=0; i<tbl1.data.length; i++) {
      res.push(tbl1.data[i].slice());
    }
    for(let i=0; i<tbl2.data.length; i++) {
      res.push(tbl2.data[i].slice());
    }
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ∪ ${name$num(tbl2.name)}`, tbl1.head, res),
      `(${arg1.norm} ∪ ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
((
${IND(arg1.sql)} 
)
UNION 
(
${IND(arg2.sql)} 
)) as ${name.slice(1)} 
`,
      name.slice(1)
    );
  }
  function exec$cap(arg1, arg2) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    compatible(tbl1.head, tbl2.head, "∩");
    for(let i=0; i<tbl1.data.length; i++) {
      if(contains(tbl2.data, tbl1.data[i])) {
        res.push(tbl1.data[i].slice());
      }
    }
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ∩ ${name$num(tbl2.name)}`, tbl1.head, res),
      `(${arg1.norm} ∩ ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
((
${IND(arg1.sql)} 
)
INTERSECT 
(
${IND(arg2.sql)} 
)) as ${name.slice(1)} 
`,
      name.slice(1)
    );
  }
  function exec$diff(arg1, arg2) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    compatible(tbl1.head, tbl2.head, "-");
    for(let i=0; i<tbl1.data.length; i++) {
      if(!contains(tbl2.data, tbl1.data[i])) {
        res.push(tbl1.data[i].slice());
      }
    }
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} - ${name$num(tbl2.name)}`, tbl1.head, res),
      `(${arg1.norm} - ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
((
${IND(arg1.sql)} 
)
EXCEPT 
(
${IND(arg2.sql)} 
)) as ${name.slice(1)} 
`,
      name.slice(1)
    );
  }
  function exec$cart(arg1, arg2) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    disjoint(tbl1.head, tbl2.head, "×");
    for(let i=0; i<tbl1.data.length; i++) {
      for(let j=0; j<tbl2.data.length; j++) {
        res.push(concat(tbl1.data[i], tbl2.data[j]));
      }
    }
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} × ${name$num(tbl2.name)}`, concat(tbl1.head, tbl2.head), res),
      `(${arg1.norm} × ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(${IND(arg1.sql)}) AS _${arg1.name} ,
(${IND(arg2.sql)}) AS _${arg2.name} 
`,
      name.slice(1)
    );
  }
  function exec$join(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = concat(tbl1.head, tbl2.head);
    disjoint(tbl1.head, tbl2.head, "⋈");
    res = inner$J(res,tbl1,tbl2,hdr,cond); // inner join
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⋈[${eval$str(cond)}] ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⋈[${eval$str(cond)}] ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
ON ${eval$txt(cond)}  
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  function exec$nat(arg1, arg2) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = natcat(tbl1.head, tbl2.head, tbl1.head, tbl2.head);
    res = inner$N(res,tbl1,tbl2,tbl1.head,tbl2.head); // natural inner join
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⋈ ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⋈ ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
NATURAL JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  // TODO: Possibly optimise lout/rout/fout [currently written for simplicity of checking]
  function exec$lout(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = concat(tbl1.head, tbl2.head);
    disjoint(tbl1.head, tbl2.head, "⟕");
    res = inner$J(res,tbl1,tbl2,hdr,cond); // inner join
    res = outer$L(res,tbl1,tbl2,hdr,cond); // outer join: left
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⟕[${eval$str(cond)}] ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⟕[${eval$str(cond)}] ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
LEFT JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
ON ${eval$txt(cond)}  
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  function exec$rout(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = concat(tbl1.head, tbl2.head);
    disjoint(tbl1.head, tbl2.head, "⟖");
    res = inner$J(res,tbl1,tbl2,hdr,cond); // inner join
    res = outer$R(res,tbl1,tbl2,hdr,cond); // outer join: right
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⟖[${eval$str(cond)}] ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⟖[${eval$str(cond)}] ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
RIGHT JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
ON ${eval$txt(cond)}  
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  function exec$fout(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = concat(tbl1.head, tbl2.head);
    disjoint(tbl1.head, tbl2.head, "⟗");
    res = inner$J(res,tbl1,tbl2,hdr,cond); // inner join
    res = outer$L(res,tbl1,tbl2,hdr,cond); // outer join: left
    res = outer$R(res,tbl1,tbl2,hdr,cond); // outer join: right
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⟗[${eval$str(cond)}] ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⟗[${eval$str(cond)}] ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
FULL JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
ON ${eval$txt(cond)}  
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  
  function exec$lnout(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = natcat(tbl1.head, tbl2.head, tbl1.head, tbl2.head);
    res = inner$N(res,tbl1,tbl2,tbl1.head,tbl2.head);  // natural inner join
    res = outer$LN(res,tbl1,tbl2,tbl1.head,tbl2.head); // natural outer join: left
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⟕ ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⟕ ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
LEFT NATURAL JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  function exec$rnout(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = natcat(tbl1.head, tbl2.head, tbl1.head, tbl2.head);
    res = inner$N(res,tbl1,tbl2,tbl1.head,tbl2.head);  // natural inner join
    res = outer$RN(res,tbl1,tbl2,tbl1.head,tbl2.head); // natural outer join: right
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⟖ ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⟖ ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
RIGHT NATURAL JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  function exec$fnout(arg1, arg2, cond) {
    let tbl1 = arg1.rel, tbl2 = arg2.rel, res = [];
    let hdr  = natcat(tbl1.head, tbl2.head, tbl1.head, tbl2.head);
    res = inner$N(res,tbl1,tbl2,tbl1.head,tbl2.head);  // natural inner join
    res = outer$LN(res,tbl1,tbl2,tbl1.head,tbl2.head); // natural outer join: left
    res = outer$RN(res,tbl1,tbl2,tbl1.head,tbl2.head); // natural outer join: right
    let name = exec$name();
    return RET(
      REL(`${name} := ${name$num(tbl1.name)} ⟗ ${name$num(tbl2.name)}`, hdr, res),
      `(${arg1.norm} ⟗ ${arg2.norm})`,
      [arg1.tbl, arg2.tbl],
      `SELECT * FROM 
(
(
${IND(arg1.sql)} 
) AS _${arg1.name} 
FULL NATURAL JOIN 
(
${IND(arg2.sql)} 
) AS _${arg2.name} 
) AS ${name.slice(1)}`,
      name.slice(1)
    );
  }
  
  function exec$sel(cond, arg) {
    let tbl = arg.rel, res = [];
    for(let i=0; i<tbl.data.length; i++) {
      if(eval$sel(cond, tbl.data[i], tbl.head) === true) {
        res.push(tbl.data[i]);
      }
    }
    let name = exec$name();
    return RET(
      REL(`${name} := σ<sub>[${eval$str(cond)}]</sub>(${name$num(tbl.name)})`, tbl.head, res),
      `σ[${eval$str(cond)}](${arg.norm})`,
      [arg.tbl],
      `SELECT * FROM 
(
${IND(arg.sql)} 
) AS ${name.slice(1)} 
WHERE ${eval$txt(cond)} 
`,
      name.slice(1)
    );
  }
  function exec$proj(attr, arg) {
    let tbl = arg.rel, res = [];
    for(let i=0; i<tbl.data.length; i++) {
      res.push(eval$proj(attr, tbl.data[i], tbl.head));
    }
    let hdr = [];
    for(let i=0; i<attr.length; i++) {
      hdr.push(eval$find(attr[i], tbl.head, tbl.head, "%P"));
    }
    disjoint(hdr, [], "π");
    let name = exec$name();
    return RET(
      REL(`${name} := π<sub>[${attr.join(",")}]</sub>(${name$num(tbl.name)})`, hdr, res),
      `π[${attr.join(",")}](${arg.norm})`,
      [arg.tbl],
      `SELECT ${attr.join(", ")} FROM 
(
${IND(arg.sql)} 
) AS ${name.slice(1)} 
`,
      name.slice(1)
    );
  }
  function exec$ren(arrows, arg) {
    let tbl = arg.rel;
    let res = tbl.data;
    let hdr = eval$ren(arrows, [], tbl.head); // NOTE: dummy row to make the function has uniform signature
    let name = exec$name();
    let ren = [];
    for(let i=0; i<tbl.head.length; i++) {
      if(tbl.head[i] !== hdr[i]) {
        ren.push(`${tbl.head[i]} AS ${hdr[i]}`);
      } else {
        ren.push(`${tbl.head[i]}`);
      }
    }
    return RET(
      REL(`${name} := ρ<sub>[${eval$arr(arrows).join(",")}]</sub>(${name$num(tbl.name)})`, hdr, res),
      `ρ[${eval$arr(arrows).join(",")}](${arg.norm})`,
      [arg.tbl],
      `SELECT ${ren.join(", ")} FROM 
(
${IND(arg.sql)} 
) AS ${name.slice(1)} 
`,
      name.slice(1)
    );
  }
  function exec$table(name, tbls) {
    for(let i=tbls.length-1; i>=0; i--) {
      if(tbls[i].name === name) {
        return RET(tbls[i], name, [], `SELECT * FROM ${name}`, `_${name}`);
      }
    }
    throw ra$TableNotFound(name, "Table");
  }
  
  function exec(alg,tbls) {
    table$checks(tbls);
    num = 0;
    return exec$main(alg,tbls);
  }
  function exec$main(alg,tbls) {
    switch(alg.op) {
      case "\\/": // union
        return exec$cup (exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "/\\": // intersection
        return exec$cap (exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "-":   // difference
        return exec$diff(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "*":   // Cartesian join
        return exec$cart(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "#":   // natural join (inner)
        return exec$nat (exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "#j":  // inner join
        return exec$join(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls), alg.cond);
      case "#l":  // outer join: left
        return exec$lout(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls), alg.cond);
      case "#r":  // outer join: right
        return exec$rout(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls), alg.cond);
      case "#f":  // outer join: full
        return exec$fout(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls), alg.cond);
      case "#ln": // natural outer join: left
        return exec$lnout(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "#rn": // natural outer join: right
        return exec$rnout(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "#fn": // natural outer join: full
        return exec$fnout(exec$main(alg.l_arg, tbls), exec$main(alg.r_arg, tbls));
      case "%S":  // selection
        return exec$sel (alg.l_arg, exec$main(alg.r_arg, tbls));
      case "%P":  // projection
        return exec$proj(alg.l_arg, exec$main(alg.r_arg, tbls));
      case "%R":  // renaming
        return exec$ren (alg.l_arg, exec$main(alg.r_arg, tbls));
      case "%T":  // table
        return exec$table(alg.arg, tbls);
      default:    // ERROR
        throw ra$InvalidOperation(alg.op);
    }
  }
  function exec$str(alg) {
    switch(alg.op) {
      case "\\/": // union
        return `(${exec$str(alg.l_arg)} ∪ ${exec$str(alg.r_arg)})`;
      case "/\\": // intersection
        return `(${exec$str(alg.l_arg)} ∩ ${exec$str(alg.r_arg)})`;
      case "-":   // difference
        return `(${exec$str(alg.l_arg)} - ${exec$str(alg.r_arg)})`;
      case "*":   // Cartesian join
        return `(${exec$str(alg.l_arg)} × ${exec$str(alg.r_arg)})`;
      case "#":   // natural join (inner)
        return `(${exec$str(alg.l_arg)} ⋈ ${exec$str(alg.r_arg)})`;
      case "#j":  // inner join
        return `(${exec$str(alg.l_arg)} ⋈[${eval$str(alg.cond)}] ${exec$str(alg.r_arg)})`;
      case "#l":  // outer join: left
        return `(${exec$str(alg.l_arg)} ⟕[${eval$str(alg.cond)}] ${exec$str(alg.r_arg)})`;
      case "#r":  // outer join: right
        return `(${exec$str(alg.l_arg)} ⟖[${eval$str(alg.cond)}] ${exec$str(alg.r_arg)})`;
      case "#f":  // outer join: full
        return `(${exec$str(alg.l_arg)} ⟗[${eval$str(alg.cond)}] ${exec$str(alg.r_arg)})`;
      case "#ln": // natural outer join: left
        return `(${exec$str(alg.l_arg)} ⟕ ${exec$str(alg.r_arg)})`;
      case "#rn": // natural outer join: right
        return `(${exec$str(alg.l_arg)} ⟖ ${exec$str(alg.r_arg)})`;
      case "#fn": // natural outer join: full
        return `(${exec$str(alg.l_arg)} ⟗ ${exec$str(alg.r_arg)})`;
      case "%S":  // selection
        return `σ[${eval$str(alg.l_arg)}](${exec$str(alg.r_arg)})`;
      case "%P":  // projection
        return `π[${alg.l_arg.join(",")}](${exec$str(alg.r_arg)})`;
      case "%R":  // renaming
        return `ρ[${eval$arr(alg.l_arg).join(",")}](${exec$str(alg.r_arg)})`;
      case "%T":  // table
        return alg.arg;
      default:    // ERROR
        throw ra$InvalidOperation(alg.op);
    }
  }
  
  /** Common Evaluation **/
  function eval$arr(arrows) {
    let res = [];
    for(let i=0; i<arrows.length; i++) {
      res.push(`${arrows[i].o_name.val} ↤ ${arrows[i].n_name.val}`);
    }
    return res;
  }
  function eval$str(cond) {
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
        l_arg = eval$str(cond.l_arg);
        r_arg = eval$str(cond.r_arg);
        return `(${l_arg} ${STR[cond.op]} ${r_arg})`;
      case "~":   // not
        return `¬(${eval$str(cond.arg)})`;
      case "%c":  // constant
        switch(typeof(cond.val)) {
          case 'number': return `${cond.val}`;
          case 'string': return `'${cond.val}'`;
          case 'object': return "NULL";
        }
        throw ra$InvalidType(cond.val, cond.type, cond.op);
      case "%n":  // names
        return `${cond.val}`;
      default:    // ERROR
        throw ra$InvalidOperation(cond.op);
    }
  }
  function eval$txt(cond) {
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
        l_arg = eval$txt(cond.l_arg);
        r_arg = eval$txt(cond.r_arg);
        return `(${l_arg} ${TXT[cond.op]} ${r_arg})`;
      case "~":   // not
        return `¬(${eval$txt(cond.arg)})`;
      case "%c":  // constant
        switch(typeof(cond.val)) {
          case 'number': return `${cond.val}`;
          case 'string': return `'${cond.val}'`;
          case 'object': return "NULL";
        }
        throw ra$InvalidType(cond.val, cond.type, cond.op);
      case "%n":  // names
        return `${cond.val}`;
      default:    // ERROR
        throw ra$InvalidOperation(cond.op);
    }
  }
  function eval$find(name, row, head, op) {
    for(let i=0; i<head.length; i++) {
      if(head[i] === name) {
        return row[i];
      }
    }
    throw ra$ColumnNotFound(name,op);
  }
  
  /** Selection **/
  function eval$nat(row1, row2, hdr1, hdr2) {
    for(let i=0; i<hdr1.length; i++) {
      for(let j=0; j<hdr2.length; j++) {
        if(hdr1[i] === hdr2[j]) {
          let l_arg = eval$find(hdr1[i], row1, hdr1, "⋈");
          let r_arg = eval$find(hdr2[j], row2, hdr2, "⋈");
          if(l_arg === null || r_arg === null || l_arg !== r_arg) {
            return false;
          }
          break;
        }
      }
    }
    return true;
  }
  function eval$sel(cond, row, head) {
    let l_arg, r_arg, arg;
    switch(cond.op) {
      case "===": // NULL equality
      case "=/=": // NULL inequality
        l_arg = eval$sel(cond.l_arg, row, head);
        r_arg = eval$sel(cond.r_arg, row, head);
        return OP[cond.op](l_arg,r_arg);
      case "==":  // strict equality
      case "<>":  // strict inequality
      case "<=":  // less than or equal
      case ">=":  // greater than or equal
      case "<":   // less than
      case ">":   // greater than
        l_arg = eval$sel(cond.l_arg, row, head);
        r_arg = eval$sel(cond.r_arg, row, head);
        if(l_arg === null || r_arg === null) { return null; }
        if(typeof(l_arg) !== typeof(r_arg)) {
          throw ra$IncompatibleType(typeof(l_arg), typeof(r_arg), cond.op)
        }
        return OP[cond.op](l_arg,r_arg);
      case "~":   // not
        arg = eval$sel(cond.arg, row, head);
        if(arg === null) { return null; }
        return !arg;
      case "&":   // and
      case "|":   // or
        l_arg = eval$sel(cond.l_arg, row, head);
        r_arg = eval$sel(cond.r_arg, row, head);
        // if(l_arg === false || r_arg === false) { return false; }
        // if(l_arg === null  || r_arg === null ) { return null ; }
        return OP[cond.op](l_arg,r_arg);
      case "%c":  // constant
        return cond.val;
      case "%n":  // names
        return eval$find(cond.val, row, head, "%S")
      default:    // ERROR
        throw ra$InvalidOperation(cond.op);
    }
  }
  
  /** Projection **/
  function eval$proj(attr, row, head) {
    let res = [];
    for(let i=0; i<attr.length; i++) {
      res.push(eval$find(attr[i], row, head, "%T"));
    }
    return res;
  }
  
  /** Renaming **/
  function eval$ren(arrows, row, head) {
    let res = [];
    for(let i=0; i<head.length; i++) {
      let found = false;
      for(let j=0; j<arrows.length; j++) {
        if(head[i] === arrows[j].o_name.val) {
          res.push(arrows[j].n_name.val);
          found = true;
          break;
        }
      }
      if(!found) {
        res.push(head[i]);
      }
    }
    return res;
  }

  return {
    exec: exec,
    str : exec$str,
  };
})();
