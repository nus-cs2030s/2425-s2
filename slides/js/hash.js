function _h(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  if (hash < 0) {
    hash = -hash;
  }
  return hash.toString(16);
}
function _m(e) {
  console.log(e);
  if (e.ctrlKey && e.key=='Home' && window.location.toString().indexOf(_h(omd+".md"))==-1) {
    window.location.replace(`${omd}.html?src=${_h(omd+".md")}`);
  }
}