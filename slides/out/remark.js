require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],3:[function(require,module,exports){
(function (global){(function (){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = escape(
          cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1])
        );
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0]
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2].trim(), true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.text(escape(this.smartypants(cap[0])));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return '';
    }
  }
  if (this.options.baseUrl && !originIndependentUrl.test(href)) {
    href = resolveUrl(this.options.baseUrl, href);
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  if (this.options.baseUrl && !originIndependentUrl.test(href)) {
    href = resolveUrl(this.options.baseUrl, href);
  }
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
	// explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (/^[^:]+:\/*[^/]*$/.test(base)) {
      baseUrls[' ' + base] = base + '/';
    } else {
      baseUrls[' ' + base] = base.replace(/[^/]*$/, '');
    }
  }
  base = baseUrls[' ' + base];

  if (href.slice(0, 2) === '//') {
    return base.replace(/:[^]*/, ':') + href;
  } else if (href.charAt(0) === '/') {
    return base.replace(/(:\/*[^/]*)[^]*/, '$1') + href;
  } else {
    return base + href;
  }
}
baseUrls = {};
originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  sanitizer: null,
  mangle: true,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false,
  baseUrl: null
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
exports.apply = function () {
  forEach([Array, window.NodeList, window.HTMLCollection], extend);
};

function forEach (list, f) {
  var i;

  for (i = 0; i < list.length; ++i) {
    f(list[i], i);
  }
}

function extend (object) {
  var prototype = object && object.prototype;

  if (!prototype) {
    return;
  }

  prototype.forEach = prototype.forEach || function (f) {
    forEach(this, f);
  };

  prototype.filter = prototype.filter || function (f) {
    var result = [];

    this.forEach(function (element) {
      if (f(element, result.length)) {
        result.push(element);
      }
    });

    return result;
  };

  prototype.map = prototype.map || function (f) {
    var result = [];

    this.forEach(function (element) {
      result.push(f(element, result.length));
    });

    return result;
  };
}
},{}],5:[function(require,module,exports){
var Api = require('./remark/api')
  , polyfills = require('./polyfills')
  , styler = require('./remark/components/styler/styler')
  ;

// Expose API as `remark`
window.remark = new Api();

// Apply polyfills as needed
polyfills.apply();

// Apply embedded styles to document
styler.styleDocument();

},{"./polyfills":4,"./remark/api":6,"./remark/components/styler/styler":"components/styler"}],6:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
  , highlighter = require('./highlighter')
  , converter = require('./converter')
  , resources = require('./resources')
  , Parser = require('./parser')
  , Slideshow = require('./models/slideshow')
  , SlideshowView = require('./views/slideshowView')
  , DefaultController = require('./controllers/defaultController')
  , Dom = require('./dom')
  , macros = require('./macros')
  ;

module.exports = Api;

function Api (dom) {
  this.dom = dom || new Dom();
  this.macros = macros;
  this.version = resources.version;
  this.plugins = [];
}

// Expose highlighter to allow enumerating available styles and
// including external language grammars
Api.prototype.highlighter = highlighter;

Api.prototype.convert = function (markdown) {
  var parser = new Parser()
    , content = parser.parse(markdown || '', macros)[0].content
    ;

  return converter.convertMarkdown(content, {}, true);
};

// Register plugins
Api.prototype.register = function(init) {
  var self = this;
  self.plugins.push(init);
};

// Creates slideshow initialized from options
Api.prototype.create = function (options, callback) {
  var self = this
    , events
    , slideshow
    , slideshowView
    , controller
    , plugIndex
    ;

  options = applyDefaults(this.dom, options);

  events = new EventEmitter();
  events.setMaxListeners(0);

  slideshow = new Slideshow(events, this.dom, options, function (slideshow) {
    slideshowView = new SlideshowView(events, self.dom, options, slideshow);
    controller = options.controller || new DefaultController(events, self.dom, slideshowView, options.navigation);
    if (typeof callback === 'function') {
      callback(slideshow, options);
    }
  
    for(plugIndex=0; plugIndex<self.plugins.length; plugIndex++) {
      self.plugins[plugIndex](options, slideshow);
    }
  });

  return slideshow;
};

function applyDefaults (dom, options) {
  var sourceElement;

  options = options || {};

  if (!options.hasOwnProperty('source')) {
    sourceElement = dom.getElementById('source');
    if (sourceElement) {
      options.source = unescape(sourceElement.innerHTML);
      sourceElement.style.display = 'none';
    }
  }

  if (!(options.container instanceof window.HTMLElement)) {
    options.container = dom.getBodyElement();
  }

  return options;
}

function unescape (source) {
  source = source.replace(/&[l|g]t;/g,
    function (match) {
      return match === '&lt;' ? '<' : '>';
    });

  source = source.replace(/&amp;/g, '&');
  source = source.replace(/&quot;/g, '"');

  return source;
}

},{"./controllers/defaultController":7,"./converter":13,"./dom":14,"./highlighter":15,"./macros":17,"./models/slideshow":19,"./parser":22,"./resources":23,"./views/slideshowView":28,"events":1}],7:[function(require,module,exports){
// Allow override of global `location`
/* global location:true */

module.exports = Controller;

var Keyboard = require('./inputs/keyboard')
  , mouse = require('./inputs/mouse')
  , touch = require('./inputs/touch')
  , message = require('./inputs/message')
  , location = require('./inputs/location')
  ;

function Controller (events, dom, slideshowView, options) {
  options = options || {};

  var keyboard = new Keyboard(events);

  message.register(events);
  location.register(events, dom, slideshowView);
  mouse.register(events, options);
  touch.register(events, options);

  addApiEventListeners(events, keyboard, slideshowView, options);
}

function addApiEventListeners (events, keyboard, slideshowView, options) {
  events.on('pause', function(event) {
    keyboard.deactivate();
    mouse.unregister(events);
    touch.unregister(events);
  });

  events.on('resume',  function(event) {
    keyboard.activate();
    mouse.register(events, options);
    touch.register(events, options);
  });
}
},{"./inputs/keyboard":8,"./inputs/location":9,"./inputs/message":10,"./inputs/mouse":11,"./inputs/touch":12}],8:[function(require,module,exports){
module.exports = Keyboard;

function Keyboard(events) {
  this._events = events;

  this.activate();
}

Keyboard.prototype.activate = function () {
  this._gotoSlideNumber = '';

  this.addKeyboardEventListeners();
};

Keyboard.prototype.deactivate = function () {
  this.removeKeyboardEventListeners();
};

Keyboard.prototype.addKeyboardEventListeners = function () {
  var self = this;
  var events = this._events;

  events.on('keydown', function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      // Bail out if alt, meta or ctrl key was pressed
      return;
    }

    switch (event.keyCode) {
      case 33: // Page up
      case 37: // Left
      case 38: // Up
        events.emit('gotoPreviousSlide');
        break;
      case 32: // Space
        if(event.shiftKey){ // Shift+Space
          events.emit('gotoPreviousSlide');
        }else{
          events.emit('gotoNextSlide');
        }
        break;
      case 34: // Page down
      case 39: // Right
      case 40: // Down
        events.emit('gotoNextSlide');
        break;
      case 36: // Home
        events.emit('gotoFirstSlide');
        break;
      case 35: // End
        events.emit('gotoLastSlide');
        break;
      case 27: // Escape
        events.emit('hideOverlay');
        break;
      case 13: // Return
        if (self._gotoSlideNumber) {
          events.emit('gotoSlideNumber', self._gotoSlideNumber);
          self._gotoSlideNumber = '';
        }
        break;
    }
  });

  events.on('keypress', function (event) {
    if (event.metaKey || event.ctrlKey) {
      // Bail out if meta or ctrl key was pressed
      return;
    }

    var key = String.fromCharCode(event.which).toLowerCase();
    var tryToPreventDefault = false;

    switch (key) {
      case 'j':
        events.emit('gotoNextSlide');
        break;
      case 'k':
        events.emit('gotoPreviousSlide');
        break;
      case 'b':
        events.emit('toggleBlackout');
        break;
      case 'm':
        events.emit('toggleMirrored');
        break;
      case 'c':
        events.emit('createClone');
        break;
      case 'p':
        events.emit('togglePresenterMode');
        break;
      case 'f':
        events.emit('toggleFullscreen');
        break;
      case 's':
        events.emit('toggleTimer');
        break;
      case 't':
        events.emit('resetTimer');
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0':
        self._gotoSlideNumber += key;
        break;
      case 'h':
      case '?':
        events.emit('toggleHelp');
        break;
      default:
        tryToPreventDefault = false;
    }

    if (tryToPreventDefault && event && event.preventDefault)
      event.preventDefault();

  });
};

Keyboard.prototype.removeKeyboardEventListeners = function () {
  var events = this._events;

  events.removeAllListeners("keydown");
  events.removeAllListeners("keypress");
};

},{}],9:[function(require,module,exports){
var utils = require('../../utils.js');

exports.register = function (events, dom, slideshowView) {
  addLocationEventListeners(events, dom, slideshowView);
};

function addLocationEventListeners (events, dom, slideshowView) {
  // If slideshow is embedded into custom DOM element, we don't
  // hook up to location hash changes, so just go to first slide.
  if (slideshowView.isEmbedded()) {
    events.emit('gotoSlide', 1);
  }
  // When slideshow is not embedded into custom DOM element, but
  // rather hosted directly inside document.body, we hook up to
  // location hash changes, and trigger initial navigation.
  else {
    events.on('hashchange', navigateByHash);
    events.on('slideChanged', updateHash);
    events.on('toggledPresenter', updateHash);

    navigateByHash();
  }

  function navigateByHash () {
    var slideNoOrName = (dom.getLocationHash() || '').substr(1);
    events.emit('gotoSlide', slideNoOrName);
  }

  function updateHash (slideNoOrName) {
    if(utils.hasClass(slideshowView.containerElement, 'remark-presenter-mode')){
      dom.setLocationHash('#p' + slideNoOrName);
    }
    else{
      dom.setLocationHash('#' + slideNoOrName);
    }
  }
}

},{"../../utils.js":25}],10:[function(require,module,exports){
exports.register = function (events) {
  addMessageEventListeners(events);
};

function addMessageEventListeners (events) {
  events.on('message', navigateByMessage);

  function navigateByMessage(message) {
    var cap;

    if ((cap = /^gotoSlide:(\d+)$/.exec(message.data)) !== null) {
      events.emit('gotoSlide', parseInt(cap[1], 10), true);
    }
    else if (message.data === 'toggleBlackout') {
      events.emit('toggleBlackout', {propagate: false});
    }
  }
}

},{}],11:[function(require,module,exports){
exports.register = function (events, options) {
  addMouseEventListeners(events, options);
};

exports.unregister = function (events) {
  removeMouseEventListeners(events);
};

function addMouseEventListeners (events, options) {
  if (options.click) {
    events.on('click', function (event) {
      if (event.target.nodeName === 'A') {
        // Don't interfere when clicking link
        return;
      }
      else if (event.button === 0) {
        events.emit('gotoNextSlide');
      }
    });
    events.on('contextmenu', function (event) {
      if (event.target.nodeName === 'A') {
        // Don't interfere when right-clicking link
        return;
      }
      event.preventDefault();
      events.emit('gotoPreviousSlide');
    });
  }

  if (options.scroll !== false) {
    var scrollHandler = function (event) {
      if (event.wheelDeltaY > 0 || event.detail < 0) {
        events.emit('gotoPreviousSlide');
      }
      else if (event.wheelDeltaY < 0 || event.detail > 0) {
        events.emit('gotoNextSlide');
      }
    };

    // IE9, Chrome, Safari, Opera
    events.on('mousewheel', scrollHandler);
    // Firefox
    events.on('DOMMouseScroll', scrollHandler);
  }
}

function removeMouseEventListeners(events) {
  events.removeAllListeners('click');
  events.removeAllListeners('contextmenu');
  events.removeAllListeners('mousewheel');
}

},{}],12:[function(require,module,exports){
exports.register = function (events, options) {
  addTouchEventListeners(events, options);
};

exports.unregister = function (events) {
  removeTouchEventListeners(events);
};

function addTouchEventListeners (events, options) {
  var touch
    , startX
    , endX
    ;

  if (options.touch === false) {
    return;
  }

  var isTap = function () {
    return Math.abs(startX - endX) < 10;
  };

  var handleTap = function () {
    events.emit('tap', endX);
  };

  var handleSwipe = function () {
    if (startX > endX) {
      events.emit('gotoNextSlide');
    }
    else {
      events.emit('gotoPreviousSlide');
    }
  };

  events.on('touchstart', function (event) {
    touch = event.touches[0];
    startX = touch.clientX;
  });

  events.on('touchend', function (event) {
    if (event.target.nodeName.toUpperCase() === 'A') {
      return;
    }

    touch = event.changedTouches[0];
    endX = touch.clientX;

    if (isTap()) {
      handleTap();
    }
    else {
      handleSwipe();
    }
  });

  events.on('touchmove', function (event) {
    event.preventDefault();
  });
}

function removeTouchEventListeners(events) {
  events.removeAllListeners("touchstart");
  events.removeAllListeners("touchend");
  events.removeAllListeners("touchmove");
}

},{}],13:[function(require,module,exports){
var marked = require('marked')
  , converter = module.exports = {}
  , element = document.createElement('div')
  ;

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,

  // Without this set to true, converting something like
  // <p>*</p><p>*</p> will become <p><em></p><p></em></p>
  pedantic: true,

  sanitize: false,
  smartLists: true,
  langPrefix: ''
});

converter.convertMarkdown = function (content, links, inline) {
  element.innerHTML = convertMarkdown(content, links || {}, inline);
  element.innerHTML = element.innerHTML.replace(/<p>\s*<\/p>/g, '');
  return element.innerHTML.replace(/\n\r?$/, '');
};

function convertMarkdown (content, links, insideContentClass) {
  var i, tag, markdown = '', html;

  for (i = 0; i < content.length; ++i) {
    if (typeof content[i] === 'string') {
      markdown += content[i];
    }
    else {
      tag = content[i].block ? 'div' : 'span';
      markdown += '<' + tag + ' class="' + content[i].class + '">';
      markdown += convertMarkdown(content[i].content, links, !content[i].block);
      markdown += '</' + tag + '>';
    }
  }

  var tokens = marked.Lexer.lex(markdown.replace(/^\s+/, ''));
  tokens.links = links;
  html = marked.Parser.parse(tokens);

  if (insideContentClass) {
    element.innerHTML = html;
    if (element.children.length === 1 && element.children[0].tagName === 'P') {
      html = element.children[0].innerHTML;
    }
  }

  return html;
}

},{"marked":3}],14:[function(require,module,exports){
module.exports = Dom;

function Dom () { }

Dom.prototype.XMLHttpRequest = XMLHttpRequest;

Dom.prototype.getHTMLElement = function () {
  return document.getElementsByTagName('html')[0];
};

Dom.prototype.getBodyElement = function () {
  return document.body;
};

Dom.prototype.getElementById = function (id) {
  return document.getElementById(id);
};

Dom.prototype.getElementsByClassName = function (kls) {
  return document.getElementsByClassName(kls);
};

Dom.prototype.getLocationHash = function () {
  return window.location.hash;
};

Dom.prototype.setLocationHash = function (hash) {
  if (typeof window.history.replaceState === 'function' && window.origin !== 'null') {
    window.history.replaceState(undefined, undefined, hash);
  }
  else {
    window.location.hash = hash;
  }
};

},{}],15:[function(require,module,exports){
/* Automatically generated */

var hljs = (function() {
      var exports = {};
      /*
Syntax highlighting with language autodetection.
https://highlightjs.org/
*/

(function(factory) {

  // Find the global object for export to both the browser and web workers.
  var globalObject = typeof window === 'object' && window ||
                     typeof self === 'object' && self;

  // Setup highlight.js for different environments. First is Node.js or
  // CommonJS.
  // `nodeType` is checked to ensure that `exports` is not a HTML element.
  if(typeof exports !== 'undefined' && !exports.nodeType) {
    factory(exports);
  } else if(globalObject) {
    // Export hljs globally even when using AMD for cases when this script
    // is loaded with others that may still expect a global hljs.
    globalObject.hljs = factory({});

    // Finally register the global hljs with AMD.
    if(typeof define === 'function' && define.amd) {
      define([], function() {
        return globalObject.hljs;
      });
    }
  }

}(function(hljs) {
  // Convenience variables for build-in objects
  var ArrayProto = [],
      objectKeys = Object.keys;

  // Global internal variables used within the highlight.js library.
  var languages = {},
      aliases   = {};

  // Regular expressions used throughout the highlight.js library.
  var noHighlightRe    = /^(no-?highlight|plain|text)$/i,
      languagePrefixRe = /\blang(?:uage)?-([\w-]+)\b/i,
      fixMarkupRe      = /((^(<[^>]+>|\t|)+|(?:\n)))/gm;

  // The object will be assigned by the build tool. It used to synchronize API 
  // of external language files with minified version of the highlight.js library.
  var API_REPLACES;

  var spanEndTag = '</span>';

  // Global options used when within external APIs. This is modified when
  // calling the `hljs.configure` function.
  var options = {
    classPrefix: 'hljs-',
    tabReplace: null,
    useBR: false,
    languages: undefined
  };


  /* Utility functions */

  function escape(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function tag(node) {
    return node.nodeName.toLowerCase();
  }

  function testRe(re, lexeme) {
    var match = re && re.exec(lexeme);
    return match && match.index === 0;
  }

  function isNotHighlighted(language) {
    return noHighlightRe.test(language);
  }

  function blockLanguage(block) {
    var i, match, length, _class;
    var classes = block.className + ' ';

    classes += block.parentNode ? block.parentNode.className : '';

    // language-* takes precedence over non-prefixed class names.
    match = languagePrefixRe.exec(classes);
    if (match) {
      return getLanguage(match[1]) ? match[1] : 'no-highlight';
    }

    classes = classes.split(/\s+/);

    for (i = 0, length = classes.length; i < length; i++) {
      _class = classes[i];

      if (isNotHighlighted(_class) || getLanguage(_class)) {
        return _class;
      }
    }
  }

  function inherit(parent) {  // inherit(parent, override_obj, override_obj, ...)
    var key;
    var result = {};
    var objects = Array.prototype.slice.call(arguments, 1);

    for (key in parent)
      result[key] = parent[key];
    objects.forEach(function(obj) {
      for (key in obj)
        result[key] = obj[key];
    });
    return result;
  }

  /* Stream merging */

  function nodeStream(node) {
    var result = [];
    (function _nodeStream(node, offset) {
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3)
          offset += child.nodeValue.length;
        else if (child.nodeType === 1) {
          result.push({
            event: 'start',
            offset: offset,
            node: child
          });
          offset = _nodeStream(child, offset);
          // Prevent void elements from having an end tag that would actually
          // double them in the output. There are more void elements in HTML
          // but we list only those realistically expected in code display.
          if (!tag(child).match(/br|hr|img|input/)) {
            result.push({
              event: 'stop',
              offset: offset,
              node: child
            });
          }
        }
      }
      return offset;
    })(node, 0);
    return result;
  }

  function mergeStreams(original, highlighted, value) {
    var processed = 0;
    var result = '';
    var nodeStack = [];

    function selectStream() {
      if (!original.length || !highlighted.length) {
        return original.length ? original : highlighted;
      }
      if (original[0].offset !== highlighted[0].offset) {
        return (original[0].offset < highlighted[0].offset) ? original : highlighted;
      }

      /*
      To avoid starting the stream just before it should stop the order is
      ensured that original always starts first and closes last:

      if (event1 == 'start' && event2 == 'start')
        return original;
      if (event1 == 'start' && event2 == 'stop')
        return highlighted;
      if (event1 == 'stop' && event2 == 'start')
        return original;
      if (event1 == 'stop' && event2 == 'stop')
        return highlighted;

      ... which is collapsed to:
      */
      return highlighted[0].event === 'start' ? original : highlighted;
    }

    function open(node) {
      function attr_str(a) {return ' ' + a.nodeName + '="' + escape(a.value).replace('"', '&quot;') + '"';}
      result += '<' + tag(node) + ArrayProto.map.call(node.attributes, attr_str).join('') + '>';
    }

    function close(node) {
      result += '</' + tag(node) + '>';
    }

    function render(event) {
      (event.event === 'start' ? open : close)(event.node);
    }

    while (original.length || highlighted.length) {
      var stream = selectStream();
      result += escape(value.substring(processed, stream[0].offset));
      processed = stream[0].offset;
      if (stream === original) {
        /*
        On any opening or closing tag of the original markup we first close
        the entire highlighted node stack, then render the original tag along
        with all the following original tags at the same offset and then
        reopen all the tags on the highlighted stack.
        */
        nodeStack.reverse().forEach(close);
        do {
          render(stream.splice(0, 1)[0]);
          stream = selectStream();
        } while (stream === original && stream.length && stream[0].offset === processed);
        nodeStack.reverse().forEach(open);
      } else {
        if (stream[0].event === 'start') {
          nodeStack.push(stream[0].node);
        } else {
          nodeStack.pop();
        }
        render(stream.splice(0, 1)[0]);
      }
    }
    return result + escape(value.substr(processed));
  }

  /* Initialization */

  function expand_mode(mode) {
    if (mode.variants && !mode.cached_variants) {
      mode.cached_variants = mode.variants.map(function(variant) {
        return inherit(mode, {variants: null}, variant);
      });
    }
    return mode.cached_variants || (mode.endsWithParent && [inherit(mode)]) || [mode];
  }

  function restoreLanguageApi(obj) {
    if(API_REPLACES && !obj.langApiRestored) {
      obj.langApiRestored = true;
      for(var key in API_REPLACES)
        obj[key] && (obj[API_REPLACES[key]] = obj[key]);
      (obj.contains || []).concat(obj.variants || []).forEach(restoreLanguageApi);
    }
  }

  function compileLanguage(language) {

    function reStr(re) {
        return (re && re.source) || re;
    }

    function langRe(value, global) {
      return new RegExp(
        reStr(value),
        'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '')
      );
    }

    // joinRe logically computes regexps.join(separator), but fixes the
    // backreferences so they continue to match.
    function joinRe(regexps, separator) {
      // backreferenceRe matches an open parenthesis or backreference. To avoid
      // an incorrect parse, it additionally matches the following:
      // - [...] elements, where the meaning of parentheses and escapes change
      // - other escape sequences, so we do not misparse escape sequences as
      //   interesting elements
      // - non-matching or lookahead parentheses, which do not capture. These
      //   follow the '(' with a '?'.
      var backreferenceRe = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
      var numCaptures = 0;
      var ret = '';
      for (var i = 0; i < regexps.length; i++) {
        var offset = numCaptures;
        var re = reStr(regexps[i]);
        if (i > 0) {
          ret += separator;
        }
        while (re.length > 0) {
          var match = backreferenceRe.exec(re);
          if (match == null) {
            ret += re;
            break;
          }
          ret += re.substring(0, match.index);
          re = re.substring(match.index + match[0].length);
          if (match[0][0] == '\\' && match[1]) {
            // Adjust the backreference.
            ret += '\\' + String(Number(match[1]) + offset);
          } else {
            ret += match[0];
            if (match[0] == '(') {
              numCaptures++;
            }
          }
        }
      }
      return ret;
    }

    function compileMode(mode, parent) {
      if (mode.compiled)
        return;
      mode.compiled = true;

      mode.keywords = mode.keywords || mode.beginKeywords;
      if (mode.keywords) {
        var compiled_keywords = {};

        var flatten = function(className, str) {
          if (language.case_insensitive) {
            str = str.toLowerCase();
          }
          str.split(' ').forEach(function(kw) {
            var pair = kw.split('|');
            compiled_keywords[pair[0]] = [className, pair[1] ? Number(pair[1]) : 1];
          });
        };

        if (typeof mode.keywords === 'string') { // string
          flatten('keyword', mode.keywords);
        } else {
          objectKeys(mode.keywords).forEach(function (className) {
            flatten(className, mode.keywords[className]);
          });
        }
        mode.keywords = compiled_keywords;
      }
      mode.lexemesRe = langRe(mode.lexemes || /\w+/, true);

      if (parent) {
        if (mode.beginKeywords) {
          mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')\\b';
        }
        if (!mode.begin)
          mode.begin = /\B|\b/;
        mode.beginRe = langRe(mode.begin);
        if (mode.endSameAsBegin)
          mode.end = mode.begin;
        if (!mode.end && !mode.endsWithParent)
          mode.end = /\B|\b/;
        if (mode.end)
          mode.endRe = langRe(mode.end);
        mode.terminator_end = reStr(mode.end) || '';
        if (mode.endsWithParent && parent.terminator_end)
          mode.terminator_end += (mode.end ? '|' : '') + parent.terminator_end;
      }
      if (mode.illegal)
        mode.illegalRe = langRe(mode.illegal);
      if (mode.relevance == null)
        mode.relevance = 1;
      if (!mode.contains) {
        mode.contains = [];
      }
      mode.contains = Array.prototype.concat.apply([], mode.contains.map(function(c) {
        return expand_mode(c === 'self' ? mode : c);
      }));
      mode.contains.forEach(function(c) {compileMode(c, mode);});

      if (mode.starts) {
        compileMode(mode.starts, parent);
      }

      var terminators =
        mode.contains.map(function(c) {
          return c.beginKeywords ? '\\.?(?:' + c.begin + ')\\.?' : c.begin;
        })
        .concat([mode.terminator_end, mode.illegal])
        .map(reStr)
        .filter(Boolean);
      mode.terminators = terminators.length ? langRe(joinRe(terminators, '|'), true) : {exec: function(/*s*/) {return null;}};
    }
    
    compileMode(language);
  }

  /*
  Core highlighting function. Accepts a language name, or an alias, and a
  string with the code to highlight. Returns an object with the following
  properties:

  - relevance (int)
  - value (an HTML string with highlighting markup)

  */
  function highlight(name, value, ignore_illegals, continuation) {

    function escapeRe(value) {
      return new RegExp(value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'm');
    }

    function subMode(lexeme, mode) {
      var i, length;

      for (i = 0, length = mode.contains.length; i < length; i++) {
        if (testRe(mode.contains[i].beginRe, lexeme)) {
          if (mode.contains[i].endSameAsBegin) {
            mode.contains[i].endRe = escapeRe( mode.contains[i].beginRe.exec(lexeme)[0] );
          }
          return mode.contains[i];
        }
      }
    }

    function endOfMode(mode, lexeme) {
      if (testRe(mode.endRe, lexeme)) {
        while (mode.endsParent && mode.parent) {
          mode = mode.parent;
        }
        return mode;
      }
      if (mode.endsWithParent) {
        return endOfMode(mode.parent, lexeme);
      }
    }

    function isIllegal(lexeme, mode) {
      return !ignore_illegals && testRe(mode.illegalRe, lexeme);
    }

    function keywordMatch(mode, match) {
      var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
      return mode.keywords.hasOwnProperty(match_str) && mode.keywords[match_str];
    }

    function buildSpan(classname, insideSpan, leaveOpen, noPrefix) {
      var classPrefix = noPrefix ? '' : options.classPrefix,
          openSpan    = '<span class="' + classPrefix,
          closeSpan   = leaveOpen ? '' : spanEndTag;

      openSpan += classname + '">';

      if (!classname) return insideSpan;
      return openSpan + insideSpan + closeSpan;
    }

    function processKeywords() {
      var keyword_match, last_index, match, result;

      if (!top.keywords)
        return escape(mode_buffer);

      result = '';
      last_index = 0;
      top.lexemesRe.lastIndex = 0;
      match = top.lexemesRe.exec(mode_buffer);

      while (match) {
        result += escape(mode_buffer.substring(last_index, match.index));
        keyword_match = keywordMatch(top, match);
        if (keyword_match) {
          relevance += keyword_match[1];
          result += buildSpan(keyword_match[0], escape(match[0]));
        } else {
          result += escape(match[0]);
        }
        last_index = top.lexemesRe.lastIndex;
        match = top.lexemesRe.exec(mode_buffer);
      }
      return result + escape(mode_buffer.substr(last_index));
    }

    function processSubLanguage() {
      var explicit = typeof top.subLanguage === 'string';
      if (explicit && !languages[top.subLanguage]) {
        return escape(mode_buffer);
      }

      var result = explicit ?
                   highlight(top.subLanguage, mode_buffer, true, continuations[top.subLanguage]) :
                   highlightAuto(mode_buffer, top.subLanguage.length ? top.subLanguage : undefined);

      // Counting embedded language score towards the host language may be disabled
      // with zeroing the containing mode relevance. Usecase in point is Markdown that
      // allows XML everywhere and makes every XML snippet to have a much larger Markdown
      // score.
      if (top.relevance > 0) {
        relevance += result.relevance;
      }
      if (explicit) {
        continuations[top.subLanguage] = result.top;
      }
      return buildSpan(result.language, result.value, false, true);
    }

    function processBuffer() {
      result += (top.subLanguage != null ? processSubLanguage() : processKeywords());
      mode_buffer = '';
    }

    function startNewMode(mode) {
      result += mode.className? buildSpan(mode.className, '', true): '';
      top = Object.create(mode, {parent: {value: top}});
    }

    function processLexeme(buffer, lexeme) {

      mode_buffer += buffer;

      if (lexeme == null) {
        processBuffer();
        return 0;
      }

      var new_mode = subMode(lexeme, top);
      if (new_mode) {
        if (new_mode.skip) {
          mode_buffer += lexeme;
        } else {
          if (new_mode.excludeBegin) {
            mode_buffer += lexeme;
          }
          processBuffer();
          if (!new_mode.returnBegin && !new_mode.excludeBegin) {
            mode_buffer = lexeme;
          }
        }
        startNewMode(new_mode, lexeme);
        return new_mode.returnBegin ? 0 : lexeme.length;
      }

      var end_mode = endOfMode(top, lexeme);
      if (end_mode) {
        var origin = top;
        if (origin.skip) {
          mode_buffer += lexeme;
        } else {
          if (!(origin.returnEnd || origin.excludeEnd)) {
            mode_buffer += lexeme;
          }
          processBuffer();
          if (origin.excludeEnd) {
            mode_buffer = lexeme;
          }
        }
        do {
          if (top.className) {
            result += spanEndTag;
          }
          if (!top.skip && !top.subLanguage) {
            relevance += top.relevance;
          }
          top = top.parent;
        } while (top !== end_mode.parent);
        if (end_mode.starts) {
          if (end_mode.endSameAsBegin) {
            end_mode.starts.endRe = end_mode.endRe;
          }
          startNewMode(end_mode.starts, '');
        }
        return origin.returnEnd ? 0 : lexeme.length;
      }

      if (isIllegal(lexeme, top))
        throw new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');

      /*
      Parser should not reach this point as all types of lexemes should be caught
      earlier, but if it does due to some bug make sure it advances at least one
      character forward to prevent infinite looping.
      */
      mode_buffer += lexeme;
      return lexeme.length || 1;
    }

    var language = getLanguage(name);
    if (!language) {
      throw new Error('Unknown language: "' + name + '"');
    }

    compileLanguage(language);
    var top = continuation || language;
    var continuations = {}; // keep continuations for sub-languages
    var result = '', current;
    for(current = top; current !== language; current = current.parent) {
      if (current.className) {
        result = buildSpan(current.className, '', true) + result;
      }
    }
    var mode_buffer = '';
    var relevance = 0;
    try {
      var match, count, index = 0;
      while (true) {
        top.terminators.lastIndex = index;
        match = top.terminators.exec(value);
        if (!match)
          break;
        count = processLexeme(value.substring(index, match.index), match[0]);
        index = match.index + count;
      }
      processLexeme(value.substr(index));
      for(current = top; current.parent; current = current.parent) { // close dangling modes
        if (current.className) {
          result += spanEndTag;
        }
      }
      return {
        relevance: relevance,
        value: result,
        language: name,
        top: top
      };
    } catch (e) {
      if (e.message && e.message.indexOf('Illegal') !== -1) {
        return {
          relevance: 0,
          value: escape(value)
        };
      } else {
        throw e;
      }
    }
  }

  /*
  Highlighting with language detection. Accepts a string with the code to
  highlight. Returns an object with the following properties:

  - language (detected language)
  - relevance (int)
  - value (an HTML string with highlighting markup)
  - second_best (object with the same structure for second-best heuristically
    detected language, may be absent)

  */
  function highlightAuto(text, languageSubset) {
    languageSubset = languageSubset || options.languages || objectKeys(languages);
    var result = {
      relevance: 0,
      value: escape(text)
    };
    var second_best = result;
    languageSubset.filter(getLanguage).filter(autoDetection).forEach(function(name) {
      var current = highlight(name, text, false);
      current.language = name;
      if (current.relevance > second_best.relevance) {
        second_best = current;
      }
      if (current.relevance > result.relevance) {
        second_best = result;
        result = current;
      }
    });
    if (second_best.language) {
      result.second_best = second_best;
    }
    return result;
  }

  /*
  Post-processing of the highlighted markup:

  - replace TABs with something more useful
  - replace real line-breaks with '<br>' for non-pre containers

  */
  function fixMarkup(value) {
    return !(options.tabReplace || options.useBR)
      ? value
      : value.replace(fixMarkupRe, function(match, p1) {
          if (options.useBR && match === '\n') {
            return '<br>';
          } else if (options.tabReplace) {
            return p1.replace(/\t/g, options.tabReplace);
          }
          return '';
      });
  }

  function buildClassName(prevClassName, currentLang, resultLang) {
    var language = currentLang ? aliases[currentLang] : resultLang,
        result   = [prevClassName.trim()];

    if (!prevClassName.match(/\bhljs\b/)) {
      result.push('hljs');
    }

    if (prevClassName.indexOf(language) === -1) {
      result.push(language);
    }

    return result.join(' ').trim();
  }

  /*
  Applies highlighting to a DOM node containing code. Accepts a DOM node and
  two optional parameters for fixMarkup.
  */
  function highlightBlock(block) {
    var node, originalStream, result, resultNode, text;
    var language = blockLanguage(block);

    if (isNotHighlighted(language))
        return;

    if (options.useBR) {
      node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      node.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ \/]*>/g, '\n');
    } else {
      node = block;
    }
    text = node.textContent;
    result = language ? highlight(language, text, true) : highlightAuto(text);

    originalStream = nodeStream(node);
    if (originalStream.length) {
      resultNode = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      resultNode.innerHTML = result.value;
      result.value = mergeStreams(originalStream, nodeStream(resultNode), text);
    }
    result.value = fixMarkup(result.value);

    block.innerHTML = result.value;
    block.className = buildClassName(block.className, language, result.language);
    block.result = {
      language: result.language,
      re: result.relevance
    };
    if (result.second_best) {
      block.second_best = {
        language: result.second_best.language,
        re: result.second_best.relevance
      };
    }
  }

  /*
  Updates highlight.js global options with values passed in the form of an object.
  */
  function configure(user_options) {
    options = inherit(options, user_options);
  }

  /*
  Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
  */
  function initHighlighting() {
    if (initHighlighting.called)
      return;
    initHighlighting.called = true;

    var blocks = document.querySelectorAll('pre code');
    ArrayProto.forEach.call(blocks, highlightBlock);
  }

  /*
  Attaches highlighting to the page load event.
  */
  function initHighlightingOnLoad() {
    addEventListener('DOMContentLoaded', initHighlighting, false);
    addEventListener('load', initHighlighting, false);
  }

  function registerLanguage(name, language) {
    var lang = languages[name] = language(hljs);
    restoreLanguageApi(lang);
    if (lang.aliases) {
      lang.aliases.forEach(function(alias) {aliases[alias] = name;});
    }
  }

  function listLanguages() {
    return objectKeys(languages);
  }

  function getLanguage(name) {
    if(name.indexOf('[') >= 0) {
      name = name.slice(0,name.indexOf('['));
    }
    name = (name || '').toLowerCase();
    return languages[name] || languages[aliases[name]];
  }

  function autoDetection(name) {
    var lang = getLanguage(name);
    return lang && !lang.disableAutodetect;
  }

  /* Interface definition */

  hljs.highlight = highlight;
  hljs.highlightAuto = highlightAuto;
  hljs.fixMarkup = fixMarkup;
  hljs.highlightBlock = highlightBlock;
  hljs.configure = configure;
  hljs.initHighlighting = initHighlighting;
  hljs.initHighlightingOnLoad = initHighlightingOnLoad;
  hljs.registerLanguage = registerLanguage;
  hljs.listLanguages = listLanguages;
  hljs.getLanguage = getLanguage;
  hljs.autoDetection = autoDetection;
  hljs.inherit = inherit;

  // Common regexps
  hljs.IDENT_RE = '[a-zA-Z]\\w*';
  hljs.UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
  hljs.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
  hljs.C_NUMBER_RE = '(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)'; // 0x..., 0..., decimal, float
  hljs.BINARY_NUMBER_RE = '\\b(0b[01]+)'; // 0b...
  hljs.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';

  // Common modes
  hljs.BACKSLASH_ESCAPE = {
    begin: '\\\\[\\s\\S]', relevance: 0
  };
  hljs.APOS_STRING_MODE = {
    className: 'string',
    begin: '\'', end: '\'',
    illegal: '\\n',
    contains: [hljs.BACKSLASH_ESCAPE]
  };
  hljs.QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: [hljs.BACKSLASH_ESCAPE]
  };
  hljs.PHRASAL_WORDS_MODE = {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  };
  hljs.COMMENT = function (begin, end, inherits) {
    var mode = hljs.inherit(
      {
        className: 'comment',
        begin: begin, end: end,
        contains: []
      },
      inherits || {}
    );
    mode.contains.push(hljs.PHRASAL_WORDS_MODE);
    mode.contains.push({
      className: 'doctag',
      begin: '(?:TODO|FIXME|NOTE|BUG|XXX):',
      relevance: 0
    });
    return mode;
  };
  hljs.C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$');
  hljs.C_BLOCK_COMMENT_MODE = hljs.COMMENT('/\\*', '\\*/');
  hljs.HASH_COMMENT_MODE = hljs.COMMENT('#', '$');
  hljs.NUMBER_MODE = {
    className: 'number',
    begin: hljs.NUMBER_RE,
    relevance: 0
  };
  hljs.C_NUMBER_MODE = {
    className: 'number',
    begin: hljs.C_NUMBER_RE,
    relevance: 0
  };
  hljs.BINARY_NUMBER_MODE = {
    className: 'number',
    begin: hljs.BINARY_NUMBER_RE,
    relevance: 0
  };
  hljs.CSS_NUMBER_MODE = {
    className: 'number',
    begin: hljs.NUMBER_RE + '(' +
      '%|em|ex|ch|rem'  +
      '|vw|vh|vmin|vmax' +
      '|cm|mm|in|pt|pc|px' +
      '|deg|grad|rad|turn' +
      '|s|ms' +
      '|Hz|kHz' +
      '|dpi|dpcm|dppx' +
      ')?',
    relevance: 0
  };
  hljs.REGEXP_MODE = {
    className: 'regexp',
    begin: /\//, end: /\/[gimuy]*/,
    illegal: /\n/,
    contains: [
      hljs.BACKSLASH_ESCAPE,
      {
        begin: /\[/, end: /\]/,
        relevance: 0,
        contains: [hljs.BACKSLASH_ESCAPE]
      }
    ]
  };
  hljs.TITLE_MODE = {
    className: 'title',
    begin: hljs.IDENT_RE,
    relevance: 0
  };
  hljs.UNDERSCORE_TITLE_MODE = {
    className: 'title',
    begin: hljs.UNDERSCORE_IDENT_RE,
    relevance: 0
  };
  hljs.METHOD_GUARD = {
    // excludes method names from keyword processing
    begin: '\\.\\s*' + hljs.UNDERSCORE_IDENT_RE,
    relevance: 0
  };

  return hljs;
}));
;
      return exports;
    }())
  , languages = [{name:"cpp",create:/*
Language: C++
Author: Ivan Sagalaev <maniac@softwaremaniacs.org>
Contributors: Evgeny Stepanischev <imbolk@gmail.com>, Zaven Muradyan <megalivoithos@gmail.com>, Roel Deckers <admin@codingcat.nl>, Sam Wu <samsam2310@gmail.com>, Jordi Petit <jordi.petit@gmail.com>, Pieter Vantorre <pietervantorre@gmail.com>, Google Inc. (David Benjamin) <davidben@google.com>
Category: common, system
*/

function(hljs) {
  var CPP_PRIMITIVE_TYPES = {
    className: 'keyword',
    begin: '\\b[a-z\\d_]*_t\\b'
  };

  var STRINGS = {
    className: 'string',
    variants: [
      {
        begin: '(u8?|U|L)?"', end: '"',
        illegal: '\\n',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      { begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\((?:.|\n)*?\)\1"/ },
      {
        begin: '\'\\\\?.', end: '\'',
        illegal: '.'
      }
    ]
  };

  var NUMBERS = {
    className: 'number',
    variants: [
      { begin: '\\b(0b[01\']+)' },
      { begin: '(-?)\\b([\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)(u|U|l|L|ul|UL|f|F|b|B)' },
      { begin: '(-?)(\\b0[xX][a-fA-F0-9\']+|(\\b[\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)([eE][-+]?[\\d\']+)?)' }
    ],
    relevance: 0
  };

  var PREPROCESSOR =       {
    className: 'meta',
    begin: /#\s*[a-z]+\b/, end: /$/,
    keywords: {
      'meta-keyword':
        'if else elif endif define undef warning error line ' +
        'pragma ifdef ifndef include'
    },
    contains: [
      {
        begin: /\\\n/, relevance: 0
      },
      hljs.inherit(STRINGS, {className: 'meta-string'}),
      {
        className: 'meta-string',
        begin: /<[^\n>]*>/, end: /$/,
        illegal: '\\n',
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE
    ]
  };

  var FUNCTION_TITLE = hljs.IDENT_RE + '\\s*\\(';

  var CPP_KEYWORDS = {
    keyword: 'int float while private char catch import module export virtual operator sizeof ' +
      'dynamic_cast|10 typedef const_cast|10 const for static_cast|10 union namespace ' +
      'unsigned long volatile static protected bool template mutable if public friend ' +
      'do goto auto void enum else break extern using asm case typeid ' +
      'short reinterpret_cast|10 default double register explicit signed typename try this ' +
      'switch continue inline delete alignof constexpr decltype ' +
      'noexcept static_assert thread_local restrict _Bool complex _Complex _Imaginary ' +
      'atomic_bool atomic_char atomic_schar ' +
      'atomic_uchar atomic_short atomic_ushort atomic_int atomic_uint atomic_long atomic_ulong atomic_llong ' +
      'atomic_ullong new throw return ' +
      'and or not',
    built_in: 'std string cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream ' +
      'auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set ' +
      'unordered_map unordered_multiset unordered_multimap array shared_ptr abort abs acos ' +
      'asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp ' +
      'fscanf isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper ' +
      'isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow ' +
      'printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp ' +
      'strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan ' +
      'vfprintf vprintf vsprintf endl initializer_list unique_ptr',
    literal: 'true false nullptr NULL'
  };

  var EXPRESSION_CONTAINS = [
    CPP_PRIMITIVE_TYPES,
    hljs.C_LINE_COMMENT_MODE,
    hljs.C_BLOCK_COMMENT_MODE,
    NUMBERS,
    STRINGS
  ];

  return {
    aliases: ['c', 'cc', 'h', 'c++', 'h++', 'hpp', 'hh', 'hxx', 'cxx'],
    keywords: CPP_KEYWORDS,
    illegal: '</',
    contains: EXPRESSION_CONTAINS.concat([
      PREPROCESSOR,
      {
        begin: '\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<', end: '>',
        keywords: CPP_KEYWORDS,
        contains: ['self', CPP_PRIMITIVE_TYPES]
      },
      {
        begin: hljs.IDENT_RE + '::',
        keywords: CPP_KEYWORDS
      },
      {
        // This mode covers expression context where we can't expect a function
        // definition and shouldn't highlight anything that looks like one:
        // `return some()`, `else if()`, `(x*sum(1, 2))`
        variants: [
          {begin: /=/, end: /;/},
          {begin: /\(/, end: /\)/},
          {beginKeywords: 'new throw return else', end: /;/}
        ],
        keywords: CPP_KEYWORDS,
        contains: EXPRESSION_CONTAINS.concat([
          {
            begin: /\(/, end: /\)/,
            keywords: CPP_KEYWORDS,
            contains: EXPRESSION_CONTAINS.concat(['self']),
            relevance: 0
          }
        ]),
        relevance: 0
      },
      {
        className: 'function',
        begin: '(' + hljs.IDENT_RE + '[\\*&\\s]+)+' + FUNCTION_TITLE,
        returnBegin: true, end: /[{;=]/,
        excludeEnd: true,
        keywords: CPP_KEYWORDS,
        illegal: /[^\w\s\*&]/,
        contains: [
          {
            begin: FUNCTION_TITLE, returnBegin: true,
            contains: [hljs.TITLE_MODE],
            relevance: 0
          },
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            keywords: CPP_KEYWORDS,
            relevance: 0,
            contains: [
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE,
              STRINGS,
              NUMBERS,
              CPP_PRIMITIVE_TYPES,
              // Count matching parentheses.
              {
                begin: /\(/, end: /\)/,
                keywords: CPP_KEYWORDS,
                relevance: 0,
                contains: [
                  'self',
                  hljs.C_LINE_COMMENT_MODE,
                  hljs.C_BLOCK_COMMENT_MODE,
                  STRINGS,
                  NUMBERS,
                  CPP_PRIMITIVE_TYPES
                ]
              }
            ]
          },
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          PREPROCESSOR
        ]
      },
      {
        className: 'class',
        beginKeywords: 'class struct', end: /[{;:]/,
        contains: [
          {begin: /</, end: />/, contains: ['self']}, // skip generic stuff
          hljs.TITLE_MODE
        ]
      }
    ]),
    exports: {
      preprocessor: PREPROCESSOR,
      strings: STRINGS,
      keywords: CPP_KEYWORDS
    }
  };
}
},{name:"bash",create:/*
Language: Bash
Author: vah <vahtenberg@gmail.com>
Contributrors: Benjamin Pannell <contact@sierrasoftworks.com>
Category: common
*/

function(hljs) {
  var VAR = {
    className: 'variable',
    variants: [
      {begin: /\$[\w\d#@][\w\d_]*/},
      {begin: /\$\{(.*?)}/}
    ]
  };
  var QUOTE_STRING = {
    className: 'string',
    begin: /"/, end: /"/,
    contains: [
      hljs.BACKSLASH_ESCAPE,
      VAR,
      {
        className: 'variable',
        begin: /\$\(/, end: /\)/,
        contains: [hljs.BACKSLASH_ESCAPE]
      }
    ]
  };
  var ESCAPED_QUOTE = {
    className: '',
    begin: /\\"/

  };
  var APOS_STRING = {
    className: 'string',
    begin: /'/, end: /'/
  };

  return {
    aliases: ['sh', 'zsh'],
    lexemes: /\b-?[a-z\._]+\b/,
    keywords: {
      keyword:
        'if then else elif fi for while in do done case esac function',
      literal:
        'true false command dirname filename src dest username pe_node name',
      built_in:
        // Shell built-ins
        // http://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
        'break cd continue eval exec exit export getopts hash pwd readonly return shift test times ' +
        'trap umask unset ' +
        // Bash built-ins
        'alias bind builtin caller declare echo enable help let local logout mapfile printf ' +
        'read readarray source type typeset ulimit unalias ' +
        // Shell modifiers
        'set shopt ' +
        // Zsh built-ins
        'autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles ' +
        'compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate ' +
        'fc fg float functions getcap getln history integer jobs kill limit log noglob popd print ' +
        'pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit ' +
        'unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof ' +
        'zpty zregexparse zsocket zstyle ztcp ' +
        // compilers
        'ecpg gcc javac java jshell cat ssh ls mkdir touch cp rm mv less man vim',
      _:
        '-ne -eq -lt -gt -f -d -e -s -l -a' // relevance booster
    },
    contains: [
      {
        className: 'meta',
        begin: /^#![^\n]+sh\s*$/,
        relevance: 10
      },
      {
        className: 'function',
        begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
        returnBegin: true,
        contains: [hljs.inherit(hljs.TITLE_MODE, {begin: /\w[\w\d_]*/})],
        relevance: 0
      },
      hljs.HASH_COMMENT_MODE,
      QUOTE_STRING,
      ESCAPED_QUOTE,
      APOS_STRING,
      VAR
    ]
  };
}
},{name:"cql",create:/*
Language: C++
Author: Ivan Sagalaev <maniac@softwaremaniacs.org>
Contributors: Evgeny Stepanischev <imbolk@gmail.com>, Zaven Muradyan <megalivoithos@gmail.com>, Roel Deckers <admin@codingcat.nl>, Sam Wu <samsam2310@gmail.com>, Jordi Petit <jordi.petit@gmail.com>, Pieter Vantorre <pietervantorre@gmail.com>, Google Inc. (David Benjamin) <davidben@google.com>
Category: common, system
*/

function(hljs) {
  var CPP_PRIMITIVE_TYPES = {
    className: 'keyword',
    begin: '\\b[a-z\\d_]*_t\\b'
  };

  var STRINGS = {
    className: 'string',
    variants: [
      {
        begin: '(u8?|U|L)?"', end: '"',
        illegal: '\\n',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      { begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\((?:.|\n)*?\)\1"/ },
      {
        begin: '\'\\\\?.', end: '\'',
        illegal: '.'
      }
    ]
  };

  var NUMBERS = {
    className: 'number',
    variants: [
      { begin: '\\b(0b[01\']+)' },
      { begin: '(-?)\\b([\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)(u|U|l|L|ul|UL|f|F|b|B)' },
      { begin: '(-?)(\\b0[xX][a-fA-F0-9\']+|(\\b[\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)([eE][-+]?[\\d\']+)?)' }
    ],
    relevance: 0
  };

  var PREPROCESSOR =       {
    className: 'meta',
    begin: /#\s*[a-z]+\b/, end: /$/,
    keywords: {
      'meta-keyword':
        'if else elif endif define undef warning error line ' +
        'pragma ifdef ifndef include'
    },
    contains: [
      {
        begin: /\\\n/, relevance: 0
      },
      hljs.inherit(STRINGS, {className: 'meta-string'}),
      {
        className: 'meta-string',
        begin: /<[^\n>]*>/, end: /$/,
        illegal: '\\n',
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE
    ]
  };

  var FUNCTION_TITLE = hljs.IDENT_RE + '\\s*\\(';

  var CPP_KEYWORDS = {
    keyword: 'int float while private char catch import module export virtual operator sizeof ' +
      'dynamic_cast|10 typedef const_cast|10 const for static_cast|10 union namespace ' +
      'unsigned long volatile static protected bool template mutable if public friend ' +
      'do goto auto void enum else break extern using asm case typeid ' +
      'short reinterpret_cast|10 default double register explicit signed typename try this ' +
      'switch continue inline delete alignof constexpr decltype ' +
      'noexcept static_assert thread_local restrict _Bool complex _Complex _Imaginary ' +
      'atomic_bool atomic_char atomic_schar ' +
      'atomic_uchar atomic_short atomic_ushort atomic_int atomic_uint atomic_long atomic_ulong atomic_llong ' +
      'atomic_ullong new throw return ' +
      'and or not',
    built_in: 'std string cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream ' +
      'auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set ' +
      'unordered_map unordered_multiset unordered_multimap array shared_ptr abort abs acos ' +
      'asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp ' +
      'fscanf isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper ' +
      'isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow ' +
      'printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp ' +
      'strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan ' +
      'vfprintf vprintf vsprintf endl initializer_list unique_ptr ' +
      // SQL SLI
      'EXEC SQL '
      // Optional SLI
      // + 'WHENEVER NOT FOUND DO BREAK BEGIN DECLARE SECTION END CONNECT TO USER USING CURSOR FOR OPEN FETCH NEXT FROM SELECT LIMIT INTO CLOSE COMMIT DISCONNECT'
      ,
    literal: 'true false nullptr NULL'
  };

  var EXPRESSION_CONTAINS = [
    CPP_PRIMITIVE_TYPES,
    hljs.C_LINE_COMMENT_MODE,
    hljs.C_BLOCK_COMMENT_MODE,
    NUMBERS,
    STRINGS
  ];

  return {
    aliases: ['csql'],
    keywords: CPP_KEYWORDS,
    illegal: '</',
    contains: EXPRESSION_CONTAINS.concat([
      PREPROCESSOR,
      {
        begin: '\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<', end: '>',
        keywords: CPP_KEYWORDS,
        contains: ['self', CPP_PRIMITIVE_TYPES]
      },
      {
        begin: hljs.IDENT_RE + '::',
        keywords: CPP_KEYWORDS
      },
      {
        // This mode covers expression context where we can't expect a function
        // definition and shouldn't highlight anything that looks like one:
        // `return some()`, `else if()`, `(x*sum(1, 2))`
        variants: [
          {begin: /=/, end: /;/},
          {begin: /\(/, end: /\)/},
          {beginKeywords: 'new throw return else', end: /;/}
        ],
        keywords: CPP_KEYWORDS,
        contains: EXPRESSION_CONTAINS.concat([
          {
            begin: /\(/, end: /\)/,
            keywords: CPP_KEYWORDS,
            contains: EXPRESSION_CONTAINS.concat(['self']),
            relevance: 0
          }
        ]),
        relevance: 0
      },
      {
        className: 'function',
        begin: '(' + hljs.IDENT_RE + '[\\*&\\s]+)+' + FUNCTION_TITLE,
        returnBegin: true, end: /[{;=]/,
        excludeEnd: true,
        keywords: CPP_KEYWORDS,
        illegal: /[^\w\s\*&]/,
        contains: [
          {
            begin: FUNCTION_TITLE, returnBegin: true,
            contains: [hljs.TITLE_MODE],
            relevance: 0
          },
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            keywords: CPP_KEYWORDS,
            relevance: 0,
            contains: [
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE,
              STRINGS,
              NUMBERS,
              CPP_PRIMITIVE_TYPES,
              // Count matching parentheses.
              {
                begin: /\(/, end: /\)/,
                keywords: CPP_KEYWORDS,
                relevance: 0,
                contains: [
                  'self',
                  hljs.C_LINE_COMMENT_MODE,
                  hljs.C_BLOCK_COMMENT_MODE,
                  STRINGS,
                  NUMBERS,
                  CPP_PRIMITIVE_TYPES
                ]
              }
            ]
          },
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          PREPROCESSOR
        ]
      },
      {
        className: 'class',
        beginKeywords: 'class struct', end: /[{;:]/,
        contains: [
          {begin: /</, end: />/, contains: ['self']}, // skip generic stuff
          hljs.TITLE_MODE
        ]
      }
    ]),
    exports: {
      preprocessor: PREPROCESSOR,
      strings: STRINGS,
      keywords: CPP_KEYWORDS
    }
  };
}
},{name:"haskell",create:/*
Language: Haskell
Author: Jeremy Hull <sourdrums@gmail.com>
Contributors: Zena Treep <zena.treep@gmail.com>
Category: functional
*/

function(hljs) {
  var COMMENT = {
    variants: [
      hljs.COMMENT('--', '$'),
      hljs.COMMENT(
        '{-',
        '-}',
        {
          contains: ['self']
        }
      )
    ]
  };

  var PRAGMA = {
    className: 'meta',
    begin: '{-#', end: '#-}'
  };

  var PREPROCESSOR = {
    className: 'meta',
    begin: '^#', end: '$'
  };

  var CONSTRUCTOR = {
    className: 'type',
    begin: '\\b[A-Z][\\w\']*', // TODO: other constructors (build-in, infix).
    relevance: 0
  };

  var LIST = {
    begin: '\\(', end: '\\)',
    illegal: '"',
    contains: [
      PRAGMA,
      PREPROCESSOR,
      {className: 'type', begin: '\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?'},
      hljs.inherit(hljs.TITLE_MODE, {begin: '[_a-z][\\w\']*'}),
      COMMENT
    ]
  };

  var RECORD = {
    begin: '{', end: '}',
    contains: LIST.contains
  };

  return {
    aliases: ['hs'],
    keywords:
      'let in if then else case of where do module import hiding ' +
      'qualified type data newtype deriving class instance as default ' +
      'infix infixl infixr foreign export ccall stdcall cplusplus ' +
      'jvm dotnet safe unsafe family forall mdo proc rec',
    contains: [

      // Top-level constructions.

      {
        beginKeywords: 'module', end: 'where',
        keywords: 'module where',
        contains: [LIST, COMMENT],
        illegal: '\\W\\.|;'
      },
      {
        begin: '\\bimport\\b', end: '$',
        keywords: 'import qualified as hiding',
        contains: [LIST, COMMENT],
        illegal: '\\W\\.|;'
      },

      {
        className: 'class',
        begin: '^(\\s*)?(class|instance)\\b', end: 'where',
        keywords: 'class family instance where',
        contains: [CONSTRUCTOR, LIST, COMMENT]
      },
      {
        className: 'class',
        begin: '\\b(data|(new)?type)\\b', end: '$',
        keywords: 'data family type newtype deriving',
        contains: [PRAGMA, CONSTRUCTOR, LIST, RECORD, COMMENT]
      },
      {
        beginKeywords: 'default', end: '$',
        contains: [CONSTRUCTOR, LIST, COMMENT]
      },
      {
        beginKeywords: 'infix infixl infixr', end: '$',
        contains: [hljs.C_NUMBER_MODE, COMMENT]
      },
      {
        begin: '\\bforeign\\b', end: '$',
        keywords: 'foreign import export ccall stdcall cplusplus jvm ' +
                  'dotnet safe unsafe',
        contains: [CONSTRUCTOR, hljs.QUOTE_STRING_MODE, COMMENT]
      },
      {
        className: 'meta',
        begin: '#!\\/usr\\/bin\\/env\ runhaskell', end: '$'
      },

      // "Whitespaces".

      PRAGMA,
      PREPROCESSOR,

      // Literals and names.

      // TODO: characters.
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE,
      CONSTRUCTOR,
      hljs.inherit(hljs.TITLE_MODE, {begin: '^[_a-z][\\w\']*'}),

      COMMENT,

      {begin: '->|<-'} // No markup, relevance booster
    ]
  };
}
},{name:"java",create:/*
Language: Java
Author: Vsevolod Solovyov <vsevolod.solovyov@gmail.com>
Category: common, enterprise
*/

function(hljs) {
  var JAVA_IDENT_RE = '[\u00C0-\u02B8a-zA-Z_$][\u00C0-\u02B8a-zA-Z_$0-9]*';
  var GENERIC_IDENT_RE = JAVA_IDENT_RE + '(<' + JAVA_IDENT_RE + '(\\s*,\\s*' + JAVA_IDENT_RE + ')*>)?';
  var KEYWORDS =
    'false synchronized int abstract float private char boolean var static null if const ' +
    'for true while long strictfp finally protected import native final void ' +
    'enum else break transient catch instanceof byte super volatile case assert short ' +
    'package default double public try this switch continue throws protected public private ' +
    'module requires exports do ' +
    // add extend?
    'extends';

  // https://docs.oracle.com/javase/7/docs/technotes/guides/language/underscores-literals.html
  var JAVA_NUMBER_RE = '\\b' +
    '(' +
      '0[bB]([01]+[01_]+[01]+|[01]+)' + // 0b...
      '|' +
      '0[xX]([a-fA-F0-9]+[a-fA-F0-9_]+[a-fA-F0-9]+|[a-fA-F0-9]+)' + // 0x...
      '|' +
      '(' +
        '([\\d]+[\\d_]+[\\d]+|[\\d]+)(\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))?' +
        '|' +
        '\\.([\\d]+[\\d_]+[\\d]+|[\\d]+)' +
      ')' +
      '([eE][-+]?\\d+)?' + // octal, decimal, float
    ')' +
    '[lLfF]?';
  var JAVA_NUMBER_MODE = {
    className: 'number',
    begin: JAVA_NUMBER_RE,
    relevance: 0
  };

  return {
    aliases: ['jsp'],
    keywords: KEYWORDS,
    illegal: /<\/|#/,
    contains: [
      hljs.COMMENT(
        '/\\*\\*',
        '\\*/',
        {
          relevance : 0,
          contains : [
            {
              // eat up @'s in emails to prevent them to be recognized as doctags
              begin: /\w+@/, relevance: 0
            },
            {
              className : 'doctag',
              begin : '@[A-Za-z]+'
            }
          ]
        }
      ),
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'class',
        beginKeywords: 'class interface', end: /[{;=]/, excludeEnd: true,
        keywords: 'class interface',
        illegal: /[:"\[\]]/,
        contains: [
          {beginKeywords: 'extends implements'},
          hljs.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        // Expression keywords prevent 'keyword Name(...)' from being
        // recognized as a function definition
        beginKeywords: 'new throw return else',
        relevance: 0
      },
      {
        className: 'function',
        begin: '(' + GENERIC_IDENT_RE + '\\s+)+' + hljs.UNDERSCORE_IDENT_RE + '\\s*\\(', returnBegin: true, end: /[{;=]/,
        excludeEnd: true,
        keywords: KEYWORDS,
        contains: [
          {
            begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(', returnBegin: true,
            relevance: 0,
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          },
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            keywords: KEYWORDS,
            relevance: 0,
            contains: [
              hljs.APOS_STRING_MODE,
              hljs.QUOTE_STRING_MODE,
              hljs.C_NUMBER_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE
        ]
      },
      JAVA_NUMBER_MODE,
      {
        className: 'meta', begin: '@[A-Za-z]+'
      }
    ]
  };
}
},{name:"javascript",create:/*
Language: JavaScript
Category: common, scripting
*/

function(hljs) {
  var IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
  var KEYWORDS = {
    keyword:
      'in of if for while finally var new function do return void else break catch ' +
      'instanceof with throw case default try this switch continue typeof delete ' +
      'let yield const export super debugger as async await static ' +
      // ECMAScript 6 modules import
      'import from as'
    ,
    literal:
      'true false null undefined NaN Infinity',
    built_in:
      'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' +
      'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' +
      'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' +
      'TypeError URIError Number Math Date String RegExp Array Float32Array ' +
      'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' +
      'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' +
      'module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect ' +
      'Promise'
  };
  var NUMBER = {
    className: 'number',
    variants: [
      { begin: '\\b(0[bB][01]+)' },
      { begin: '\\b(0[oO][0-7]+)' },
      { begin: hljs.C_NUMBER_RE }
    ],
    relevance: 0
  };
  var SUBST = {
    className: 'subst',
    begin: '\\$\\{', end: '\\}',
    keywords: KEYWORDS,
    contains: []  // defined later
  };
  var HTML_TEMPLATE = {
    begin: 'html`', end: '',
    starts: {
      end: '`', returnEnd: false,
      contains: [
        hljs.BACKSLASH_ESCAPE,
        SUBST
      ],
      subLanguage: 'xml',
    }
  };
  var CSS_TEMPLATE = {
    begin: 'css`', end: '',
    starts: {
      end: '`', returnEnd: false,
      contains: [
        hljs.BACKSLASH_ESCAPE,
        SUBST
      ],
      subLanguage: 'css',
    }
  };
  var TEMPLATE_STRING = {
    className: 'string',
    begin: '`', end: '`',
    contains: [
      hljs.BACKSLASH_ESCAPE,
      SUBST
    ]
  };
  SUBST.contains = [
    hljs.APOS_STRING_MODE,
    hljs.QUOTE_STRING_MODE,
    HTML_TEMPLATE,
    CSS_TEMPLATE,
    TEMPLATE_STRING,
    NUMBER,
    hljs.REGEXP_MODE
  ];
  var PARAMS_CONTAINS = SUBST.contains.concat([
    hljs.C_BLOCK_COMMENT_MODE,
    hljs.C_LINE_COMMENT_MODE
  ]);

  return {
    aliases: ['js', 'jsx'],
    keywords: KEYWORDS,
    contains: [
      {
        className: 'meta',
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      },
      {
        className: 'meta',
        begin: /^#!/, end: /$/
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      TEMPLATE_STRING,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      NUMBER,
      { // object attr container
        begin: /[{,]\s*/, relevance: 0,
        contains: [
          {
            begin: IDENT_RE + '\\s*:', returnBegin: true,
            relevance: 0,
            contains: [{className: 'attr', begin: IDENT_RE, relevance: 0}]
          }
        ]
      },
      { // "value" container
        begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
        keywords: 'return throw case',
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          hljs.REGEXP_MODE,
          {
            className: 'function',
            begin: '(\\(.*?\\)|' + IDENT_RE + ')\\s*=>', returnBegin: true,
            end: '\\s*=>',
            contains: [
              {
                className: 'params',
                variants: [
                  {
                    begin: IDENT_RE
                  },
                  {
                    begin: /\(\s*\)/,
                  },
                  {
                    begin: /\(/, end: /\)/,
                    excludeBegin: true, excludeEnd: true,
                    keywords: KEYWORDS,
                    contains: PARAMS_CONTAINS
                  }
                ]
              }
            ]
          },
          {
            className: '',
            begin: /\s/,
            end: /\s*/,
            skip: true,
          },
          { // E4X / JSX
            begin: /</, end: /(\/[A-Za-z0-9\\._:-]+|[A-Za-z0-9\\._:-]+\/)>/,
            subLanguage: 'xml',
            contains: [
              { begin: /<[A-Za-z0-9\\._:-]+\s*\/>/, skip: true },
              {
                begin: /<[A-Za-z0-9\\._:-]+/, end: /(\/[A-Za-z0-9\\._:-]+|[A-Za-z0-9\\._:-]+\/)>/, skip: true,
                contains: [
                  { begin: /<[A-Za-z0-9\\._:-]+\s*\/>/, skip: true },
                  'self'
                ]
              }
            ]
          }
        ],
        relevance: 0
      },
      {
        className: 'function',
        beginKeywords: 'function', end: /\{/, excludeEnd: true,
        contains: [
          hljs.inherit(hljs.TITLE_MODE, {begin: IDENT_RE}),
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            contains: PARAMS_CONTAINS
          }
        ],
        illegal: /\[|%/
      },
      {
        begin: /\$[(.]/ // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      },
      hljs.METHOD_GUARD,
      { // ES6 class
        className: 'class',
        beginKeywords: 'class', end: /[{;=]/, excludeEnd: true,
        illegal: /[:"\[\]]/,
        contains: [
          {beginKeywords: 'extends'},
          hljs.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        beginKeywords: 'constructor get set', end: /\{/, excludeEnd: true
      }
    ],
    illegal: /#(?!!)/
  };
}
},{name:"jshell",create:/*
Language: JShell
Requires: java.js
Author: Adi Yoga Sidi Prabawa <dcsaysp@nus.edu.sg>
Category: common
*/

function(hljs) {
  return {
    aliases: [ 'java-repl', 'jshell' ],
    contains: [
      {
        className: 'meta',
        starts: {
          // a space separates the REPL prefix from the actual code
          // this is purely for cleaner HTML output
          end: /|$/,
          starts: {
            end: '$',
            subLanguage: 'java'
          }
        },
        variants: [
          {
            begin: /^jshell>(?=[ ]|$) /
          },
          {
            begin: /^   \.\.\.>(?=[ ]|$) /
          }
        ]
      }, {
        className: 'error',
        begin: /\|  /,
        end: '$',
        relevance: 10
      }, {
        className: 'output',
        end: /(?<!^(jshell>|   \.\.\.>))(\r|\n)/
      }
    ]
  };
}
},{name:"ocaml",create:/*
Language: OCaml
Author: Mehdi Dogguy <mehdi@dogguy.org>
Contributors: Nicolas Braud-Santoni <nicolas.braud-santoni@ens-cachan.fr>, Mickael Delahaye <mickael.delahaye@gmail.com>
Description: OCaml language definition.
Category: functional
*/
function(hljs) {
  /* missing support for heredoc-like string (OCaml 4.0.2+) */
  return {
    aliases: ['ml'],
    keywords: {
      keyword:
        'and as assert asr begin class constraint do done downto else end ' +
        'exception external for fun function functor if in include ' +
        'inherit! inherit initializer land lazy let lor lsl lsr lxor match method!|10 method ' +
        'mod module mutable new object of open! open or private rec sig struct ' +
        'then to try type val! val virtual when while with ' +
        /* camlp4 */
        'parser value',
      built_in:
        /* built-in types */
        'array bool bytes char exn|5 float int int32 int64 list lazy_t|5 nativeint|5 string unit ' +
        /* (some) types in Pervasives */
        'in_channel out_channel ref',
      literal:
        'true false'
    },
    illegal: /\/\/|>>/,
    lexemes: '[a-z_]\\w*!?',
    contains: [
      {
        className: 'literal',
        begin: '\\[(\\|\\|)?\\]|\\(\\)',
        relevance: 0
      },
      hljs.COMMENT(
        '\\(\\*',
        '\\*\\)',
        {
          contains: ['self']
        }
      ),
      { /* type variable */
        className: 'symbol',
        begin: '\'[A-Za-z_](?!\')[\\w\']*'
        /* the grammar is ambiguous on how 'a'b should be interpreted but not the compiler */
      },
      { /* polymorphic variant */
        className: 'type',
        begin: '`[A-Z][\\w\']*'
      },
      { /* module or constructor */
        className: 'type',
        begin: '\\b[A-Z][\\w\']*',
        relevance: 0
      },
      { /* don't color identifiers, but safely catch all identifiers with '*/
        begin: '[a-z_]\\w*\'[\\w\']*', relevance: 0
      },
      hljs.inherit(hljs.APOS_STRING_MODE, {className: 'string', relevance: 0}),
      hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}),
      {
        className: 'number',
        begin:
          '\\b(0[xX][a-fA-F0-9_]+[Lln]?|' +
          '0[oO][0-7_]+[Lln]?|' +
          '0[bB][01_]+[Lln]?|' +
          '[0-9][0-9_]*([Lln]|(\\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)',
        relevance: 0
      },
      {
        begin: /[-=]>/ // relevance booster
      }
    ]
  }
}
},{name:"pgsql",create:/*
Language: PostgreSQL SQL dialect and PL/pgSQL
Author: Egor Rogov (e.rogov@postgrespro.ru)
Description:
    This language incorporates both PostgreSQL SQL dialect and PL/pgSQL language.
    It is based on PostgreSQL version 11. Some notes:
    - Text in double-dollar-strings is _always_ interpreted as some programming code. Text
      in ordinary quotes is _never_ interpreted that way and highlighted just as a string.
    - There are quite a bit "special cases". That's because many keywords are not strictly
      they are keywords in some contexts and ordinary identifiers in others. Only some
      of such cases are handled; you still can get some of your identifiers highlighted
      wrong way.
    - Function names deliberately are not highlighted. There is no way to tell function
      call from other constructs, hence we can't highlight _all_ function names. And
      some names highlighted while others not looks ugly.
*/

function(hljs) {
  var COMMENT_MODE = hljs.COMMENT('--', '$');
  var UNQUOTED_IDENT = '[a-zA-Z_][a-zA-Z_0-9$]*';
  var DOLLAR_STRING = '\\$([a-zA-Z_]?|[a-zA-Z_][a-zA-Z_0-9]*)\\$';
  var LABEL = '<<\\s*' + UNQUOTED_IDENT + '\\s*>>';

  var SQL_KW = 
    // https://www.postgresql.org/docs/11/static/sql-keywords-appendix.html
    // https://www.postgresql.org/docs/11/static/sql-commands.html
    // SQL commands (starting words)
    'ABORT ALTER ANALYZE BEGIN CALL CHECKPOINT|10 CLOSE CLUSTER COMMENT COMMIT COPY CREATE DEALLOCATE DECLARE ' +
    'DELETE DISCARD DO DROP END EXECUTE EXPLAIN FETCH GRANT IMPORT INSERT LISTEN LOAD LOCK MOVE NOTIFY ' +
    'PREPARE REASSIGN|10 REFRESH REINDEX RELEASE RESET REVOKE ROLLBACK SAVEPOINT SECURITY SELECT SET SHOW ' +
    'START TRUNCATE UNLISTEN|10 UPDATE VACUUM|10 VALUES ' +
    // SQL commands (others)
    'AGGREGATE COLLATION CONVERSION|10 DATABASE DEFAULT PRIVILEGES DOMAIN TRIGGER EXTENSION FOREIGN ' +
    'WRAPPER|10 TABLE FUNCTION GROUP LANGUAGE LARGE OBJECT MATERIALIZED VIEW OPERATOR CLASS ' +
    'FAMILY POLICY PUBLICATION|10 ROLE RULE SCHEMA SEQUENCE SERVER STATISTICS SUBSCRIPTION SYSTEM ' +
    'TABLESPACE CONFIGURATION DICTIONARY PARSER TEMPLATE TYPE USER MAPPING PREPARED ACCESS ' +
    'METHOD CAST AS TRANSFORM TRANSACTION OWNED TO INTO SESSION AUTHORIZATION ' +
    'INDEX PROCEDURE ASSERTION ' +
    // additional reserved key words
    'ALL ANALYSE AND ANY ARRAY ASC ASYMMETRIC|10 BOTH CASE CHECK ' +
    'COLLATE COLUMN CONCURRENTLY|10 CONSTRAINT CROSS ' +
    'DEFERRABLE RANGE ' +
    'DESC DISTINCT ELSE EXCEPT FOR FREEZE|10 FROM FULL HAVING ' +
    'ILIKE IN INITIALLY INNER INTERSECT IS ISNULL JOIN LATERAL LEADING LIKE LIMIT ' +
    'NATURAL NOT NOTNULL NULL OFFSET ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY ' +
    'REFERENCES RETURNING SIMILAR SOME SYMMETRIC TABLESAMPLE THEN ' +
    'TRAILING UNION UNIQUE USING VARIADIC|10 VERBOSE WHEN WHERE WINDOW WITH ' +
    // some of non-reserved (which are used in clauses or as PL/pgSQL keyword)
    'BY RETURNS INOUT OUT SETOF|10 IF STRICT CURRENT CONTINUE OWNER LOCATION OVER PARTITION WITHIN ' +
    'BETWEEN ESCAPE EXTERNAL INVOKER DEFINER WORK RENAME VERSION CONNECTION CONNECT ' +
    'TABLES TEMP TEMPORARY FUNCTIONS SEQUENCES TYPES SCHEMAS OPTION CASCADE RESTRICT ADD ADMIN ' +
    'EXISTS VALID VALIDATE ENABLE DISABLE REPLICA|10 ALWAYS PASSING COLUMNS PATH ' +
    'REF VALUE OVERRIDING IMMUTABLE STABLE VOLATILE BEFORE AFTER EACH ROW PROCEDURAL ' +
    'ROUTINE NO HANDLER VALIDATOR OPTIONS STORAGE OIDS|10 WITHOUT INHERIT DEPENDS CALLED ' +
    'INPUT LEAKPROOF|10 COST ROWS NOWAIT SEARCH UNTIL ENCRYPTED|10 PASSWORD CONFLICT|10 ' +
    'INSTEAD INHERITS CHARACTERISTICS WRITE CURSOR ALSO STATEMENT SHARE EXCLUSIVE INLINE ' +
    'ISOLATION REPEATABLE READ COMMITTED SERIALIZABLE UNCOMMITTED LOCAL GLOBAL SQL PROCEDURES ' +
    'RECURSIVE SNAPSHOT ROLLUP CUBE TRUSTED|10 INCLUDE FOLLOWING PRECEDING UNBOUNDED RANGE GROUPS ' +
    'UNENCRYPTED|10 SYSID FORMAT DELIMITER HEADER QUOTE ENCODING FILTER OFF ' +
    // some parameters of VACUUM/ANALYZE/EXPLAIN
    'FORCE_QUOTE FORCE_NOT_NULL FORCE_NULL COSTS BUFFERS TIMING SUMMARY DISABLE_PAGE_SKIPPING ' +
    //
    'RESTART CYCLE GENERATED IDENTITY DEFERRED IMMEDIATE LEVEL LOGGED UNLOGGED ' +
    'OF NOTHING NONE EXCLUDE ATTRIBUTE ' +
    // from GRANT (not keywords actually)
    'USAGE ROUTINES ' +
    // actually literals, but look better this way (due to IS TRUE, IS FALSE, ISNULL etc)
    'TRUE FALSE NAN INFINITY ';

  var ROLE_ATTRS = // only those not in keywrods already
    'SUPERUSER NOSUPERUSER CREATEDB NOCREATEDB CREATEROLE NOCREATEROLE INHERIT NOINHERIT ' +
    'LOGIN NOLOGIN REPLICATION NOREPLICATION BYPASSRLS NOBYPASSRLS ';

  var PLPGSQL_KW = 
    'ALIAS BEGIN CONSTANT DECLARE END EXCEPTION RETURN PERFORM|10 RAISE GET DIAGNOSTICS ' +
    'STACKED|10 FOREACH LOOP ELSIF EXIT WHILE REVERSE SLICE DEBUG LOG INFO NOTICE WARNING ASSERT ' +
    'OPEN ';

  var TYPES =
    // https://www.postgresql.org/docs/11/static/datatype.html
    'BIGINT INT8 BIGSERIAL SERIAL8 BIT VARYING VARBIT BOOLEAN BOOL BOX BYTEA CHARACTER CHAR VARCHAR ' +
    'CIDR CIRCLE DATE DOUBLE PRECISION FLOAT8 FLOAT INET INTEGER INT INT4 INTERVAL JSON JSONB LINE LSEG|10 ' +
    'MACADDR MACADDR8 MONEY NUMERIC DEC DECIMAL PATH POINT POLYGON REAL FLOAT4 SMALLINT INT2 ' +
    'SMALLSERIAL|10 SERIAL2|10 SERIAL|10 SERIAL4|10 TEXT TIME ZONE TIMETZ|10 TIMESTAMP TIMESTAMPTZ|10 TSQUERY|10 TSVECTOR|10 ' +
    'TXID_SNAPSHOT|10 UUID XML NATIONAL NCHAR ' +
    'INT4RANGE|10 INT8RANGE|10 NUMRANGE|10 TSRANGE|10 TSTZRANGE|10 DATERANGE|10 ' +
    // pseudotypes
    'ANYELEMENT ANYARRAY ANYNONARRAY ANYENUM ANYRANGE CSTRING INTERNAL ' +
    'RECORD PG_DDL_COMMAND VOID UNKNOWN OPAQUE REFCURSOR ' +
    // spec. type
    'NAME ' +
    // OID-types
    'OID REGPROC|10 REGPROCEDURE|10 REGOPER|10 REGOPERATOR|10 REGCLASS|10 REGTYPE|10 REGROLE|10 ' +
    'REGNAMESPACE|10 REGCONFIG|10 REGDICTIONARY|10 ';// +
    // some types from standard extensions
    'HSTORE|10 LO LTREE|10 ';
    
  var TYPES_RE = 
    TYPES.trim()
         .split(' ')
         .map( function(val) { return val.split('|')[0]; } )
         .join('|');

  var SQL_BI =
    'CURRENT_TIME CURRENT_TIMESTAMP CURRENT_USER CURRENT_CATALOG|10 CURRENT_DATE LOCALTIME LOCALTIMESTAMP ' +
    'CURRENT_ROLE|10 CURRENT_SCHEMA|10 SESSION_USER PUBLIC ';

  var PLPGSQL_BI =
    'FOUND NEW OLD TG_NAME|10 TG_WHEN|10 TG_LEVEL|10 TG_OP|10 TG_RELID|10 TG_RELNAME|10 ' +
    'TG_TABLE_NAME|10 TG_TABLE_SCHEMA|10 TG_NARGS|10 TG_ARGV|10 TG_EVENT|10 TG_TAG|10 ' +
    // get diagnostics
    'ROW_COUNT RESULT_OID|10 PG_CONTEXT|10 RETURNED_SQLSTATE COLUMN_NAME CONSTRAINT_NAME ' +
    'PG_DATATYPE_NAME|10 MESSAGE_TEXT TABLE_NAME SCHEMA_NAME PG_EXCEPTION_DETAIL|10 ' +
    'PG_EXCEPTION_HINT|10 PG_EXCEPTION_CONTEXT|10 ';

  var PLPGSQL_EXCEPTIONS =
    // exceptions https://www.postgresql.org/docs/current/static/errcodes-appendix.html
    'SQLSTATE SQLERRM|10 ' +
    'SUCCESSFUL_COMPLETION WARNING DYNAMIC_RESULT_SETS_RETURNED IMPLICIT_ZERO_BIT_PADDING ' +
    'NULL_VALUE_ELIMINATED_IN_SET_FUNCTION PRIVILEGE_NOT_GRANTED PRIVILEGE_NOT_REVOKED ' +
    'STRING_DATA_RIGHT_TRUNCATION DEPRECATED_FEATURE NO_DATA NO_ADDITIONAL_DYNAMIC_RESULT_SETS_RETURNED ' +
    'SQL_STATEMENT_NOT_YET_COMPLETE CONNECTION_EXCEPTION CONNECTION_DOES_NOT_EXIST CONNECTION_FAILURE ' +
    'SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION ' +
    'TRANSACTION_RESOLUTION_UNKNOWN PROTOCOL_VIOLATION TRIGGERED_ACTION_EXCEPTION FEATURE_NOT_SUPPORTED ' +
    'INVALID_TRANSACTION_INITIATION LOCATOR_EXCEPTION INVALID_LOCATOR_SPECIFICATION INVALID_GRANTOR ' +
    'INVALID_GRANT_OPERATION INVALID_ROLE_SPECIFICATION DIAGNOSTICS_EXCEPTION ' +
    'STACKED_DIAGNOSTICS_ACCESSED_WITHOUT_ACTIVE_HANDLER CASE_NOT_FOUND CARDINALITY_VIOLATION ' +
    'DATA_EXCEPTION ARRAY_SUBSCRIPT_ERROR CHARACTER_NOT_IN_REPERTOIRE DATETIME_FIELD_OVERFLOW ' +
    'DIVISION_BY_ZERO ERROR_IN_ASSIGNMENT ESCAPE_CHARACTER_CONFLICT INDICATOR_OVERFLOW ' +
    'INTERVAL_FIELD_OVERFLOW INVALID_ARGUMENT_FOR_LOGARITHM INVALID_ARGUMENT_FOR_NTILE_FUNCTION ' +
    'INVALID_ARGUMENT_FOR_NTH_VALUE_FUNCTION INVALID_ARGUMENT_FOR_POWER_FUNCTION ' +
    'INVALID_ARGUMENT_FOR_WIDTH_BUCKET_FUNCTION INVALID_CHARACTER_VALUE_FOR_CAST ' +
    'INVALID_DATETIME_FORMAT INVALID_ESCAPE_CHARACTER INVALID_ESCAPE_OCTET INVALID_ESCAPE_SEQUENCE ' +
    'NONSTANDARD_USE_OF_ESCAPE_CHARACTER INVALID_INDICATOR_PARAMETER_VALUE INVALID_PARAMETER_VALUE ' +
    'INVALID_REGULAR_EXPRESSION INVALID_ROW_COUNT_IN_LIMIT_CLAUSE ' +
    'INVALID_ROW_COUNT_IN_RESULT_OFFSET_CLAUSE INVALID_TABLESAMPLE_ARGUMENT INVALID_TABLESAMPLE_REPEAT ' +
    'INVALID_TIME_ZONE_DISPLACEMENT_VALUE INVALID_USE_OF_ESCAPE_CHARACTER MOST_SPECIFIC_TYPE_MISMATCH ' +
    'NULL_VALUE_NOT_ALLOWED NULL_VALUE_NO_INDICATOR_PARAMETER NUMERIC_VALUE_OUT_OF_RANGE ' +
    'SEQUENCE_GENERATOR_LIMIT_EXCEEDED STRING_DATA_LENGTH_MISMATCH STRING_DATA_RIGHT_TRUNCATION ' +
    'SUBSTRING_ERROR TRIM_ERROR UNTERMINATED_C_STRING ZERO_LENGTH_CHARACTER_STRING ' +
    'FLOATING_POINT_EXCEPTION INVALID_TEXT_REPRESENTATION INVALID_BINARY_REPRESENTATION ' +
    'BAD_COPY_FILE_FORMAT UNTRANSLATABLE_CHARACTER NOT_AN_XML_DOCUMENT INVALID_XML_DOCUMENT ' +
    'INVALID_XML_CONTENT INVALID_XML_COMMENT INVALID_XML_PROCESSING_INSTRUCTION ' +
    'INTEGRITY_CONSTRAINT_VIOLATION RESTRICT_VIOLATION NOT_NULL_VIOLATION FOREIGN_KEY_VIOLATION ' +
    'UNIQUE_VIOLATION CHECK_VIOLATION EXCLUSION_VIOLATION INVALID_CURSOR_STATE ' +
    'INVALID_TRANSACTION_STATE ACTIVE_SQL_TRANSACTION BRANCH_TRANSACTION_ALREADY_ACTIVE ' +
    'HELD_CURSOR_REQUIRES_SAME_ISOLATION_LEVEL INAPPROPRIATE_ACCESS_MODE_FOR_BRANCH_TRANSACTION ' +
    'INAPPROPRIATE_ISOLATION_LEVEL_FOR_BRANCH_TRANSACTION ' +
    'NO_ACTIVE_SQL_TRANSACTION_FOR_BRANCH_TRANSACTION READ_ONLY_SQL_TRANSACTION ' +
    'SCHEMA_AND_DATA_STATEMENT_MIXING_NOT_SUPPORTED NO_ACTIVE_SQL_TRANSACTION ' +
    'IN_FAILED_SQL_TRANSACTION IDLE_IN_TRANSACTION_SESSION_TIMEOUT INVALID_SQL_STATEMENT_NAME ' +
    'TRIGGERED_DATA_CHANGE_VIOLATION INVALID_AUTHORIZATION_SPECIFICATION INVALID_PASSWORD ' +
    'DEPENDENT_PRIVILEGE_DESCRIPTORS_STILL_EXIST DEPENDENT_OBJECTS_STILL_EXIST ' +
    'INVALID_TRANSACTION_TERMINATION SQL_ROUTINE_EXCEPTION FUNCTION_EXECUTED_NO_RETURN_STATEMENT ' +
    'MODIFYING_SQL_DATA_NOT_PERMITTED PROHIBITED_SQL_STATEMENT_ATTEMPTED ' +
    'READING_SQL_DATA_NOT_PERMITTED INVALID_CURSOR_NAME EXTERNAL_ROUTINE_EXCEPTION ' +
    'CONTAINING_SQL_NOT_PERMITTED MODIFYING_SQL_DATA_NOT_PERMITTED ' +
    'PROHIBITED_SQL_STATEMENT_ATTEMPTED READING_SQL_DATA_NOT_PERMITTED ' +
    'EXTERNAL_ROUTINE_INVOCATION_EXCEPTION INVALID_SQLSTATE_RETURNED NULL_VALUE_NOT_ALLOWED ' +
    'TRIGGER_PROTOCOL_VIOLATED SRF_PROTOCOL_VIOLATED EVENT_TRIGGER_PROTOCOL_VIOLATED ' +
    'SAVEPOINT_EXCEPTION INVALID_SAVEPOINT_SPECIFICATION INVALID_CATALOG_NAME ' +
    'INVALID_SCHEMA_NAME TRANSACTION_ROLLBACK TRANSACTION_INTEGRITY_CONSTRAINT_VIOLATION ' +
    'SERIALIZATION_FAILURE STATEMENT_COMPLETION_UNKNOWN DEADLOCK_DETECTED ' +
    'SYNTAX_ERROR_OR_ACCESS_RULE_VIOLATION SYNTAX_ERROR INSUFFICIENT_PRIVILEGE CANNOT_COERCE ' +
    'GROUPING_ERROR WINDOWING_ERROR INVALID_RECURSION INVALID_FOREIGN_KEY INVALID_NAME ' +
    'NAME_TOO_LONG RESERVED_NAME DATATYPE_MISMATCH INDETERMINATE_DATATYPE COLLATION_MISMATCH ' +
    'INDETERMINATE_COLLATION WRONG_OBJECT_TYPE GENERATED_ALWAYS UNDEFINED_COLUMN ' +
    'UNDEFINED_FUNCTION UNDEFINED_TABLE UNDEFINED_PARAMETER UNDEFINED_OBJECT ' +
    'DUPLICATE_COLUMN DUPLICATE_CURSOR DUPLICATE_DATABASE DUPLICATE_FUNCTION ' +
    'DUPLICATE_PREPARED_STATEMENT DUPLICATE_SCHEMA DUPLICATE_TABLE DUPLICATE_ALIAS ' +
    'DUPLICATE_OBJECT AMBIGUOUS_COLUMN AMBIGUOUS_FUNCTION AMBIGUOUS_PARAMETER AMBIGUOUS_ALIAS ' +
    'INVALID_COLUMN_REFERENCE INVALID_COLUMN_DEFINITION INVALID_CURSOR_DEFINITION ' +
    'INVALID_DATABASE_DEFINITION INVALID_FUNCTION_DEFINITION ' +
    'INVALID_PREPARED_STATEMENT_DEFINITION INVALID_SCHEMA_DEFINITION INVALID_TABLE_DEFINITION ' +
    'INVALID_OBJECT_DEFINITION WITH_CHECK_OPTION_VIOLATION INSUFFICIENT_RESOURCES DISK_FULL ' +
    'OUT_OF_MEMORY TOO_MANY_CONNECTIONS CONFIGURATION_LIMIT_EXCEEDED PROGRAM_LIMIT_EXCEEDED ' +
    'STATEMENT_TOO_COMPLEX TOO_MANY_COLUMNS TOO_MANY_ARGUMENTS OBJECT_NOT_IN_PREREQUISITE_STATE ' +
    'OBJECT_IN_USE CANT_CHANGE_RUNTIME_PARAM LOCK_NOT_AVAILABLE OPERATOR_INTERVENTION ' +
    'QUERY_CANCELED ADMIN_SHUTDOWN CRASH_SHUTDOWN CANNOT_CONNECT_NOW DATABASE_DROPPED ' +
    'SYSTEM_ERROR IO_ERROR UNDEFINED_FILE DUPLICATE_FILE SNAPSHOT_TOO_OLD CONFIG_FILE_ERROR ' +
    'LOCK_FILE_EXISTS FDW_ERROR FDW_COLUMN_NAME_NOT_FOUND FDW_DYNAMIC_PARAMETER_VALUE_NEEDED ' +
    'FDW_FUNCTION_SEQUENCE_ERROR FDW_INCONSISTENT_DESCRIPTOR_INFORMATION ' +
    'FDW_INVALID_ATTRIBUTE_VALUE FDW_INVALID_COLUMN_NAME FDW_INVALID_COLUMN_NUMBER ' +
    'FDW_INVALID_DATA_TYPE FDW_INVALID_DATA_TYPE_DESCRIPTORS ' +
    'FDW_INVALID_DESCRIPTOR_FIELD_IDENTIFIER FDW_INVALID_HANDLE FDW_INVALID_OPTION_INDEX ' +
    'FDW_INVALID_OPTION_NAME FDW_INVALID_STRING_LENGTH_OR_BUFFER_LENGTH ' +
    'FDW_INVALID_STRING_FORMAT FDW_INVALID_USE_OF_NULL_POINTER FDW_TOO_MANY_HANDLES ' +
    'FDW_OUT_OF_MEMORY FDW_NO_SCHEMAS FDW_OPTION_NAME_NOT_FOUND FDW_REPLY_HANDLE ' +
    'FDW_SCHEMA_NOT_FOUND FDW_TABLE_NOT_FOUND FDW_UNABLE_TO_CREATE_EXECUTION ' +
    'FDW_UNABLE_TO_CREATE_REPLY FDW_UNABLE_TO_ESTABLISH_CONNECTION PLPGSQL_ERROR ' +
    'RAISE_EXCEPTION NO_DATA_FOUND TOO_MANY_ROWS ASSERT_FAILURE INTERNAL_ERROR DATA_CORRUPTED ' +
    'INDEX_CORRUPTED ';

  var FUNCTIONS =
    // https://www.postgresql.org/docs/11/static/functions-aggregate.html
    'ARRAY_AGG AVG BIT_AND BIT_OR BOOL_AND BOOL_OR COUNT EVERY JSON_AGG JSONB_AGG JSON_OBJECT_AGG ' +
    'JSONB_OBJECT_AGG MAX MIN MODE STRING_AGG SUM XMLAGG ' +
    'CORR COVAR_POP COVAR_SAMP REGR_AVGX REGR_AVGY REGR_COUNT REGR_INTERCEPT REGR_R2 REGR_SLOPE ' +
    'REGR_SXX REGR_SXY REGR_SYY STDDEV STDDEV_POP STDDEV_SAMP VARIANCE VAR_POP VAR_SAMP ' +
    'PERCENTILE_CONT PERCENTILE_DISC ' +
    // https://www.postgresql.org/docs/11/static/functions-window.html
    'ROW_NUMBER RANK DENSE_RANK PERCENT_RANK CUME_DIST NTILE LAG LEAD FIRST_VALUE LAST_VALUE NTH_VALUE ' +
    // https://www.postgresql.org/docs/11/static/functions-comparison.html
    'NUM_NONNULLS NUM_NULLS ' +
    // https://www.postgresql.org/docs/11/static/functions-math.html
    'ABS CBRT CEIL CEILING DEGREES DIV EXP FLOOR LN LOG MOD PI POWER RADIANS ROUND SCALE SIGN SQRT ' +
    'TRUNC WIDTH_BUCKET ' +
    'RANDOM SETSEED ' +
    'ACOS ACOSD ASIN ASIND ATAN ATAND ATAN2 ATAN2D COS COSD COT COTD SIN SIND TAN TAND ' +
    // https://www.postgresql.org/docs/11/static/functions-string.html
    'BIT_LENGTH CHAR_LENGTH CHARACTER_LENGTH LOWER OCTET_LENGTH OVERLAY POSITION SUBSTRING TREAT TRIM UPPER ' +
    'ASCII BTRIM CHR CONCAT CONCAT_WS CONVERT CONVERT_FROM CONVERT_TO DECODE ENCODE INITCAP' +
    'LEFT LENGTH LPAD LTRIM MD5 PARSE_IDENT PG_CLIENT_ENCODING QUOTE_IDENT|10 QUOTE_LITERAL|10 ' +
    'QUOTE_NULLABLE|10 REGEXP_MATCH REGEXP_MATCHES REGEXP_REPLACE REGEXP_SPLIT_TO_ARRAY ' +
    'REGEXP_SPLIT_TO_TABLE REPEAT REPLACE REVERSE RIGHT RPAD RTRIM SPLIT_PART STRPOS SUBSTR ' +
    'TO_ASCII TO_HEX TRANSLATE ' +
    // https://www.postgresql.org/docs/11/static/functions-binarystring.html
    'OCTET_LENGTH GET_BIT GET_BYTE SET_BIT SET_BYTE ' +
    // https://www.postgresql.org/docs/11/static/functions-formatting.html
    'TO_CHAR TO_DATE TO_NUMBER TO_TIMESTAMP ' +
    // https://www.postgresql.org/docs/11/static/functions-datetime.html
    'AGE CLOCK_TIMESTAMP|10 DATE_PART DATE_TRUNC ISFINITE JUSTIFY_DAYS JUSTIFY_HOURS JUSTIFY_INTERVAL ' +
    'MAKE_DATE MAKE_INTERVAL|10 MAKE_TIME MAKE_TIMESTAMP|10 MAKE_TIMESTAMPTZ|10 NOW STATEMENT_TIMESTAMP|10 ' +
    'TIMEOFDAY TRANSACTION_TIMESTAMP|10 ' +
    // https://www.postgresql.org/docs/11/static/functions-enum.html
    'ENUM_FIRST ENUM_LAST ENUM_RANGE ' +
    // https://www.postgresql.org/docs/11/static/functions-geometry.html
    'AREA CENTER DIAMETER HEIGHT ISCLOSED ISOPEN NPOINTS PCLOSE POPEN RADIUS WIDTH ' +
    'BOX BOUND_BOX CIRCLE LINE LSEG PATH POLYGON ' +
    // https://www.postgresql.org/docs/11/static/functions-net.html
    'ABBREV BROADCAST HOST HOSTMASK MASKLEN NETMASK NETWORK SET_MASKLEN TEXT INET_SAME_FAMILY' +
    'INET_MERGE MACADDR8_SET7BIT ' +
    // https://www.postgresql.org/docs/11/static/functions-textsearch.html
    'ARRAY_TO_TSVECTOR GET_CURRENT_TS_CONFIG NUMNODE PLAINTO_TSQUERY PHRASETO_TSQUERY WEBSEARCH_TO_TSQUERY ' +
    'QUERYTREE SETWEIGHT STRIP TO_TSQUERY TO_TSVECTOR JSON_TO_TSVECTOR JSONB_TO_TSVECTOR TS_DELETE ' +
    'TS_FILTER TS_HEADLINE TS_RANK TS_RANK_CD TS_REWRITE TSQUERY_PHRASE TSVECTOR_TO_ARRAY ' +
    'TSVECTOR_UPDATE_TRIGGER TSVECTOR_UPDATE_TRIGGER_COLUMN ' +
    // https://www.postgresql.org/docs/11/static/functions-xml.html
    'XMLCOMMENT XMLCONCAT XMLELEMENT XMLFOREST XMLPI XMLROOT ' +
    'XMLEXISTS XML_IS_WELL_FORMED XML_IS_WELL_FORMED_DOCUMENT XML_IS_WELL_FORMED_CONTENT ' +
    'XPATH XPATH_EXISTS XMLTABLE XMLNAMESPACES ' +
    'TABLE_TO_XML TABLE_TO_XMLSCHEMA TABLE_TO_XML_AND_XMLSCHEMA ' +
    'QUERY_TO_XML QUERY_TO_XMLSCHEMA QUERY_TO_XML_AND_XMLSCHEMA ' +
    'CURSOR_TO_XML CURSOR_TO_XMLSCHEMA ' +
    'SCHEMA_TO_XML SCHEMA_TO_XMLSCHEMA SCHEMA_TO_XML_AND_XMLSCHEMA ' +
    'DATABASE_TO_XML DATABASE_TO_XMLSCHEMA DATABASE_TO_XML_AND_XMLSCHEMA ' +
    'XMLATTRIBUTES ' +
    // https://www.postgresql.org/docs/11/static/functions-json.html
    'TO_JSON TO_JSONB ARRAY_TO_JSON ROW_TO_JSON JSON_BUILD_ARRAY JSONB_BUILD_ARRAY JSON_BUILD_OBJECT ' +
    'JSONB_BUILD_OBJECT JSON_OBJECT JSONB_OBJECT JSON_ARRAY_LENGTH JSONB_ARRAY_LENGTH JSON_EACH ' +
    'JSONB_EACH JSON_EACH_TEXT JSONB_EACH_TEXT JSON_EXTRACT_PATH JSONB_EXTRACT_PATH ' +
    'JSON_OBJECT_KEYS JSONB_OBJECT_KEYS JSON_POPULATE_RECORD JSONB_POPULATE_RECORD JSON_POPULATE_RECORDSET ' +
    'JSONB_POPULATE_RECORDSET JSON_ARRAY_ELEMENTS JSONB_ARRAY_ELEMENTS JSON_ARRAY_ELEMENTS_TEXT ' +
    'JSONB_ARRAY_ELEMENTS_TEXT JSON_TYPEOF JSONB_TYPEOF JSON_TO_RECORD JSONB_TO_RECORD JSON_TO_RECORDSET ' +
    'JSONB_TO_RECORDSET JSON_STRIP_NULLS JSONB_STRIP_NULLS JSONB_SET JSONB_INSERT JSONB_PRETTY ' +
    // https://www.postgresql.org/docs/11/static/functions-sequence.html
    'CURRVAL LASTVAL NEXTVAL SETVAL ' +
    // https://www.postgresql.org/docs/11/static/functions-conditional.html
    'COALESCE NULLIF GREATEST LEAST ' +
    // https://www.postgresql.org/docs/11/static/functions-array.html
    'ARRAY_APPEND ARRAY_CAT ARRAY_NDIMS ARRAY_DIMS ARRAY_FILL ARRAY_LENGTH ARRAY_LOWER ARRAY_POSITION ' +
    'ARRAY_POSITIONS ARRAY_PREPEND ARRAY_REMOVE ARRAY_REPLACE ARRAY_TO_STRING ARRAY_UPPER CARDINALITY ' +
    'STRING_TO_ARRAY UNNEST ' +
    // https://www.postgresql.org/docs/11/static/functions-range.html
    'ISEMPTY LOWER_INC UPPER_INC LOWER_INF UPPER_INF RANGE_MERGE ' +
    // https://www.postgresql.org/docs/11/static/functions-srf.html
    'GENERATE_SERIES GENERATE_SUBSCRIPTS ' +
    // https://www.postgresql.org/docs/11/static/functions-info.html
    'CURRENT_DATABASE CURRENT_QUERY CURRENT_SCHEMA|10 CURRENT_SCHEMAS|10 INET_CLIENT_ADDR INET_CLIENT_PORT ' +
    'INET_SERVER_ADDR INET_SERVER_PORT ROW_SECURITY_ACTIVE FORMAT_TYPE ' +
    'TO_REGCLASS TO_REGPROC TO_REGPROCEDURE TO_REGOPER TO_REGOPERATOR TO_REGTYPE TO_REGNAMESPACE TO_REGROLE ' +
    'COL_DESCRIPTION OBJ_DESCRIPTION SHOBJ_DESCRIPTION ' +
    'TXID_CURRENT TXID_CURRENT_IF_ASSIGNED TXID_CURRENT_SNAPSHOT TXID_SNAPSHOT_XIP TXID_SNAPSHOT_XMAX ' +
    'TXID_SNAPSHOT_XMIN TXID_VISIBLE_IN_SNAPSHOT TXID_STATUS ' +
    // https://www.postgresql.org/docs/11/static/functions-admin.html
    'CURRENT_SETTING SET_CONFIG BRIN_SUMMARIZE_NEW_VALUES BRIN_SUMMARIZE_RANGE BRIN_DESUMMARIZE_RANGE ' +
    'GIN_CLEAN_PENDING_LIST ' +
    // https://www.postgresql.org/docs/11/static/functions-trigger.html
    'SUPPRESS_REDUNDANT_UPDATES_TRIGGER ' +
    // ihttps://www.postgresql.org/docs/devel/static/lo-funcs.html
    'LO_FROM_BYTEA LO_PUT LO_GET LO_CREAT LO_CREATE LO_UNLINK LO_IMPORT LO_EXPORT LOREAD LOWRITE ' +
    //
    'GROUPING CAST ';

    var FUNCTIONS_RE = 
      FUNCTIONS.trim()
               .split(' ')
               .map( function(val) { return val.split('|')[0]; } )
               .join('|');

    return {
        aliases: ['postgres','postgresql'],
        case_insensitive: true,
        keywords: {
          keyword:
            SQL_KW + PLPGSQL_KW + ROLE_ATTRS,
          built_in:
            SQL_BI + PLPGSQL_BI + PLPGSQL_EXCEPTIONS,
        },
        // Forbid some cunstructs from other languages to improve autodetect. In fact
        // "[a-z]:" is legal (as part of array slice), but improbabal.
        illegal: /:==|\W\s*\(\*|(^|\s)\$[a-z]|{{|[a-z]:\s*$|\.\.\.|TO:|DO:/,
        contains: [
          // special handling of some words, which are reserved only in some contexts
          {
            className: 'keyword',
            variants: [
              { begin: /\bTEXT\s*SEARCH\b/ },
              { begin: /\b(PRIMARY|FOREIGN|FOR(\s+NO)?)\s+KEY\b/ },
              { begin: /\bPARALLEL\s+(UNSAFE|RESTRICTED|SAFE)\b/ },
              { begin: /\bSTORAGE\s+(PLAIN|EXTERNAL|EXTENDED|MAIN)\b/ },
              { begin: /\bMATCH\s+(FULL|PARTIAL|SIMPLE)\b/ },
              { begin: /\bNULLS\s+(FIRST|LAST)\b/ },
              { begin: /\bEVENT\s+TRIGGER\b/ },
              { begin: /\b(MAPPING|OR)\s+REPLACE\b/ },
              { begin: /\b(FROM|TO)\s+(PROGRAM|STDIN|STDOUT)\b/ },
              { begin: /\b(SHARE|EXCLUSIVE)\s+MODE\b/ },
              { begin: /\b(LEFT|RIGHT)\s+(OUTER\s+)?JOIN\b/ },
              { begin: /\b(FETCH|MOVE)\s+(NEXT|PRIOR|FIRST|LAST|ABSOLUTE|RELATIVE|FORWARD|BACKWARD)\b/ },
              { begin: /\bPRESERVE\s+ROWS\b/ },
              { begin: /\bDISCARD\s+PLANS\b/ },
              { begin: /\bREFERENCING\s+(OLD|NEW)\b/ },
              { begin: /\bSKIP\s+LOCKED\b/ },
              { begin: /\bGROUPING\s+SETS\b/ },
              { begin: /\b(BINARY|INSENSITIVE|SCROLL|NO\s+SCROLL)\s+(CURSOR|FOR)\b/ },
              { begin: /\b(WITH|WITHOUT)\s+HOLD\b/ },
              { begin: /\bWITH\s+(CASCADED|LOCAL)\s+CHECK\s+OPTION\b/ },
              { begin: /\bEXCLUDE\s+(TIES|NO\s+OTHERS)\b/ },
              { begin: /\bFORMAT\s+(TEXT|XML|JSON|YAML)\b/ },
              { begin: /\bSET\s+((SESSION|LOCAL)\s+)?NAMES\b/ },
              { begin: /\bIS\s+(NOT\s+)?UNKNOWN\b/ },
              { begin: /\bSECURITY\s+LABEL\b/ },
              { begin: /\bSTANDALONE\s+(YES|NO|NO\s+VALUE)\b/ },
              { begin: /\bWITH\s+(NO\s+)?DATA\b/ },
              { begin: /\b(FOREIGN|SET)\s+DATA\b/ },
              { begin: /\bSET\s+(CATALOG|CONSTRAINTS)\b/ },
              { begin: /\b(WITH|FOR)\s+ORDINALITY\b/ },
              { begin: /\bIS\s+(NOT\s+)?DOCUMENT\b/ },
              { begin: /\bXML\s+OPTION\s+(DOCUMENT|CONTENT)\b/ },
              { begin: /\b(STRIP|PRESERVE)\s+WHITESPACE\b/ },
              { begin: /\bNO\s+(ACTION|MAXVALUE|MINVALUE)\b/ },
              { begin: /\bPARTITION\s+BY\s+(RANGE|LIST|HASH)\b/ },
              { begin: /\bAT\s+TIME\s+ZONE\b/ },
              { begin: /\bGRANTED\s+BY\b/ },
              { begin: /\bRETURN\s+(QUERY|NEXT)\b/ },
              { begin: /\b(ATTACH|DETACH)\s+PARTITION\b/ },
              { begin: /\bFORCE\s+ROW\s+LEVEL\s+SECURITY\b/ },
              { begin: /\b(INCLUDING|EXCLUDING)\s+(COMMENTS|CONSTRAINTS|DEFAULTS|IDENTITY|INDEXES|STATISTICS|STORAGE|ALL)\b/ },
              { begin: /\bAS\s+(ASSIGNMENT|IMPLICIT|PERMISSIVE|RESTRICTIVE|ENUM|RANGE)\b/ }
            ]
          },
          // functions named as keywords, followed by '('
          {
            begin: /\b(FORMAT|FAMILY|VERSION)\s*\(/,
            //keywords: { built_in: 'FORMAT FAMILY VERSION' }
          },
          // INCLUDE ( ... ) in index_parameters in CREATE TABLE
          {
            begin: /\bINCLUDE\s*\(/,
            keywords: 'INCLUDE'
          },
          // not highlight RANGE if not in frame_clause (not 100% correct, but seems satisfactory)
          {
            begin: /\bRANGE(?!\s*(BETWEEN|UNBOUNDED|CURRENT|[-0-9]+))/
          },
          // disable highlighting in commands CREATE AGGREGATE/COLLATION/DATABASE/OPERTOR/TEXT SEARCH .../TYPE
          // and in PL/pgSQL RAISE ... USING
          {
            begin: /\b(VERSION|OWNER|TEMPLATE|TABLESPACE|CONNECTION\s+LIMIT|PROCEDURE|RESTRICT|JOIN|PARSER|COPY|START|END|COLLATION|INPUT|ANALYZE|STORAGE|LIKE|DEFAULT|DELIMITER|ENCODING|COLUMN|CONSTRAINT|TABLE|SCHEMA)\s*=/
          },
          // PG_smth; HAS_some_PRIVILEGE
          {
            //className: 'built_in',
            begin: /\b(PG_\w+?|HAS_[A-Z_]+_PRIVILEGE)\b/,
            relevance: 10
          },
          // extract
          {
            begin: /\bEXTRACT\s*\(/,
            end: /\bFROM\b/,
            returnEnd: true,
            keywords: {
              //built_in: 'EXTRACT',
              type:     'CENTURY DAY DECADE DOW DOY EPOCH HOUR ISODOW ISOYEAR MICROSECONDS ' +
                        'MILLENNIUM MILLISECONDS MINUTE MONTH QUARTER SECOND TIMEZONE TIMEZONE_HOUR ' +
                        'TIMEZONE_MINUTE WEEK YEAR'
            }
          },
          // xmlelement, xmlpi - special NAME
          {
            begin: /\b(XMLELEMENT|XMLPI)\s*\(\s*NAME/,
            keywords: {
              //built_in: 'XMLELEMENT XMLPI',
              keyword:  'NAME'
            }
          },
          // xmlparse, xmlserialize
          {
            begin: /\b(XMLPARSE|XMLSERIALIZE)\s*\(\s*(DOCUMENT|CONTENT)/,
            keywords: {
              //built_in: 'XMLPARSE XMLSERIALIZE',
              keyword:  'DOCUMENT CONTENT'
            }
          },
          // Sequences. We actually skip everything between CACHE|INCREMENT|MAXVALUE|MINVALUE and
          // nearest following numeric constant. Without with trick we find a lot of "keywords"
          // in 'avrasm' autodetection test...
          {
            beginKeywords: 'CACHE INCREMENT MAXVALUE MINVALUE',
            end: hljs.C_NUMBER_RE,
            returnEnd: true,
            keywords: 'BY CACHE INCREMENT MAXVALUE MINVALUE'
          },
          // WITH|WITHOUT TIME ZONE as part of datatype
          {
            className: 'type',
            begin: /\b(WITH|WITHOUT)\s+TIME\s+ZONE\b/
          },
          // INTERVAL optional fields
          {
            className: 'type',
            begin: /\bINTERVAL\s+(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND)(\s+TO\s+(MONTH|HOUR|MINUTE|SECOND))?\b/
          },
          // Pseudo-types which allowed only as return type
          {
            begin: /\bRETURNS\s+(LANGUAGE_HANDLER|TRIGGER|EVENT_TRIGGER|FDW_HANDLER|INDEX_AM_HANDLER|TSM_HANDLER)\b/,
            keywords: {
              keyword: 'RETURNS',
              type: 'LANGUAGE_HANDLER TRIGGER EVENT_TRIGGER FDW_HANDLER INDEX_AM_HANDLER TSM_HANDLER'
            }
          },
          // Known functions - only when followed by '('
          {
            begin: '\\b(' + FUNCTIONS_RE + ')\\s*\\('
            //keywords: { built_in: FUNCTIONS }
          },
          // Types
          {
            begin: '\\.(' + TYPES_RE + ')\\b' // prevent highlight as type, say, 'oid' in 'pgclass.oid'
          },
          {
            begin: '\\b(' + TYPES_RE + ')\\s+PATH\\b', // in XMLTABLE
            keywords: {
              keyword: 'PATH', // hopefully no one would use PATH type in XMLTABLE...
              type: TYPES.replace('PATH ','')
            }
          },
          {
            className: 'type',
            begin: '\\b(' + TYPES_RE + ')\\b'
          },
          // Strings, see https://www.postgresql.org/docs/11/static/sql-syntax-lexical.html#SQL-SYNTAX-CONSTANTS
          {
            className: 'string',
            begin: '\'', end: '\'',
            contains: [{begin: '\'\''}]
          },
          {
            className: 'string',
            begin: '(e|E|u&|U&)\'', end: '\'',
            contains: [{begin: '\\\\.'}],
            relevance: 10
          },
          {
            begin: DOLLAR_STRING,
            endSameAsBegin: true,
            contains: [
              {
                // actually we want them all except SQL; listed are those with known implementations
                // and XML + JSON just in case
                subLanguage: ['pgsql','perl','python','tcl','r','lua','java','php','ruby','bash','scheme','xml','json'],
                endsWithParent: true
              }
            ]
          },
          // identifiers in quotes
          {
            begin: '"', end: '"',
            contains: [{begin: '""'}]
          },
          // numbers
          hljs.C_NUMBER_MODE,
          // comments
          hljs.C_BLOCK_COMMENT_MODE,
          COMMENT_MODE,
          // PL/pgSQL staff
          // %ROWTYPE, %TYPE, $n
          {
            className: 'meta',
            variants: [
              {begin: '%(ROW)?TYPE', relevance: 10}, // %TYPE, %ROWTYPE
              {begin: '\\$\\d+'},                    // $n
              {begin: '^#\\w', end: '$'}             // #compiler option
            ]
          },
          // <<labeles>>
          {
            className: 'symbol',
            begin: LABEL,
            relevance: 10
          }
        ]
  };
}
},{name:"prolog",create:/*
Language: Prolog
Description: Prolog is a general purpose logic programming language associated with artificial intelligence and computational linguistics.
Author: Raivo Laanemets <raivo@infdot.com>
*/

function(hljs) {

  var ATOM = {

    begin: /[a-z][A-Za-z0-9_]*/,
    relevance: 0
  };

  var VAR = {

    className: 'symbol',
    variants: [
      {begin: /[A-Z][a-zA-Z0-9_]*/},
      {begin: /_[A-Za-z0-9_]*/},
    ],
    relevance: 0
  };

  var PARENTED = {

    begin: /\(/,
    end: /\)/,
    relevance: 0
  };

  var LIST = {

    begin: /\[/,
    end: /\]/
  };

  var LINE_COMMENT = {

    className: 'comment',
    begin: /%/, end: /$/,
    contains: [hljs.PHRASAL_WORDS_MODE]
  };

  var BACKTICK_STRING = {

    className: 'string',
    begin: /`/, end: /`/,
    contains: [hljs.BACKSLASH_ESCAPE]
  };

  var CHAR_CODE = {

    className: 'string', // 0'a etc.
    begin: /0\'(\\\'|.)/
  };

  var SPACE_CODE = {

    className: 'string',
    begin: /0\'\\s/ // 0'\s
  };

  var PRED_OP = { // relevance booster
    begin: /:-/
  };

  var inner = [

    ATOM,
    VAR,
    PARENTED,
    PRED_OP,
    LIST,
    LINE_COMMENT,
    hljs.C_BLOCK_COMMENT_MODE,
    hljs.QUOTE_STRING_MODE,
    hljs.APOS_STRING_MODE,
    BACKTICK_STRING,
    CHAR_CODE,
    SPACE_CODE,
    hljs.C_NUMBER_MODE
  ];

  PARENTED.contains = inner;
  LIST.contains = inner;

  return {
    contains: inner.concat([
      {begin: /\.$/} // relevance booster
    ])
  };
}
},{name:"python",create:/*
Language: Python
Category: common
*/

function(hljs) {
  var KEYWORDS = {
    keyword:
      'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield|10',
    built_in:
      'Ellipsis NotImplemented __import__ abs all any ascii bin bool breakpoint bytearray bytes callable chr classmethod compile complex delattr dict dir divmod enumerate eval exec filter float format frozenset getattr globals hasattr hash help hex id input int isinstance issubclass iter len list locals map max memoryview min next object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip',
    literal: 'False None True'
  };
  var PROMPT = {
    className: 'meta',  begin: /^(>>>|\.\.\.) /
  };
  var SUBST = {
    className: 'subst',
    begin: /\{/, end: /\}/,
    keywords: KEYWORDS,
    illegal: /#/
  };
  var STRING = {
    className: 'string',
    contains: [hljs.BACKSLASH_ESCAPE],
    variants: [
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?r?'''/, end: /'''/,
        contains: [hljs.BACKSLASH_ESCAPE, PROMPT],
        relevance: 10
      },
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?r?"""/, end: /"""/,
        contains: [hljs.BACKSLASH_ESCAPE, PROMPT],
        relevance: 10
      },
      {
        begin: /(u|b)?r?'''/, end: /'''/,
        contains: [hljs.BACKSLASH_ESCAPE, PROMPT],
        relevance: 10
      },
      {
        begin: /(u|b)?r?"""/, end: /"""/,
        contains: [hljs.BACKSLASH_ESCAPE, PROMPT],
        relevance: 10
      },
      {
        begin: /(fr|rf|f)'''/, end: /'''/,
        contains: [hljs.BACKSLASH_ESCAPE, PROMPT, SUBST]
      },
      {
        begin: /(fr|rf|f)"""/, end: /"""/,
        contains: [hljs.BACKSLASH_ESCAPE, PROMPT, SUBST]
      },
      {
        begin: /(u|r|ur)'/, end: /'/,
        relevance: 10
      },
      {
        begin: /(u|r|ur)"/, end: /"/,
        relevance: 10
      },
      {
        begin: /(b|br)'/, end: /'/
      },
      {
        begin: /(b|br)"/, end: /"/
      },
      {
        begin: /(fr|rf|f)'/, end: /'/,
        contains: [hljs.BACKSLASH_ESCAPE, SUBST]
      },
      {
        begin: /(fr|rf|f)"/, end: /"/,
        contains: [hljs.BACKSLASH_ESCAPE, SUBST]
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE
    ]
  };
  var NUMBER = {
    className: 'number', relevance: 0,
    variants: [
      {begin: hljs.BINARY_NUMBER_RE + '[lLjJ]?'},
      {begin: '\\b(0o[0-7]+)[lLjJ]?'},
      {begin: hljs.C_NUMBER_RE + '[lLjJ]?'}
    ]
  };
  var PARAMS = {
    className: 'params',
    begin: /\(/, end: /\)/,
    contains: ['self', PROMPT, NUMBER, STRING]
  };
  SUBST.contains = [STRING, NUMBER, PROMPT];
  return {
    aliases: ['py', 'gyp', 'ipython'],
    keywords: KEYWORDS,
    illegal: /(<\/|->|\?)|=>/,
    contains: [
      PROMPT,
      NUMBER,
      STRING,
      hljs.HASH_COMMENT_MODE,
      {
        variants: [
          {className: 'function', beginKeywords: 'def'},
          {className: 'class', beginKeywords: 'class'}
        ],
        end: /:/,
        illegal: /[${=;\n,]/,
        contains: [
          hljs.UNDERSCORE_TITLE_MODE,
          PARAMS,
          {
            begin: /->/, endsWithParent: true,
            keywords: 'None'
          }
        ]
      },
      {
        className: 'meta',
        begin: /^[\t ]*@/, end: /$/
      }
    ]
  };
}
},{name:"pythonrepl",create:/*
Language: Python REPL
Requires: python.js
Author: Josh Goebel <hello@joshgoebel.com>
Category: common
*/

function(hljs) {
  return {
    aliases: [ 'python-repl', 'pycon' ],
    contains: [
      {
        className: 'meta',
        starts: {
          // a space separates the REPL prefix from the actual code
          // this is purely for cleaner HTML output
          end: / |$/,
          starts: {
            end: '$',
            subLanguage: 'python'
          }
        },
        variants: [
          {
            begin: /^>>>(?=[ ]|$)/
          },
          {
            begin: /^\.\.\.(?=[ ]|$)/
          }
        ]
      }, {
        className: 'error',
        begin: /Value|Syntax|ZeroDivision|Name|Type|Runtime|Index|Key|Recursion/,
        end: /Error/,
        relevance: 10
      }, {
        className: 'output',
        end: /(?<!^(>>>|\.\.\.)>)(\r|\n)/
      }
    ]
  };
}
},{name:"rust",create:/*
Language: Rust
Author: Andrey Vlasovskikh <andrey.vlasovskikh@gmail.com>
Contributors: Roman Shmatov <romanshmatov@gmail.com>, Kasper Andersen <kma_untrusted@protonmail.com>
Category: system
*/

function(hljs) {
  var NUM_SUFFIX = '([ui](8|16|32|64|128|size)|f(32|64))\?';
  var KEYWORDS =
    'abstract as async await become box break const continue crate do dyn ' +
    'else enum extern false final fn for if impl in let loop macro match mod ' +
    'move mut override priv pub ref return self Self static struct super ' +
    'trait true try type typeof unsafe unsized use virtual where while yield';
  var BUILTINS =
    // functions
    'drop ' +
    // types
    'i8 i16 i32 i64 i128 isize ' +
    'u8 u16 u32 u64 u128 usize ' +
    'f32 f64 ' +
    'str char bool ' +
    'Box Option Result String Vec ' +
    // traits
    'Copy Send Sized Sync Drop Fn FnMut FnOnce ToOwned Clone Debug ' +
    'PartialEq PartialOrd Eq Ord AsRef AsMut Into From Default Iterator ' +
    'Extend IntoIterator DoubleEndedIterator ExactSizeIterator ' +
    'SliceConcatExt ToString ' +
    // macros
    'assert! assert_eq! bitflags! bytes! cfg! col! concat! concat_idents! ' +
    'debug_assert! debug_assert_eq! env! panic! file! format! format_args! ' +
    'include_bin! include_str! line! local_data_key! module_path! ' +
    'option_env! print! println! select! stringify! try! unimplemented! ' +
    'unreachable! vec! write! writeln! macro_rules! assert_ne! debug_assert_ne!';
  return {
    aliases: ['rs'],
    keywords: {
      keyword:
        KEYWORDS,
      literal:
        'true false Some None Ok Err',
      built_in:
        BUILTINS
    },
    lexemes: hljs.IDENT_RE + '!?',
    illegal: '</',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.COMMENT('/\\*', '\\*/', {contains: ['self']}),
      hljs.inherit(hljs.QUOTE_STRING_MODE, {begin: /b?"/, illegal: null}),
      {
        className: 'string',
        variants: [
           { begin: /r(#*)"(.|\n)*?"\1(?!#)/ },
           { begin: /b?'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/ }
        ]
      },
      {
        className: 'symbol',
        begin: /'[a-zA-Z_][a-zA-Z0-9_]*/
      },
      {
        className: 'number',
        variants: [
          { begin: '\\b0b([01_]+)' + NUM_SUFFIX },
          { begin: '\\b0o([0-7_]+)' + NUM_SUFFIX },
          { begin: '\\b0x([A-Fa-f0-9_]+)' + NUM_SUFFIX },
          { begin: '\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)' +
                   NUM_SUFFIX
          }
        ],
        relevance: 0
      },
      {
        className: 'function',
        beginKeywords: 'fn', end: '(\\(|<)', excludeEnd: true,
        contains: [hljs.UNDERSCORE_TITLE_MODE]
      },
      {
        className: 'meta',
        begin: '#\\!?\\[', end: '\\]',
        contains: [
          {
            className: 'meta-string',
            begin: /"/, end: /"/
          }
        ]
      },
      {
        className: 'class',
        beginKeywords: 'type', end: ';',
        contains: [
          hljs.inherit(hljs.UNDERSCORE_TITLE_MODE, {endsParent: true})
        ],
        illegal: '\\S'
      },
      {
        className: 'class',
        beginKeywords: 'trait enum struct union', end: '{',
        contains: [
          hljs.inherit(hljs.UNDERSCORE_TITLE_MODE, {endsParent: true})
        ],
        illegal: '[\\w\\d]'
      },
      {
        begin: hljs.IDENT_RE + '::',
        keywords: {built_in: BUILTINS}
      },
      {
        begin: '->'
      }
    ]
  };
}
},{name:"scala",create:/*
Language: Scala
Category: functional
Author: Jan Berkel <jan.berkel@gmail.com>
Contributors: Erik Osheim <d_m@plastic-idolatry.com>
*/

function(hljs) {

  var ANNOTATION = { className: 'meta', begin: '@[A-Za-z]+' };

  // used in strings for escaping/interpolation/substitution
  var SUBST = {
    className: 'subst',
    variants: [
      {begin: '\\$[A-Za-z0-9_]+'},
      {begin: '\\${', end: '}'}
    ]
  };

  var STRING = {
    className: 'string',
    variants: [
      {
        begin: '"', end: '"',
        illegal: '\\n',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        begin: '"""', end: '"""',
        relevance: 10
      },
      {
        begin: '[a-z]+"', end: '"',
        illegal: '\\n',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST]
      },
      {
        className: 'string',
        begin: '[a-z]+"""', end: '"""',
        contains: [SUBST],
        relevance: 10
      }
    ]

  };

  var SYMBOL = {
    className: 'symbol',
    begin: '\'\\w[\\w\\d_]*(?!\')'
  };

  var TYPE = {
    className: 'type',
    begin: '\\b[A-Z][A-Za-z0-9_]*',
    relevance: 0
  };

  var NAME = {
    className: 'title',
    begin: /[^0-9\n\t "'(),.`{}\[\]:;][^\n\t "'(),.`{}\[\]:;]+|[^0-9\n\t "'(),.`{}\[\]:;=]/,
    relevance: 0
  };

  var CLASS = {
    className: 'class',
    beginKeywords: 'class object trait type',
    end: /[:={\[\n;]/,
    excludeEnd: true,
    contains: [
      {
        beginKeywords: 'extends with',
        relevance: 10
      },
      {
        begin: /\[/,
        end: /\]/,
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0,
        contains: [TYPE]
      },
      {
        className: 'params',
        begin: /\(/,
        end: /\)/,
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0,
        contains: [TYPE]
      },
      NAME
    ]
  };

  var METHOD = {
    className: 'function',
    beginKeywords: 'def',
    end: /[:={\[(\n;]/,
    excludeEnd: true,
    contains: [NAME]
  };

  return {
    keywords: {
      literal: 'true false null',
      keyword: 'type yield lazy override def with val var sealed abstract private trait object if forSome for while throw finally protected extends import final return else break new catch super class case package default try this match continue throws implicit'
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      STRING,
      SYMBOL,
      TYPE,
      METHOD,
      CLASS,
      hljs.C_NUMBER_MODE,
      ANNOTATION
    ]
  };
}
},{name:"scheme",create:/*
Language: Scheme
Description: Keywords based on http://community.schemewiki.org/?scheme-keywords
Author: JP Verkamp <me@jverkamp.com>
Contributors: Ivan Sagalaev <maniac@softwaremaniacs.org>
Origin: clojure.js
Category: lisp
*/

function(hljs) {
  var SCHEME_IDENT_RE = '[^\\(\\)\\[\\]\\{\\}",\'`;#|\\\\\\s]+';
  var SCHEME_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+([./]\\d+)?';
  var SCHEME_COMPLEX_NUMBER_RE = SCHEME_SIMPLE_NUMBER_RE + '[+\\-]' + SCHEME_SIMPLE_NUMBER_RE + 'i';
  var BUILTINS = {
    'builtin-name':
      'case-lambda call/cc class define-class exit-handler field import ' +
      'inherit init-field interface let*-values let-values let/ec mixin ' +
      'opt-lambda override protect provide public rename require ' +
      'require-for-syntax syntax syntax-case syntax-error unit/sig unless ' +
      'when with-syntax and begin call-with-current-continuation ' +
      'call-with-input-file call-with-output-file case cond define ' +
      'define-syntax delay do dynamic-wind else for-each if lambda let let* ' +
      'let-syntax letrec letrec-syntax map or syntax-rules \' * + , ,@ - ... / ' +
      '; < <= = => > >= ` abs acos angle append apply asin assoc assq assv atan ' +
      'boolean? caar cadr call-with-input-file call-with-output-file ' +
      'call-with-values car cdddar cddddr cdr ceiling char->integer ' +
      'char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? ' +
      'char-downcase char-lower-case? char-numeric? char-ready? char-upcase ' +
      'char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? ' +
      'char? close-input-port close-output-port complex? cons cos ' +
      'current-input-port current-output-port denominator display eof-object? ' +
      'eq? equal? eqv? eval even? exact->inexact exact? exp expt floor ' +
      'force gcd imag-part inexact->exact inexact? input-port? integer->char ' +
      'integer? interaction-environment lcm length list list->string ' +
      'list->vector list-ref list-tail list? load log magnitude make-polar ' +
      'make-rectangular make-string make-vector max member memq memv min ' +
      'modulo negative? newline not null-environment null? number->string ' +
      'number? numerator odd? open-input-file open-output-file output-port? ' +
      'pair? peek-char port? positive? procedure? quasiquote quote quotient ' +
      'rational? rationalize read read-char real-part real? remainder reverse ' +
      'round scheme-report-environment set! set-car! set-cdr! sin sqrt string ' +
      'string->list string->number string->symbol string-append string-ci<=? ' +
      'string-ci<? string-ci=? string-ci>=? string-ci>? string-copy ' +
      'string-fill! string-length string-ref string-set! string<=? string<? ' +
      'string=? string>=? string>? string? substring symbol->string symbol? ' +
      'tan transcript-off transcript-on truncate values vector ' +
      'vector->list vector-fill! vector-length vector-ref vector-set! ' +
      'with-input-from-file with-output-to-file write write-char zero?'
  };

  var SHEBANG = {
    className: 'meta',
    begin: '^#!',
    end: '$'
  };

  var LITERAL = {
    className: 'literal',
    begin: '(#t|#f|#\\\\' + SCHEME_IDENT_RE + '|#\\\\.)'
  };

  var NUMBER = {
    className: 'number',
    variants: [
      { begin: SCHEME_SIMPLE_NUMBER_RE, relevance: 0 },
      { begin: SCHEME_COMPLEX_NUMBER_RE, relevance: 0 },
      { begin: '#b[0-1]+(/[0-1]+)?' },
      { begin: '#o[0-7]+(/[0-7]+)?' },
      { begin: '#x[0-9a-f]+(/[0-9a-f]+)?' }
    ]
  };

  var STRING = hljs.QUOTE_STRING_MODE;

  var REGULAR_EXPRESSION = {
    className: 'regexp',
    begin: '#[pr]x"',
    end: '[^\\\\]"'
  };

  var COMMENT_MODES = [
    hljs.COMMENT(
      ';',
      '$',
      {
        relevance: 0
      }
    ),
    hljs.COMMENT('#\\|', '\\|#')
  ];

  var IDENT = {
    begin: SCHEME_IDENT_RE,
    relevance: 0
  };

  var QUOTED_IDENT = {
    className: 'symbol',
    begin: '\'' + SCHEME_IDENT_RE
  };

  var BODY = {
    endsWithParent: true,
    relevance: 0
  };

  var QUOTED_LIST = {
    variants: [
      { begin: /'/ },
      { begin: '`' }
    ],
    contains: [
      {
        begin: '\\(', end: '\\)',
        contains: ['self', LITERAL, STRING, NUMBER, IDENT, QUOTED_IDENT]
      }
    ]
  };

  var NAME = {
    className: 'name',
    begin: SCHEME_IDENT_RE,
    lexemes: SCHEME_IDENT_RE,
    keywords: BUILTINS
  };

  var LAMBDA = {
    begin: /lambda/, endsWithParent: true, returnBegin: true,
    contains: [
      NAME,
      {
        begin: /\(/, end: /\)/, endsParent: true,
        contains: [IDENT],
      }
    ]
  };

  var LIST = {
    variants: [
      { begin: '\\(', end: '\\)' },
      { begin: '\\[', end: '\\]' }
    ],
    contains: [LAMBDA, NAME, BODY]
  };

  BODY.contains = [LITERAL, NUMBER, STRING, IDENT, QUOTED_IDENT, QUOTED_LIST, LIST].concat(COMMENT_MODES);

  return {
    illegal: /\S/,
    contains: [SHEBANG, NUMBER, STRING, QUOTED_IDENT, QUOTED_LIST, LIST].concat(COMMENT_MODES)
  };
}
},{name:"sqc",create:/*
 Language: SQL (Case-Sensitive)
 Contributors: Nikolay Lisienko <info@neor.ru>, Heiko August <post@auge8472.de>, Travis Odom <travis.a.odom@gmail.com>, Vadimtro <vadimtro@yahoo.com>, Benjamin Auder <benjamin.auder@gmail.com>
 Category: common
 */

function(hljs) {
  var COMMENT_MODE = hljs.COMMENT('--', '$');
  var COMMENT_MODE2 = hljs.COMMENT('//', '$');
  return {
    case_insensitive: false,
    illegal: /[<>{}*]/,
    contains: [
      {
        beginKeywords:
          'BEGIN END START COMMIT ROLLBACK SAVEPOINT LOCK ALTER CREATE DROP RENAME CALL DELETE DO HANDLER INSERT LOAD REPLACE SELECT TRUNCATE UPDATE SET SHOW PRAGMA GRANT MERGE DESCRIBE USE EXPLAIN HELP DECLARE PREPARE EXECUTE DEALLOCATE RELEASE UNLOCK PURGE RESET CHANGE STOP ANALYZE CACHE FLUSH OPTIMIZE REPAIR KILL INSTALL UNINSTALL CHECKSUM RESTORE CHECK BACKUP REVOKE COMMENT VALUES WITH',
        end: /;/, endsWithParent: true,
        lexemes: /[\w\.]+/,
        keywords: {
          keyword:
            'AS ABORT ABS ABSOLUTE ACC ACCE ACCEP ACCEPT ACCESS ACCESSED ACCESSIBLE ACCOUNT ACOS ACTION ACTIVATE ADD ADDTIME ADMIN ADMINISTER ADVANCED ADVISE AES_DECRYPT AES_ENCRYPT AFTER AGENT AGGREGATE ALI ALIA ALIAS ALL ALLOCATE ALLOW ALTER ALWAYS ANALYZE ANCILLARY AND ANTI ANY ANYDATA ANYDATASET ANYSCHEMA ANYTYPE APPLY ARCHIVE ARCHIVED ARCHIVELOG ARE AS ASC ASCII ASIN ASSEMBLY ASSERTION ASSOCIATE ASYNCHRONOUS AT ATAN ATN2 ATTR ATTRI ATTRIB ATTRIBU ATTRIBUT ATTRIBUTE ATTRIBUTES AUDIT AUTHENTICATED AUTHENTICATION AUTHID AUTHORS AUTO AUTOALLOCATE AUTODBLINK AUTOEXTEND AUTOMATIC AVAILABILITY AVG BACKUP BADFILE BASICFILE BEFORE BEGIN BEGINNING BENCHMARK BETWEEN BFILE BFILE_BASE BIG BIGFILE BIN BINARY_DOUBLE BINARY_FLOAT BINLOG BIT_AND BIT_COUNT BIT_LENGTH BIT_OR BIT_XOR BITMAP BLOB_BASE BLOCK BLOCKSIZE BODY BOTH BOUND BUCKET BUFFER_CACHE BUFFER_POOL BUILD BULK BY BYTE BYTEORDERMARK BYTES CACHE CACHING CALL CALLING CANCEL CAPACITY CASCADE CASCADED CASE CAST CATALOG CATEGORY CEIL CEILING CHAIN CHANGE CHANGED CHAR_BASE CHAR_LENGTH CHARACTER_LENGTH CHARACTERS CHARACTERSET CHARINDEX CHARSET CHARSETFORM CHARSETID CHECK CHECKSUM CHECKSUM_AGG CHILD CHOOSE CHR CHUNK CLASS CLEANUP CLEAR CLIENT CLOB CLOB_BASE CLONE CLOSE CLUSTER_ID CLUSTER_PROBABILITY CLUSTER_SET CLUSTERING COALESCE COERCIBILITY COL COLLATE COLLATION COLLECT COLU COLUM COLUMN COLUMN_VALUE COLUMNS COLUMNS_UPDATED COMMENT COMMIT COMPACT COMPATIBILITY COMPILED COMPLETE COMPOSITE_LIMIT COMPOUND COMPRESS COMPUTE CONCAT CONCAT_WS CONCURRENT CONFIRM CONN CONNEC CONNECT CONNECT_BY_ISCYCLE CONNECT_BY_ISLEAF CONNECT_BY_ROOT CONNECT_TIME CONNECTION CONSIDER CONSISTENT CONSTANT CONSTRAINT CONSTRAINTS CONSTRUCTOR CONTAINER CONTENT CONTENTS CONTEXT CONTRIBUTORS CONTROLFILE CONV CONVERT CONVERT_TZ CORR CORR_K CORR_S CORRESPONDING CORRUPTION COS COST COUNT COUNT_BIG COUNTED COVAR_POP COVAR_SAMP CPU_PER_CALL CPU_PER_SESSION CRC32 CREATE CREATION CRITICAL CROSS CUBE CUME_DIST CURDATE CURRENT CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP CURRENT_USER CURSOR CURTIME CUSTOMDATUM CYCLE DATA DATABASE DATABASES DATAFILE DATAFILES DATALENGTH DATE_ADD DATE_CACHE DATE_FORMAT DATE_SUB DATEADD DATEDIFF DATEFROMPARTS DATENAME DATEPART DATETIME2FROMPARTS DAY DAY_TO_SECOND DAYNAME DAYOFMONTH DAYOFWEEK DAYOFYEAR DAYS DB_ROLE_CHANGE DBTIMEZONE DDL DEALLOCATE DECLARE DECODE DECOMPOSE DECREMENT DECRYPT DEDUPLICATE DEF DEFA DEFAU DEFAUL DEFAULT DEFAULTS DEFERRABLE DEFERRED DEFI DEFIN DEFINE DEGREES DELAYED DELEGATE DELETE DELETE_ALL DELIMITED DEMAND DENSE_RANK DEPTH DEQUEUE DES_DECRYPT DES_ENCRYPT DES_KEY_FILE DESC DESCR DESCRI DESCRIB DESCRIBE DESCRIPTOR DETERMINISTIC DIAGNOSTICS DIFFERENCE DIMENSION DIRECT_LOAD DIRECTORY DISABLE DISABLE_ALL DISALLOW DISASSOCIATE DISCARDFILE DISCONNECT DISKGROUP DISTINCT DISTINCTROW DISTRIBUTE DISTRIBUTED DIV DO DOCUMENT DOMAIN DOTNET DOUBLE DOWNGRADE DROP DUMPFILE DUPLICATE DURATION EACH EDITION EDITIONABLE EDITIONS ELEMENT ELLIPSIS ELSE ELSIF ELT EMPTY ENABLE ENABLE_ALL ENCLOSED ENCODE ENCODING ENCRYPT END END-EXEC ENDIAN ENFORCED ENGINE ENGINES ENQUEUE ENTERPRISE ENTITYESCAPING EOMONTH ERROR ERRORS ESCAPED EVALNAME EVALUATE EVENT EVENTDATA EVENTS EXCEPT EXCEPTION EXCEPTIONS EXCHANGE EXCLUDE EXCLUDING EXECU EXECUT EXECUTE EXEMPT EXISTS EXIT EXP EXPIRE EXPLAIN EXPLODE EXPORT EXPORT_SET EXTENDED EXTENT EXTERNAL EXTERNAL_1 EXTERNAL_2 EXTERNALLY EXTRACT FAILED FAILED_LOGIN_ATTEMPTS FAILOVER FAILURE FAR FAST FEATURE_SET FEATURE_VALUE FETCH FIELD FIELDS FILE FILE_NAME_CONVERT FILESYSTEM_LIKE_LOGGING FINAL FINISH FIRST FIRST_VALUE FIXED FLASH_CACHE FLASHBACK FLOOR FLUSH FOLLOWING FOLLOWS FOR FORALL FORCE FOREIGN FORM FORMA FORMAT FOUND FOUND_ROWS FREELIST FREELISTS FREEPOOLS FRESH FROM FROM_BASE64 FROM_DAYS FTP FULL FUNCTION GENERAL GENERATED GET GET_FORMAT GET_LOCK GETDATE GETUTCDATE GLOBAL GLOBAL_NAME GLOBALLY GO GOTO GRANT GRANTS GREATEST GROUP GROUP_CONCAT GROUP_ID GROUPING GROUPING_ID GROUPS GTID_SUBTRACT GUARANTEE GUARD HANDLER HASH HASHKEYS HAVING HEA HEAD HEADI HEADIN HEADING HEAP HELP HEX HIERARCHY HIGH HIGH_PRIORITY HOSTS HOUR HOURS HTTP ID IDENT_CURRENT IDENT_INCR IDENT_SEED IDENTIFIED IDENTITY IDLE_TIME IF IFNULL IGNORE IIF ILIKE ILM IMMEDIATE IMPORT IN INCLUDE INCLUDING INCREMENT INDEX INDEXES INDEXING INDEXTYPE INDICATOR INDICES INET6_ATON INET6_NTOA INET_ATON INET_NTOA INFILE INITIAL INITIALIZED INITIALLY INITRANS INMEMORY INNER INNODB INPUT INSERT INSTALL INSTANCE INSTANTIABLE INSTR INTERFACE INTERLEAVED INTERSECT INTO INVALIDATE INVISIBLE IS IS_FREE_LOCK IS_IPV4 IS_IPV4_COMPAT IS_NOT IS_NOT_NULL IS_USED_LOCK ISDATE ISNULL ISOLATION ITERATE JAVA JOIN JSON JSON_EXISTS KEEP KEEP_DUPLICATES KEY KEYS KILL LANGUAGE LARGE LAST LAST_DAY LAST_INSERT_ID LAST_VALUE LATERAL LAX LCASE LEAD LEADING LEAST LEAVES LEFT LEN LENGHT LENGTH LESS LEVEL LEVELS LIBRARY LIKE LIKE2 LIKE4 LIKEC LIMIT LINES LINK LIST LISTAGG LITTLE LN LOAD LOAD_FILE LOB LOBS LOCAL LOCALTIME LOCALTIMESTAMP LOCATE LOCATOR LOCK LOCKED LOG LOG10 LOG2 LOGFILE LOGFILES LOGGING LOGICAL LOGICAL_READS_PER_CALL LOGOFF LOGON LOGS LONG LOOP LOW LOW_PRIORITY LOWER LPAD LRTRIM LTRIM MAIN MAKE_SET MAKEDATE MAKETIME MANAGED MANAGEMENT MANUAL MAP MAPPING MASK MASTER MASTER_POS_WAIT MATCH MATCHED MATERIALIZED MAX MAXEXTENTS MAXIMIZE MAXINSTANCES MAXLEN MAXLOGFILES MAXLOGHISTORY MAXLOGMEMBERS MAXSIZE MAXTRANS MD5 MEASURES MEDIAN MEDIUM MEMBER MEMCOMPRESS MEMORY MERGE MICROSECOND MID MIGRATION MIN MINEXTENTS MINIMUM MINING MINUS MINUTE MINUTES MINVALUE MISSING MOD MODE MODEL MODIFICATION MODIFY MODULE MONITORING MONTH MONTHS MOUNT MOVE MOVEMENT MULTISET MUTEX NAME NAME_CONST NAMES NAN NATIONAL NATIVE NATURAL NAV NCHAR NCLOB NESTED NEVER NEW NEWLINE NEXT NEXTVAL NO NO_WRITE_TO_BINLOG NOARCHIVELOG NOAUDIT NOBADFILE NOCHECK NOCOMPRESS NOCOPY NOCYCLE NODELAY NODISCARDFILE NOENTITYESCAPING NOGUARANTEE NOKEEP NOLOGFILE NOMAPPING NOMAXVALUE NOMINIMIZE NOMINVALUE NOMONITORING NONE NONEDITIONABLE NONSCHEMA NOORDER NOPR NOPRO NOPROM NOPROMP NOPROMPT NORELY NORESETLOGS NOREVERSE NORMAL NOROWDEPENDENCIES NOSCHEMACHECK NOSWITCH NOT NOTHING NOTICE NOTNULL NOTRIM NOVALIDATE NOW NOWAIT NTH_VALUE NULLIF NULLS NUM NUMB NUMBE NVARCHAR NVARCHAR2 OBJECT OCICOLL OCIDATE OCIDATETIME OCIDURATION OCIINTERVAL OCILOBLOCATOR OCINUMBER OCIREF OCIREFCURSOR OCIROWID OCISTRING OCITYPE OCT OCTET_LENGTH OF OFF OFFLINE OFFSET OID OIDINDEX OLD ON ONLINE ONLY OPAQUE OPEN OPERATIONS OPERATOR OPTIMAL OPTIMIZE OPTION OPTIONALLY OR ORACLE ORACLE_DATE ORADATA ORD ORDAUDIO ORDDICOM ORDDOC ORDER ORDIMAGE ORDINALITY ORDVIDEO ORGANIZATION ORLANY ORLVARY OUT OUTER OUTFILE OUTLINE OUTPUT OVER OVERFLOW OVERRIDING PACKAGE PAD PARALLEL PARALLEL_ENABLE PARAMETERS PARENT PARSE PARTIAL PARTITION PARTITIONS PASCAL PASSING PASSWORD PASSWORD_GRACE_TIME PASSWORD_LOCK_TIME PASSWORD_REUSE_MAX PASSWORD_REUSE_TIME PASSWORD_VERIFY_FUNCTION PATCH PATH PATINDEX PCTINCREASE PCTTHRESHOLD PCTUSED PCTVERSION PERCENT PERCENT_RANK PERCENTILE_CONT PERCENTILE_DISC PERFORMANCE PERIOD PERIOD_ADD PERIOD_DIFF PERMANENT PHYSICAL PI PIPE PIPELINED PIVOT PLUGGABLE PLUGIN POLICY POSITION POST_TRANSACTION POW POWER PRAGMA PREBUILT PRECEDES PRECEDING PRECISION PREDICTION PREDICTION_COST PREDICTION_DETAILS PREDICTION_PROBABILITY PREDICTION_SET PREPARE PRESENT PRESERVE PRIMARY PRIOR PRIORITY PRIVATE PRIVATE_SGA PRIVILEGES PROCEDURAL PROCEDURE PROCEDURE_ANALYZE PROCESSLIST PROFILES PROJECT PROMPT PROTECTION PUBLIC PUBLISHINGSERVERNAME PURGE QUARTER QUERY QUICK QUIESCE QUOTA QUOTENAME RADIANS RAISE RAND RANGE RANK RAW READ READS READSIZE REBUILD RECORD RECORDS RECOVER RECOVERY RECURSIVE RECYCLE REDO REDUCED REF REFERENCE REFERENCED REFERENCES REFERENCING REFRESH REGEXP_LIKE REGISTER REGR_AVGX REGR_AVGY REGR_COUNT REGR_INTERCEPT REGR_R2 REGR_SLOPE REGR_SXX REGR_SXY REJECT REKEY RELATIONAL RELATIVE RELAYLOG RELEASE RELEASE_LOCK RELIES_ON RELOCATE RELY REM REMAINDER RENAME REPAIR REPEAT REPLACE REPLICATE REPLICATION REQUIRED RESET RESETLOGS RESIZE RESOURCE RESPECT RESTORE RESTRICTED RESULT RESULT_CACHE RESUMABLE RESUME RETENTION RETURN RETURNING RETURNS REUSE REVERSE REVOKE RIGHT RLIKE ROLE ROLES ROLLBACK ROLLING ROLLUP ROUND ROW ROW_COUNT ROWDEPENDENCIES ROWID ROWNUM ROWS RTRIM RULES SAFE SALT SAMPLE SAVE SAVEPOINT SB1 SB2 SB4 SCAN SCHEMA SCHEMACHECK SCN SCOPE SCROLL SDO_GEORASTER SDO_TOPO_GEOMETRY SEARCH SEC_TO_TIME SECOND SECONDS SECTION SECUREFILE SECURITY SEED SEGMENT SELECT SELF SEMI SEQUENCE SEQUENTIAL SERIALIZABLE SERVER SERVERERROR SESSION SESSION_USER SESSIONS_PER_USER SET SETS SETTINGS SHA SHA1 SHA2 SHARE SHARED SHARED_POOL SHORT SHOW SHRINK SHUTDOWN SI_AVERAGECOLOR SI_COLORHISTOGRAM SI_FEATURELIST SI_POSITIONALCOLOR SI_STILLIMAGE SI_TEXTURE SIBLINGS SID SIGN SIN SIZE SIZE_T SIZES SKIP SLAVE SLEEP SMALLDATETIMEFROMPARTS SMALLFILE SNAPSHOT SOME SONAME SORT SOUNDEX SOURCE SPACE SPARSE SPFILE SPLIT SQL SQL_BIG_RESULT SQL_BUFFER_RESULT SQL_CACHE SQL_CALC_FOUND_ROWS SQL_SMALL_RESULT SQL_VARIANT_PROPERTY SQLCODE SQLDATA SQLERROR SQLNAME SQLSTATE SQRT SQUARE STANDALONE STANDBY START STARTING STARTUP STATEMENT STATIC STATISTICS STATS_BINOMIAL_TEST STATS_CROSSTAB STATS_KS_TEST STATS_MODE STATS_MW_TEST STATS_ONE_WAY_ANOVA STATS_T_TEST_ STATS_T_TEST_INDEP STATS_T_TEST_ONE STATS_T_TEST_PAIRED STATS_WSR_TEST STATUS STD STDDEV STDDEV_POP STDDEV_SAMP STDEV STOP STORAGE STORE STORED STR STR_TO_DATE STRAIGHT_JOIN STRCMP STRICT STRING STRUCT STUFF STYLE SUBDATE SUBPARTITION SUBPARTITIONS SUBSTITUTABLE SUBSTR SUBSTRING SUBTIME SUBTRING_INDEX SUBTYPE SUCCESS SUM SUSPEND SWITCH SWITCHOFFSET SWITCHOVER SYNC SYNCHRONOUS SYNONYM SYS SYS_XMLAGG SYSASM SYSAUX SYSDATE SYSDATETIMEOFFSET SYSDBA SYSOPER SYSTEM SYSTEM_USER SYSUTCDATETIME TABLE TABLES TABLESPACE TABLESAMPLE TAN TDO TEMPLATE TEMPORARY TERMINATED TERTIARY_WEIGHTS TEST THAN THEN THREAD THROUGH TIER TIES TIME TIME_FORMAT TIME_ZONE TIMEDIFF TIMEFROMPARTS TIMEOUT TIMESTAMP TIMESTAMPADD TIMESTAMPDIFF TIMEZONE_ABBR TIMEZONE_MINUTE TIMEZONE_REGION TO TO_BASE64 TO_DATE TO_DAYS TO_SECONDS TODATETIMEOFFSET TRACE TRACKING TRANSACTION TRANSACTIONAL TRANSLATE TRANSLATION TREAT TRIGGER TRIGGER_NESTLEVEL TRIGGERS TRIM TRUNCATE TRY_CAST TRY_CONVERT TRY_PARSE TYPE UB1 UB2 UB4 UCASE UNARCHIVED UNBOUNDED UNCOMPRESS UNDER UNDO UNHEX UNICODE UNIFORM UNINSTALL UNION UNIQUE UNIX_TIMESTAMP UNKNOWN UNLIMITED UNLOCK UNNEST UNPIVOT UNRECOVERABLE UNSAFE UNSIGNED UNTIL UNTRUSTED UNUSABLE UNUSED UPDATE UPDATED UPGRADE UPPED UPPER UPSERT URL UROWID USABLE USAGE USE USE_STORED_OUTLINES USER USER_DATA USER_RESOURCES USERS USING UTC_DATE UTC_TIMESTAMP UUID UUID_SHORT VALIDATE VALIDATE_PASSWORD_STRENGTH VALIDATION VALIST VALUE VALUES VAR VAR_SAMP VARCHARC VARI VARIA VARIAB VARIABL VARIABLE VARIABLES VARIANCE VARP VARRAW VARRAWC VARRAY VERIFY VERSION VERSIONS VIEW VIRTUAL VISIBLE VOID WAIT WALLET WARNING WARNINGS WEEK WEEKDAY WEEKOFYEAR WELLFORMED WHEN WHENE WHENEV WHENEVE WHENEVER WHERE WHILE WHITESPACE WINDOW WITH WITHIN WITHOUT WORK WRAPPED XDB XML XMLAGG XMLATTRIBUTES XMLCAST XMLCOLATTVAL XMLELEMENT XMLEXISTS XMLFOREST XMLINDEX XMLNAMESPACES XMLPI XMLQUERY XMLROOT XMLSCHEMA XMLSERIALIZE XMLTABLE XMLTYPE XOR YEAR YEAR_TO_MONTH YEARS YEARWEEK',
          literal:
            'TRUE FALSE NULL UNKNOWN',
          built_in:
            'ARRAY BIGINT BINARY BIT BLOB BOOL BOOLEAN CHAR CHARACTER DATE DEC DECIMAL FLOAT INT INT8 INTEGER INTERVAL NUMBER NUMERIC REAL RECORD SERIAL SERIAL8 SMALLINT TEXT TIME TIMESTAMP TINYINT VARCHAR VARYING VOID read write'
        },
        contains: [
          {
            className: 'string',
            begin: '\'', end: '\'',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}]
          },
          {
            className: 'string',
            begin: '"', end: '"',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '""'}]
          },
          {
            className: 'string',
            begin: '`', end: '`',
            contains: [hljs.BACKSLASH_ESCAPE]
          },
          hljs.C_NUMBER_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          COMMENT_MODE,COMMENT_MODE2,
          hljs.HASH_COMMENT_MODE
        ]
      },
      hljs.C_BLOCK_COMMENT_MODE,
      COMMENT_MODE,COMMENT_MODE2,
      hljs.HASH_COMMENT_MODE
    ]
  };
}
},{name:"sql",create:/*
 Language: SQL
 Contributors: Nikolay Lisienko <info@neor.ru>, Heiko August <post@auge8472.de>, Travis Odom <travis.a.odom@gmail.com>, Vadimtro <vadimtro@yahoo.com>, Benjamin Auder <benjamin.auder@gmail.com>
 Category: common
 */

function(hljs) {
  var COMMENT_MODE = hljs.COMMENT('--', '$');
  return {
    case_insensitive: true,
    illegal: /[<>{}*]/,
    contains: [
      {
        beginKeywords:
          'begin end start commit rollback savepoint lock alter create drop rename call ' +
          'delete do handler insert load replace select truncate update set show pragma grant ' +
          'merge describe use explain help declare prepare execute deallocate release ' +
          'unlock purge reset change stop analyze cache flush optimize repair kill ' +
          'install uninstall checksum restore check backup revoke comment values with',
        end: /;/, endsWithParent: true,
        lexemes: /[\w\.]+/,
        keywords: {
          keyword:
            'as abort abs absolute acc acce accep accept access accessed accessible account acos action activate add ' +
            'addtime admin administer advanced advise aes_decrypt aes_encrypt after agent aggregate ali alia alias ' +
            'all allocate allow alter always analyze ancillary and anti any anydata anydataset anyschema anytype apply ' +
            'archive archived archivelog are as asc ascii asin assembly assertion associate asynchronous at atan ' +
            'atn2 attr attri attrib attribu attribut attribute attributes audit authenticated authentication authid ' +
            'authors auto autoallocate autodblink autoextend automatic availability avg backup badfile basicfile ' +
            'before begin beginning benchmark between bfile bfile_base big bigfile bin binary_double binary_float ' +
            'binlog bit_and bit_count bit_length bit_or bit_xor bitmap blob_base block blocksize body both bound ' +
            'bucket buffer_cache buffer_pool build bulk by byte byteordermark bytes cache caching call calling cancel ' +
            'capacity cascade cascaded case cast catalog category ceil ceiling chain change changed char_base ' +
            'char_length character_length characters characterset charindex charset charsetform charsetid check ' +
            'checksum checksum_agg child choose chr chunk class cleanup clear client clob clob_base clone close ' +
            'cluster_id cluster_probability cluster_set clustering coalesce coercibility col collate collation ' +
            'collect colu colum column column_value columns columns_updated comment commit compact compatibility ' +
            'compiled complete composite_limit compound compress compute concat concat_ws concurrent confirm conn ' +
            'connec connect connect_by_iscycle connect_by_isleaf connect_by_root connect_time connection ' +
            'consider consistent constant constraint constraints constructor container content contents context ' +
            'contributors controlfile conv convert convert_tz corr corr_k corr_s corresponding corruption cos cost ' +
            'count count_big counted covar_pop covar_samp cpu_per_call cpu_per_session crc32 create creation ' +
            'critical cross cube cume_dist curdate current current_date current_time current_timestamp current_user ' +
            'cursor curtime customdatum cycle data database databases datafile datafiles datalength date_add ' +
            'date_cache date_format date_sub dateadd datediff datefromparts datename datepart datetime2fromparts ' +
            'day day_to_second dayname dayofmonth dayofweek dayofyear days db_role_change dbtimezone ddl deallocate ' +
            'declare decode decompose decrement decrypt deduplicate def defa defau defaul default defaults ' +
            'deferrable deferred defi defin define degrees delayed delegate delete delete_all delimited demand dense_rank ' +
            'depth dequeue des_decrypt des_encrypt des_key_file desc descr descri describ describe descriptor ' +
            'deterministic diagnostics difference dimension direct_load directory disable disable_all ' +
            'disallow disassociate discardfile disconnect diskgroup distinct distinctrow distribute distributed div ' +
            'do document domain dotnet double downgrade drop dumpfile duplicate duration each edition editionable ' +
            'editions element ellipsis else elsif elt empty enable enable_all enclosed encode encoding encrypt ' +
            'end end-exec endian enforced engine engines enqueue enterprise entityescaping eomonth error errors ' +
            'escaped evalname evaluate event eventdata events except exception exceptions exchange exclude excluding ' +
            'execu execut execute exempt exists exit exp expire explain explode export export_set extended extent external ' +
            'external_1 external_2 externally extract failed failed_login_attempts failover failure far fast ' +
            'feature_set feature_value fetch field fields file file_name_convert filesystem_like_logging final ' +
            'finish first first_value fixed flash_cache flashback floor flush following follows for forall force foreign ' +
            'form forma format found found_rows freelist freelists freepools fresh from from_base64 from_days ' +
            'ftp full function general generated get get_format get_lock getdate getutcdate global global_name ' +
            'globally go goto grant grants greatest group group_concat group_id grouping grouping_id groups ' +
            'gtid_subtract guarantee guard handler hash hashkeys having hea head headi headin heading heap help hex ' +
            'hierarchy high high_priority hosts hour hours http id ident_current ident_incr ident_seed identified ' +
            'identity idle_time if ifnull ignore iif ilike ilm immediate import in include including increment ' +
            'index indexes indexing indextype indicator indices inet6_aton inet6_ntoa inet_aton inet_ntoa infile ' +
            'initial initialized initially initrans inmemory inner innodb input insert install instance instantiable ' +
            'instr interface interleaved intersect into invalidate invisible is is_free_lock is_ipv4 is_ipv4_compat ' +
            'is_not is_not_null is_used_lock isdate isnull isolation iterate java join json json_exists ' +
            'keep keep_duplicates key keys kill language large last last_day last_insert_id last_value lateral lax lcase ' +
            'lead leading least leaves left len lenght length less level levels library like like2 like4 likec limit ' +
            'lines link list listagg little ln load load_file lob lobs local localtime localtimestamp locate ' +
            'locator lock locked log log10 log2 logfile logfiles logging logical logical_reads_per_call ' +
            'logoff logon logs long loop low low_priority lower lpad lrtrim ltrim main make_set makedate maketime ' +
            'managed management manual map mapping mask master master_pos_wait match matched materialized max ' +
            'maxextents maximize maxinstances maxlen maxlogfiles maxloghistory maxlogmembers maxsize maxtrans ' +
            'md5 measures median medium member memcompress memory merge microsecond mid migration min minextents ' +
            'minimum mining minus minute minutes minvalue missing mod mode model modification modify module monitoring month ' +
            'months mount move movement multiset mutex name name_const names nan national native natural nav nchar ' +
            'nclob nested never new newline next nextval no no_write_to_binlog noarchivelog noaudit nobadfile ' +
            'nocheck nocompress nocopy nocycle nodelay nodiscardfile noentityescaping noguarantee nokeep nologfile ' +
            'nomapping nomaxvalue nominimize nominvalue nomonitoring none noneditionable nonschema noorder ' +
            'nopr nopro noprom nopromp noprompt norely noresetlogs noreverse normal norowdependencies noschemacheck ' +
            'noswitch not nothing notice notnull notrim novalidate now nowait nth_value nullif nulls num numb numbe ' +
            'nvarchar nvarchar2 object ocicoll ocidate ocidatetime ociduration ociinterval ociloblocator ocinumber ' +
            'ociref ocirefcursor ocirowid ocistring ocitype oct octet_length of off offline offset oid oidindex old ' +
            'on online only opaque open operations operator optimal optimize option optionally or oracle oracle_date ' +
            'oradata ord ordaudio orddicom orddoc order ordimage ordinality ordvideo organization orlany orlvary ' +
            'out outer outfile outline output over overflow overriding package pad parallel parallel_enable ' +
            'parameters parent parse partial partition partitions pascal passing password password_grace_time ' +
            'password_lock_time password_reuse_max password_reuse_time password_verify_function patch path patindex ' +
            'pctincrease pctthreshold pctused pctversion percent percent_rank percentile_cont percentile_disc ' +
            'performance period period_add period_diff permanent physical pi pipe pipelined pivot pluggable plugin ' +
            'policy position post_transaction pow power pragma prebuilt precedes preceding precision prediction ' +
            'prediction_cost prediction_details prediction_probability prediction_set prepare present preserve ' +
            'primary prior priority private private_sga privileges procedural procedure procedure_analyze processlist ' +
            'profiles project prompt protection public publishingservername purge quarter query quick quiesce quota ' +
            'quotename radians raise rand range rank raw read reads readsize rebuild record records ' +
            'recover recovery recursive recycle redo reduced ref reference referenced references referencing refresh ' +
            'regexp_like register regr_avgx regr_avgy regr_count regr_intercept regr_r2 regr_slope regr_sxx regr_sxy ' +
            'reject rekey relational relative relaylog release release_lock relies_on relocate rely rem remainder rename ' +
            'repair repeat replace replicate replication required reset resetlogs resize resource respect restore ' +
            'restricted result result_cache resumable resume retention return returning returns reuse reverse revoke ' +
            'right rlike role roles rollback rolling rollup round row row_count rowdependencies rowid rownum rows ' +
            'rtrim rules safe salt sample save savepoint sb1 sb2 sb4 scan schema schemacheck scn scope scroll ' +
            'sdo_georaster sdo_topo_geometry search sec_to_time second seconds section securefile security seed segment select ' +
            'self semi sequence sequential serializable server servererror session session_user sessions_per_user set ' +
            'sets settings sha sha1 sha2 share shared shared_pool short show shrink shutdown si_averagecolor ' +
            'si_colorhistogram si_featurelist si_positionalcolor si_stillimage si_texture siblings sid sign sin ' +
            'size size_t sizes skip slave sleep smalldatetimefromparts smallfile snapshot some soname sort soundex ' +
            'source space sparse spfile split sql sql_big_result sql_buffer_result sql_cache sql_calc_found_rows ' +
            'sql_small_result sql_variant_property sqlcode sqldata sqlerror sqlname sqlstate sqrt square standalone ' +
            'standby start starting startup statement static statistics stats_binomial_test stats_crosstab ' +
            'stats_ks_test stats_mode stats_mw_test stats_one_way_anova stats_t_test_ stats_t_test_indep ' +
            'stats_t_test_one stats_t_test_paired stats_wsr_test status std stddev stddev_pop stddev_samp stdev ' +
            'stop storage store stored str str_to_date straight_join strcmp strict string struct stuff style subdate ' +
            'subpartition subpartitions substitutable substr substring subtime subtring_index subtype success sum ' +
            'suspend switch switchoffset switchover sync synchronous synonym sys sys_xmlagg sysasm sysaux sysdate ' +
            'sysdatetimeoffset sysdba sysoper system system_user sysutcdatetime table tables tablespace tablesample tan tdo ' +
            'template temporary terminated tertiary_weights test than then thread through tier ties time time_format ' +
            'time_zone timediff timefromparts timeout timestamp timestampadd timestampdiff timezone_abbr ' +
            'timezone_minute timezone_region to to_base64 to_date to_days to_seconds todatetimeoffset trace tracking ' +
            'transaction transactional translate translation treat trigger trigger_nestlevel triggers trim truncate ' +
            'try_cast try_convert try_parse type ub1 ub2 ub4 ucase unarchived unbounded uncompress ' +
            'under undo unhex unicode uniform uninstall union unique unix_timestamp unknown unlimited unlock unnest unpivot ' +
            'unrecoverable unsafe unsigned until untrusted unusable unused update updated upgrade upped upper upsert ' +
            'url urowid usable usage use use_stored_outlines user user_data user_resources users using utc_date ' +
            'utc_timestamp uuid uuid_short validate validate_password_strength validation valist value values var ' +
            'var_samp varcharc vari varia variab variabl variable variables variance varp varraw varrawc varray ' +
            'verify version versions view virtual visible void wait wallet warning warnings week weekday weekofyear ' +
            'wellformed when whene whenev wheneve whenever where while whitespace window with within without work wrapped ' +
            'xdb xml xmlagg xmlattributes xmlcast xmlcolattval xmlelement xmlexists xmlforest xmlindex xmlnamespaces ' +
            'xmlpi xmlquery xmlroot xmlschema xmlserialize xmltable xmltype xor year year_to_month years yearweek',
          literal:
            'true false null unknown',
          built_in:
            'array bigint binary bit blob bool boolean char character date dec decimal float int int8 integer interval number ' +
            'numeric real record serial serial8 smallint text time timestamp tinyint varchar varying void'
        },
        contains: [
          {
            className: 'string',
            begin: '\'', end: '\'',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}]
          },
          {
            className: 'string',
            begin: '"', end: '"',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '""'}]
          },
          {
            className: 'string',
            begin: '`', end: '`',
            contains: [hljs.BACKSLASH_ESCAPE]
          },
          hljs.C_NUMBER_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          COMMENT_MODE,
          hljs.HASH_COMMENT_MODE
        ]
      },
      hljs.C_BLOCK_COMMENT_MODE,
      COMMENT_MODE,
      hljs.HASH_COMMENT_MODE
    ]
  };
}
}]
  ;

for (var i = 0; i < languages.length; ++i) {
  hljs.registerLanguage(languages[i].name, languages[i].create);
}

module.exports = {
  styles: {},
  engine: hljs
};

},{}],16:[function(require,module,exports){
module.exports = Lexer;

var CODE = 1,
    INLINE_CODE = 2,
    CONTENT = 3,
    FENCES = 4,
    DEF = 5,
    DEF_HREF = 6,
    DEF_TITLE = 7,
    MACRO = 8,
    MACRO_ARGS = 9,
    MACRO_OBJ = 10,
    SLIDE_SEPARATOR = 11,
    FRAGMENT_SEPARATOR = 12,
    NOTES_SEPARATOR = 13;

var regexByName = {
    CODE: /(?:^|\n\n)( {4}[^\n]+\n*)+/,
    INLINE_CODE: /\`([^\`].*?)\`/,
    CONTENT: /(?:\\)?((?:\.[a-zA-Z_\-][a-zA-Z\-_0-9]*)+)\[/,
    FENCES: /(?:^|\n) *(`{3,}|~{3,}) *(?:\S+)? *\n(?:[\s\S]+?)\s*\4 *(?:\n+|$)/,
    DEF: /(?:^|\n) *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
    MACRO: /!\[:([^\] ]+)([^\]]*)\](?:\(([^\)]*)\))?/,
    SLIDE_SEPARATOR: /(?:^|\n)(---|<!--\s*break\s*-->)(?:\n|$)/,
    FRAGMENT_SEPARATOR: /(?:^|\n)(--)(?![^\n])/,
    NOTES_SEPARATOR: /(?:^|\n)(\?{3})(?:\n|$)/
  };

var block = replace(/CODE|INLINE_CODE|CONTENT|FENCES|DEF|MACRO|SLIDE_SEPARATOR|FRAGMENT_SEPARATOR|NOTES_SEPARATOR/, regexByName),
    inline = replace(/CODE|INLINE_CODE|CONTENT|FENCES|DEF|MACRO/, regexByName);

function Lexer () { }

Lexer.prototype.lex = function (src) {
  var tokens = lex(src.replace('\r', ''), block),
      i;

  for (i = tokens.length - 2; i >= 0; i--) {
    if (tokens[i].type === 'text' && tokens[i+1].type === 'text') {
      tokens[i].text += tokens[i+1].text;
      tokens.splice(i+1, 1);
    }
  }

  return tokens;
};

function lex (src, regex, tokens) {
  var cap, text;

  tokens = tokens || [];

  while ((cap = regex.exec(src)) !== null) {
    if (cap.index > 0) {
      tokens.push({
        type: 'text',
        text: src.substring(0, cap.index)
      });
    }

    if (cap[CODE]) {
      tokens.push({
        type: 'code',
        text: cap[0]
      });
    }
    else if (cap[INLINE_CODE]) {
      tokens.push({
        type: 'text',
        text: cap[0]
      });
    }
    else if (cap[FENCES]) {
      tokens.push({
        type: 'fences',
        text: cap[0]
      });
    }
    else if (cap[DEF]) {
      tokens.push({
        type: 'def',
        id: cap[DEF].toLowerCase(),
        href: cap[DEF_HREF],
        title: cap[DEF_TITLE]
      });
    }
    else if (cap[MACRO]) {
      tokens.push({
        type: 'macro',
        name: cap[MACRO],
        args: (cap[MACRO_ARGS] || '').split(',').map(trim),
        obj: cap[MACRO_OBJ]
      });
    }
    else if (cap[SLIDE_SEPARATOR] || cap[FRAGMENT_SEPARATOR]) {
      tokens.push({
        type: 'separator',
        text: cap[SLIDE_SEPARATOR] || cap[FRAGMENT_SEPARATOR]
      });
    }
    else if (cap[NOTES_SEPARATOR]) {
      tokens.push({
        type: 'notes_separator',
        text: cap[NOTES_SEPARATOR]
      });
    }
    else if (cap[CONTENT]) {
      text = getTextInBrackets(src, cap.index + cap[0].length);
      if (text !== undefined) {
        src = src.substring(text.length + 1);

        if (cap[0][0] !== '\\') {
          tokens.push({
            type: 'content_start',
            classes: cap[CONTENT].substring(1).split('.'),
            block: text.indexOf('\n') !== -1
          });
          lex(text, inline, tokens);
          tokens.push({
            type: 'content_end',
            block: text.indexOf('\n') !== -1
          });
        }
        else {
          tokens.push({
            type: 'text',
            text: cap[0].substring(1) + text + ']'
          });
        }
      }
      else {
        tokens.push({
          type: 'text',
          text: cap[0]
        });
      }
    }

    src = src.substring(cap.index + cap[0].length);
  }

  if (src || (!src && tokens.length === 0)) {
    tokens.push({
      type: 'text',
      text: src
    });
  }

  return tokens;
}

function replace (regex, replacements) {
  return new RegExp(regex.source.replace(/\w{2,}/g, function (key) {
    return replacements[key].source;
  }));
}

function trim (text) {
  if (typeof text === 'string') {
    return text.trim();
  }

  return text;
}

function getTextInBrackets (src, offset) {
  var depth = 1,
      pos = offset,
      chr;

  while (depth > 0 && pos < src.length) {
    chr = src[pos++];
    depth += (chr === '[' && 1) || (chr === ']' && -1) || 0;
  }

  if (depth === 0) {
    src = src.substr(offset, pos - offset - 1);
    return src;
  }
}

},{}],17:[function(require,module,exports){
var macros = module.exports = {};

macros.hello = function () {
  return 'hello!';
};

},{}],18:[function(require,module,exports){
var converter = require('../converter');

module.exports = Slide;

function Slide (slideIndex, slideNumber, slide, template, options) {
  var self = this;

  self.properties = slide.properties || {};
  self.links = slide.links || {};
  self.content = slide.content || [];
  self.notes = slide.notes || '';

  self.getSlideIndex = function () { return slideIndex; };
  self.getSlideNumber = function () { return slideNumber; };

  if (template) {
    inherit(self, template, options);
  }
}

function inherit (slide, template, options) {
  inheritProperties(slide, template);
  inheritContent(slide, template);
  inheritNotes(slide, template, options);
}

function inheritProperties (slide, template) {
  var property
    , value
    ;

  for (property in template.properties) {
    if (!template.properties.hasOwnProperty(property) ||
        ignoreProperty(property)) {
      continue;
    }

    value = [template.properties[property]];

    if (property === 'class' && slide.properties[property]) {
      value.push(slide.properties[property]);
    }

    if (property === 'class' || slide.properties[property] === undefined) {
      slide.properties[property] = value.join(', ');
    }
  }
}

function ignoreProperty (property) {
  return property === 'name' ||
    property === 'layout' ||
    property === 'count';
}

function inheritContent (slide, template) {
  var expandedVariables;

  slide.properties.content = slide.content.slice();
  deepCopyContent(slide, template.content);

  expandedVariables = slide.expandVariables(/* contentOnly: */ true);

  if (expandedVariables.content === undefined) {
    slide.content = slide.content.concat(slide.properties.content);
  }

  delete slide.properties.content;
}

function deepCopyContent(target, content) {
  var i;

  target.content = [];
  for (i = 0; i < content.length; ++i) {
    if (typeof content[i] === 'string') {
      target.content.push(content[i]);
    }
    else {
      target.content.push({
        block: content[i].block,
        class: content[i].class,
      });
      deepCopyContent(target.content[target.content.length-1], content[i].content);
    }
  }
}

function inheritNotes (slide, template, options) {
  if (template.notes && options.inheritPresenterNotes) {
    slide.notes = template.notes + '\n\n' + slide.notes;
  }
}

Slide.prototype.expandVariables = function (contentOnly, content, expandResult) {
  var properties = this.properties
    , i
    ;

  content = content !== undefined ? content : this.content;
  expandResult = expandResult || {};

  for (i = 0; i < content.length; ++i) {
    if (typeof content[i] === 'string') {
      content[i] = content[i].replace(/(\\)?(\{\{([^\}\n]+)\}\})/g, expand);
    }
    else {
      this.expandVariables(contentOnly, content[i].content, expandResult);
    }
  }

  function expand (match, escaped, unescapedMatch, property) {
    var propertyName = property.trim()
      , propertyValue
      ;

    if (escaped) {
      return contentOnly ? match[0] : unescapedMatch;
    }

    if (contentOnly && propertyName !== 'content') {
      return match;
    }

    propertyValue = properties[propertyName];

    if (propertyValue !== undefined) {
      expandResult[propertyName] = propertyValue;
      return propertyValue;
    }

    return propertyName === 'content' ? '' : unescapedMatch;
  }

  return expandResult;
};

},{"../converter":13}],19:[function(require,module,exports){
var Navigation = require('./slideshow/navigation')
  , Events = require('./slideshow/events')
  , utils = require('../utils')
  , Slide = require('./slide')
  , Parser = require('../parser')
  , macros = require('../macros')
  ;

module.exports = Slideshow;

function Slideshow (events, dom, options, callback) {
  var self = this
    , slides = []
    , links = {}
    ;

  slides.byName = {};
  options = options || {};

  // Extend slideshow functionality
  Events.call(self, events);
  Navigation.call(self, events);

  self.loadFromString = loadFromString;
  self.loadFromUrl = loadFromUrl;
  self.update = update;
  self.getLinks = getLinks;
  self.getSlides = getSlides;
  self.getSlideCount = getSlideCount;
  self.getSlideByName = getSlideByName;
  self.getSlidesByNumber = getSlidesByNumber;

  self.togglePresenterMode = togglePresenterMode;
  self.toggleHelp = toggleHelp;
  self.toggleBlackout = toggleBlackout;
  self.toggleMirrored = toggleMirrored;
  self.toggleFullscreen = toggleFullscreen;
  self.createClone = createClone;

  self.resetTimer = resetTimer;

  self.getRatio = getOrDefault('ratio', '4:3');
  self.getHighlightStyle = getOrDefault('highlightStyle', 'default');
  self.getHighlightLines = getOrDefault('highlightLines', false);
  self.getHighlightSpans = getOrDefault('highlightSpans', false);
  self.getHighlightInlineCode = getOrDefault('highlightInlineCode', false);
  self.getHighlightLanguage = getOrDefault('highlightLanguage', '');
  self.getSlideNumberFormat = getOrDefault('slideNumberFormat', '%current% / %total%');
  self.getCloneTarget = getOrDefault('cloneTarget', '_blank');

  events.on('toggleBlackout', function (opts) {
    if (opts && opts.propagate === false) return;

    if (self.clone && !self.clone.closed) {
      self.clone.postMessage('toggleBlackout', '*');
    }

    if (window.opener) {
      window.opener.postMessage('toggleBlackout', '*');
    }
  });

  if (options.sourceUrl) {
    loadFromUrl(options.sourceUrl, callback);
  }
  else {
    loadFromString(options.source);
    if (typeof callback === 'function') {
      callback(self);
    }
  }

  function loadFromString (source) {
    source = source || '';

    slides = createSlides(source, options);
    expandVariables(slides);

    links = {};
    slides.forEach(function (slide) {
      for (var id in slide.links) {
        if (slide.links.hasOwnProperty(id)) {
          links[id] = slide.links[id];
        }
      }
    });

    events.emit('slidesChanged');
  }

  function loadFromUrl (url, callback) {
    var xhr = new dom.XMLHttpRequest();
    xhr.open('GET', options.sourceUrl, true);
    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          options.source = xhr.responseText.replace(/\r\n/g, '\n');
          loadFromString(options.source);
          if (typeof callback === 'function') {
            callback(self);
          }
        } else {
          throw Error(xhr.statusText);
        }
      }
    };
    xhr.onerror = function (e) {
      throw Error(xhr.statusText);
    };
    xhr.send(null);
    return xhr;
  }

  function update () {
    events.emit('resize');
  }

  function getLinks () {
    return links;
  }

  function getSlides () {
    return slides.map(function (slide) { return slide; });
  }

  function getSlideCount () {
    return slides.length;
  }

  function getSlideByName (name) {
    return slides.byName[name];
  }

  function getSlidesByNumber (number) {
    return slides.byNumber[number];
  }

  function togglePresenterMode () {
    events.emit('togglePresenterMode');
  }

  function toggleHelp () {
    events.emit('toggleHelp');
  }

  function toggleBlackout () {
    events.emit('toggleBlackout');
  }

  function toggleMirrored() {
    events.emit('toggleMirrored');
  }

  function toggleFullscreen () {
    events.emit('toggleFullscreen');
  }

  function createClone () {
    events.emit('createClone');
  }

  function resetTimer () {
    events.emit('resetTimer');
  }

  function getOrDefault (key, defaultValue) {
    return function () {
      if (options[key] === undefined) {
        return defaultValue;
      }

      return options[key];
    };
  }
}

function createSlides (slideshowSource, options) {
  var parser = new Parser()
   ,  parsedSlides = parser.parse(slideshowSource, macros, options)
    , slides = []
    , byName = {}
    , layoutSlide
    ;

  slides.byName = {};
  slides.byNumber = {};

  var slideNumber = 0;
  parsedSlides.forEach(function (slide, i) {
    var template, slideViewModel;

    if (slide.properties.continued === 'true' && i > 0) {
      template = slides[slides.length - 1];
    }
    else if (byName[slide.properties.template]) {
      template = byName[slide.properties.template];
    }
    else if (slide.properties.layout === 'false') {
      layoutSlide = undefined;
    }
    else if (layoutSlide && slide.properties.layout !== 'true') {
      template = layoutSlide;
    }

    if (slide.properties.continued === 'true' &&
        options.countIncrementalSlides === false &&
        slide.properties.count === undefined) {
      slide.properties.count = 'false';
    }

    var slideClasses = (slide.properties['class'] || '').split(/,| /)
      , excludedClasses = options.excludedClasses || []
      , slideIsIncluded = slideClasses.filter(function (c) {
          return excludedClasses.indexOf(c) !== -1;
        }).length === 0;

    if (slideIsIncluded && slide.properties.layout !== 'true' && slide.properties.count !== 'false') {
      slideNumber++;
      slides.byNumber[slideNumber] = [];
    }

    if (options.includePresenterNotes !== undefined && !options.includePresenterNotes) {
      slide.notes = '';
    }

    slideViewModel = new Slide(slides.length, slideNumber, slide, template, options);

    if (slide.properties.name) {
      byName[slide.properties.name] = slideViewModel;
    }

    if (slide.properties.layout === 'true') {
      layoutSlide = slideViewModel;
    } else {
      if (slideIsIncluded) {
        slides.push(slideViewModel);
        if (slides.byNumber[slideNumber] !== undefined) {
          slides.byNumber[slideNumber].push(slideViewModel);
        }
      }
      if (slide.properties.name) {
        slides.byName[slide.properties.name] = slideViewModel;
      }
    }

  });

  return slides;
}

function expandVariables (slides) {
  slides.forEach(function (slide) {
    slide.expandVariables();
  });
}

},{"../macros":17,"../parser":22,"../utils":25,"./slide":18,"./slideshow/events":20,"./slideshow/navigation":21}],20:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;

module.exports = Events;

function Events (events) {
  var self = this
    , externalEvents = new EventEmitter()
    ;

  externalEvents.setMaxListeners(0);

  self.on = function () {
    externalEvents.on.apply(externalEvents, arguments);
    return self;
  };

  ['showSlide', 'hideSlide', 'beforeShowSlide', 'afterShowSlide', 'beforeHideSlide', 'afterHideSlide', 'toggledPresenter'].map(function (eventName) {
    events.on(eventName, function (slideIndex) {
      var slide = self.getSlides()[slideIndex];
      externalEvents.emit(eventName, slide);
    });
  });
}

},{"events":1}],21:[function(require,module,exports){
module.exports = Navigation;

function Navigation (events) {
  var self = this
    , currentSlideIndex = -1
    , started = null
    ;

  self.getCurrentSlideIndex = getCurrentSlideIndex;
  self.gotoSlide = gotoSlide;
  self.gotoSlideNumber = gotoSlideNumber;
  self.gotoPreviousSlide = gotoPreviousSlide;
  self.gotoNextSlide = gotoNextSlide;
  self.gotoFirstSlide = gotoFirstSlide;
  self.gotoLastSlide = gotoLastSlide;
  self.pause = pause;
  self.resume = resume;

  events.on('gotoSlide', gotoSlide);
  events.on('gotoSlideNumber', gotoSlideNumber);
  events.on('gotoPreviousSlide', gotoPreviousSlide);
  events.on('gotoNextSlide', gotoNextSlide);
  events.on('gotoFirstSlide', gotoFirstSlide);
  events.on('gotoLastSlide', gotoLastSlide);

  events.on('slidesChanged', function () {
    if (currentSlideIndex > self.getSlideCount()) {
      currentSlideIndex = self.getSlideCount();
    }
  });

  events.on('createClone', function () {
    if (!self.clone || self.clone.closed) {
      self.clone = window.open(location.href, self.getCloneTarget(), 'location=no');
    }
    else {
      self.clone.focus();
    }
  });

  events.on('resetTimer', function() {
    started = false;
  });

  function pause () {
    events.emit('pause');
  }

  function resume () {
    events.emit('resume');
  }

  function getCurrentSlideIndex () {
    return currentSlideIndex;
  }

  function gotoSlideByIndex(slideIndex, noMessage) {
    var alreadyOnSlide = slideIndex === currentSlideIndex
      , slideOutOfRange = slideIndex < 0 || slideIndex > self.getSlideCount()-1
      ;

    if (noMessage === undefined) noMessage = false;

    if (alreadyOnSlide || slideOutOfRange) {
      return;
    }

    if (currentSlideIndex !== -1) {
      events.emit('hideSlide', currentSlideIndex, false);
    }

    // Use some tri-state logic here.
    // null = We haven't shown the first slide yet.
    // false = We've shown the initial slide, but we haven't progressed beyond that.
    // true = We've issued the first slide change command.
    if (started === null) {
      started = false;
    } else if (started === false) {
      // We've shown the initial slide previously - that means this is a
      // genuine move to a new slide.
      events.emit('start');
      started = true;
    }

    events.emit('showSlide', slideIndex);

    currentSlideIndex = slideIndex;

    events.emit('slideChanged', slideIndex + 1);

    if (!noMessage) {
      if (self.clone && !self.clone.closed) {
        self.clone.postMessage('gotoSlide:' + (currentSlideIndex + 1), '*');
      }

      if (window.opener) {
        window.opener.postMessage('gotoSlide:' + (currentSlideIndex + 1), '*');
      }
    }
  }

  function gotoSlide (slideNoOrName, noMessage) {
    var slideIndex = getSlideIndex(slideNoOrName);

    gotoSlideByIndex(slideIndex, noMessage);
  }

  function gotoSlideNumber (slideNumber, noMessage) {
    var slides = self.getSlidesByNumber(parseInt(slideNumber, 10));
    if (slides && slides.length) {
      gotoSlideByIndex(slides[0].getSlideIndex(), noMessage);
    }
  }

  function gotoPreviousSlide() {
    gotoSlideByIndex(currentSlideIndex - 1);
  }

  function gotoNextSlide() {
    gotoSlideByIndex(currentSlideIndex + 1);
  }

  function gotoFirstSlide () {
    gotoSlideByIndex(0);
  }

  function gotoLastSlide () {
    gotoSlideByIndex(self.getSlideCount() - 1);
  }

  function getSlideIndex (slideNoOrName) {
    var slideNo
      , slide
      ;

    if (typeof slideNoOrName === 'number') {
      return slideNoOrName - 1;
    }

    slideNo = parseInt(slideNoOrName, 10);
    if (slideNo.toString() === slideNoOrName) {
      return slideNo - 1;
    }

    if(slideNoOrName.match(/^p\d+$/)){
      events.emit('forcePresenterMode');
      return parseInt(slideNoOrName.substr(1), 10)-1;
    }

    slide = self.getSlideByName(slideNoOrName);
    if (slide) {
      return slide.getSlideIndex();
    }

    return 0;
  }
}

},{}],22:[function(require,module,exports){
var Lexer = require('./lexer');

module.exports = Parser;

function Parser () { }

/*
 *  Parses source string into list of slides.
 *
 *  Output format:
 *
 *  [
 *    // Per slide
 *    {
 *      // Properties
 *      properties: {
 *        name: 'value'
 *      },
 *      // Notes (optional, same format as content list)
 *      notes: [...],
 *      // Link definitions
 *      links: {
 *        id: { href: 'url', title: 'optional title' },
 *        ...
 *      ],
 *      content: [
 *        // Any content except for content classes are represented as strings
 *        'plain text ',
 *        // Content classes are represented as objects
 *        { block: false, class: 'the-class', content: [...] },
 *        { block: true, class: 'the-class', content: [...] },
 *        ...
 *      ]
 *    },
 *    ...
 *  ]
 */
Parser.prototype.parse = function (src, macros, options) {
  var self = this,
      lexer = new Lexer(),
      tokens = lexer.lex(cleanInput(src)),
      slides = [],

      // The last item on the stack contains the current slide or
      // content class we're currently appending content to.
      stack = [createSlide()];

  macros = macros || {};
  options = options || {};

  tokens.forEach(function (token) {
    switch (token.type) {
      case 'text':
      case 'code':
      case 'fences':
        // Text, code and fenced code tokens are appended to their
        // respective parents as string literals, and are only included
        // in the parse process in order to reason about structure
        // (like ignoring a slide separator inside fenced code).
        appendTo(stack[stack.length - 1], token.text);
        break;
      case 'def':
        // Link definition
        stack[0].links[token.id] = {
          href: token.href,
          title: token.title
        };
        break;
      case 'macro':
        // Macro
        var macro = macros[token.name];
        if (typeof macro !== 'function') {
          throw new Error('Macro "' + token.name + '" not found. ' +
              'You need to define macro using remark.macros[\'' +
              token.name + '\'] = function () { ... };');
        }
        var value = macro.apply(token.obj, token.args);
        if (typeof value === 'string') {
          value = self.parse(value, macros);
          appendTo(stack[stack.length - 1], value[0].content[0]);
        }
        else {
          appendTo(stack[stack.length - 1], value === undefined ?
              '' : value.toString());
        }
        break;
      case 'content_start':
        // Entering content class, so create stack entry for appending
        // upcoming content to.
        //
        // Lexer handles open/close bracket balance, so there's no need
        // to worry about there being a matching closing bracket.
        stack.push(createContentClass(token));
        break;
      case 'content_end':
        // Exiting content class, so remove entry from stack and
        // append to previous item (outer content class or slide).
        appendTo(stack[stack.length - 2], stack[stack.length - 1]);
        stack.pop();
        break;
      case 'separator':
        // Just continue on the same slide if incremental slides are disabled
        if (token.text === '--' && options.disableIncrementalSlides === true) {
          // If it happens that there was a note section right before, just get
          // rid of it
          if (stack[0].notes !== undefined)
            delete(stack[0].notes);
          break;
        }
        // Slide separator (--- or --), so add current slide to list of
        // slides and re-initialize stack with new, blank slide.
        slides.push(stack[0]);
        stack = [createSlide()];
        // Tag the new slide as a continued slide if the separator
        // used was -- instead of --- (2 vs. 3 dashes).
        stack[0].properties.continued = (token.text === '--').toString();
        break;
      case 'notes_separator':
        // Notes separator (???), so create empty content list on slide
        // in which all remaining slide content will be put.
        stack[0].notes = [];
        break;
    }
  });

  // Push current slide to list of slides.
  slides.push(stack[0]);

  slides.forEach(function (slide) {
    slide.content[0] = extractProperties(slide.content[0] || '', slide.properties);
  });

  return slides.filter(function (slide) {
    var exclude = (slide.properties.exclude || '').toLowerCase();

    if (exclude === 'true') {
      return false;
    }

    return true;
  });
};

function createSlide () {
  return {
    content: [],
    properties: {
      continued: 'false'
    },
    links: {}
  };
}

function createContentClass (token) {
  return {
    class: token.classes.join(' '),
    block: token.block,
    content: []
  };
}

function appendTo (element, content) {
  var target = element.content;

  if (element.notes !== undefined) {
    target = element.notes;
  }

  // If two string are added after one another, we can just as well
  // go ahead and concatenate them into a single string.
  var lastIdx = target.length - 1;
  if (typeof target[lastIdx] === 'string' && typeof content === 'string') {
    target[lastIdx] += content;
  }
  else {
    target.push(content);
  }
}

function extractProperties (source, properties) {
  var propertyFinder = /^\n*([-\w]+):([^$\n]*)|\n*(?:<!--\s*)([-\w]+):([^$\n]*?)(?:\s*-->)/i
    , match
    ;

  while ((match = propertyFinder.exec(source)) !== null) {
    source = source.substr(0, match.index) +
      source.substr(match.index + match[0].length);

    if (match[1] !== undefined) {
      properties[match[1].trim()] = match[2].trim();
    }
    else {
      properties[match[3].trim()] = match[4].trim();
    }

    propertyFinder.lastIndex = match.index;
  }

  return source;
}

function cleanInput(source) {
  // If all lines are indented, we should trim them all to the same point so that code doesn't
  // need to start at column 0 in the source (see GitHub Issue #105)

  // Helper to extract captures from the regex
  var getMatchCaptures = function (source, pattern) {
    var results = [], match;
    while ((match = pattern.exec(source)) !== null)
      results.push(match[1]);
    return results;
  };

  // Calculate the minimum leading whitespace
  // Ensure there's at least one char that's not newline nor whitespace to ignore empty and blank lines
  var leadingWhitespacePattern = /^([ \t]*)[^ \t\n]/gm;
  var whitespace = getMatchCaptures(source, leadingWhitespacePattern).map(function (s) { return s.length; });
  var minWhitespace = Math.min.apply(Math, whitespace);

  // Trim off the exact amount of whitespace, or less for blank lines (non-empty)
  var trimWhitespacePattern = new RegExp('^[ \\t]{0,' + minWhitespace + '}', 'gm');
  return source.replace(trimWhitespacePattern, '');
}

},{"./lexer":16}],23:[function(require,module,exports){
/* Automatically generated */

module.exports = {
  version: "0.15.0",
  documentStyles: "html.remark-container,body.remark-container{height:100%;width:100%;-webkit-print-color-adjust:exact}.remark-container{background:#d7d8d2;margin:0;overflow:hidden}.remark-container:focus{outline-style:solid;outline-width:1px}.remark-container:-webkit-full-screen{width:100%;height:100%}body:-webkit-full-screen{background:#000000}body:-moz-full-screen{background:#000000}body:fullscreen{background:#000000}.remark-slides-area{position:relative;height:100%;width:100%}.remark-slide-container{display:none;position:absolute;height:100%;width:100%;page-break-after:always}.remark-slide-scaler{background-color:transparent;overflow:auto;position:absolute;-webkit-transform-origin:top left;-moz-transform-origin:top left;transform-origin:top-left;-moz-box-shadow:0 0 30px #888;-webkit-box-shadow:0 0 30px #888;box-shadow:0 0 30px #888}.remark-slide{height:100%;width:100%;display:table;table-layout:fixed;position:relative}.remark-slide>.left{text-align:left}.remark-slide>.center{text-align:center}.remark-slide>.right{text-align:right}.remark-slide>.top{vertical-align:top}.remark-slide>.middle{vertical-align:middle}.remark-slide>.bottom{vertical-align:bottom}.remark-slide-content{background-color:#fff;background-position:center;background-repeat:no-repeat;display:table-cell;font-size:22px;padding:1em 2em 1em 2em}.remark-slide-content h1{font-size:55px}.remark-slide-content h2{font-size:45px}.remark-slide-content h3{font-size:35px}.remark-slide-content .left{display:block;text-align:left}.remark-slide-content .center{display:block;text-align:center}.remark-slide-content .right{display:block;text-align:right}.remark-slide-number{bottom:12px;opacity:.5;position:absolute;right:20px}.remark-slide-notes{border-top:3px solid black;position:absolute;display:none}.remark-code{font-size:18px}.remark-code-line{min-height:1em}.remark-code-line-highlighted{background-color:rgba(255,255,0,0.5)}.remark-code-span-highlighted{background-color:rgba(255,255,0,0.5);padding:1px 2px 2px 2px}.remark-visible{display:block;z-index:2}.remark-fading{display:block;z-index:1}.remark-fading .remark-slide-scaler{-moz-box-shadow:none;-webkit-box-shadow:none;box-shadow:none}.remark-backdrop{position:absolute;top:0;bottom:0;left:0;right:0;display:none;background:#000;z-index:2}.remark-pause{bottom:0;top:0;right:0;left:0;display:none;position:absolute;z-index:1000}.remark-pause .remark-pause-lozenge{margin-top:30%;text-align:center}.remark-pause .remark-pause-lozenge span{color:white;background:black;border:2px solid black;border-radius:20px;padding:20px 30px;font-family:Helvetica,arial,freesans,clean,sans-serif;font-size:42pt;font-weight:bold}.remark-container.remark-presenter-mode.remark-pause-mode .remark-pause{display:block}.remark-container.remark-presenter-mode.remark-pause-mode .remark-backdrop{display:block;opacity:.5}.remark-help{bottom:0;top:0;right:0;left:0;display:none;position:absolute;z-index:1000;-webkit-transform-origin:top left;-moz-transform-origin:top left;transform-origin:top-left}.remark-help .remark-help-content{color:white;font-family:Helvetica,arial,freesans,clean,sans-serif;font-size:12pt;position:absolute;top:5%;bottom:10%;height:10%;left:5%;width:90%}.remark-help .remark-help-content h1{font-size:36px}.remark-help .remark-help-content td{color:white;font-size:12pt;padding:10px}.remark-help .remark-help-content td:first-child{padding-left:0}.remark-help .remark-help-content .key{background:white;color:black;min-width:1em;display:inline-block;padding:3px 6px;text-align:center;border-radius:4px;font-size:14px}.remark-help .dismiss{top:85%}.remark-container.remark-help-mode .remark-help{display:block}.remark-container.remark-help-mode .remark-backdrop{display:block;opacity:.95}.remark-preview-area{bottom:2%;left:2%;display:none;opacity:.5;position:absolute;height:47.25%;width:48%}.remark-preview-area .remark-slide-container{display:block}.remark-notes-area{background:#fff;bottom:0;color:black;display:none;left:52%;overflow:hidden;position:absolute;right:0;top:0}.remark-notes-area .remark-top-area{height:50px;left:20px;position:absolute;right:10px;top:10px}.remark-notes-area .remark-bottom-area{position:absolute;top:75px;bottom:10px;left:20px;right:10px}.remark-notes-area .remark-bottom-area .remark-toggle{display:block;text-decoration:none;font-family:Helvetica,arial,freesans,clean,sans-serif;height:21px;font-size:.75em;text-transform:uppercase;color:#ccc}.remark-notes-area .remark-bottom-area .remark-notes-current-area{height:70%;position:relative}.remark-notes-area .remark-bottom-area .remark-notes-current-area .remark-notes{clear:both;border-top:1px solid #f5f5f5;position:absolute;top:22px;bottom:0px;left:0px;right:0px;overflow-y:auto;margin-bottom:20px;padding-top:10px}.remark-notes-area .remark-bottom-area .remark-notes-preview-area{height:30%;position:relative}.remark-notes-area .remark-bottom-area .remark-notes-preview-area .remark-notes-preview{border-top:1px solid #f5f5f5;position:absolute;top:22px;bottom:0px;left:0px;right:0px;overflow-y:auto}.remark-notes-area .remark-bottom-area .remark-notes>*:first-child,.remark-notes-area .remark-bottom-area .remark-notes-preview>*:first-child{margin-top:5px}.remark-notes-area .remark-bottom-area .remark-notes>*:last-child,.remark-notes-area .remark-bottom-area .remark-notes-preview>*:last-child{margin-bottom:0}.remark-toolbar{color:#979892;vertical-align:middle}.remark-toolbar .remark-toolbar-link{border:2px solid #d7d8d2;color:#979892;display:inline-block;padding:2px 2px;text-decoration:none;text-align:center;min-width:20px}.remark-toolbar .remark-toolbar-link:hover{border-color:#979892;color:#676862}.remark-toolbar .remark-toolbar-timer{border:2px solid black;border-radius:10px;background:black;color:white;display:inline-block;float:right;padding:5px 10px;font-family:sans-serif;font-weight:bold;font-size:175%;text-decoration:none;text-align:center}.remark-container.remark-presenter-mode .remark-slides-area{top:2%;left:2%;height:47.25%;width:48%}.remark-container.remark-presenter-mode .remark-preview-area{display:block}.remark-container.remark-presenter-mode .remark-notes-area{display:block}.remark-container.remark-blackout-mode:not(.remark-presenter-mode) .remark-backdrop{display:block;opacity:.99}.remark-container.remark-mirrored-mode:not(.remark-presenter-mode) .remark-slides-area{-webkit-transform:scaleX(-1);-moz-transform:scaleX(-1);-ms-transform:scaleX(-1);-o-transform:scaleX(-1)}@media print{.remark-container{overflow:visible;background-color:#fff}.remark-container.remark-presenter-mode .remark-slides-area{top:0px;left:0px;height:100%;width:681px}.remark-container.remark-presenter-mode .remark-preview-area,.remark-container.remark-presenter-mode .remark-notes-area{display:none}.remark-container.remark-presenter-mode .remark-slide-notes{display:block;margin-left:30px;width:621px}.remark-slide-container{display:block;position:relative}.remark-slide-scaler{-moz-box-shadow:none;-webkit-box-shadow:none;-webkit-transform-origin:initial;box-shadow:none}}@page{margin:0}",
  containerLayout: "<div class=\"remark-notes-area\">\r\n  <div class=\"remark-top-area\">\r\n    <div class=\"remark-toolbar\">\r\n      <a class=\"remark-toolbar-link\" href=\"#increase\">+</a>\r\n      <a class=\"remark-toolbar-link\" href=\"#decrease\">-</a>\r\n      <span class=\"remark-toolbar-timer\"></span>\r\n    </div>\r\n  </div>\r\n  <div class=\"remark-bottom-area\">\r\n    <div class=\"remark-notes-current-area\">\r\n      <div class=\"remark-toggle\">Notes for current slide</div>\r\n      <div class=\"remark-notes\"></div>\r\n    </div>\r\n    <div class=\"remark-notes-preview-area\">\r\n      <div class=\"remark-toggle\">Notes for next slide</div>\r\n      <div class=\"remark-notes-preview\"></div>\r\n    </div>\r\n  </div>\r\n</div>\r\n<div class=\"remark-slides-area\"></div>\r\n<div class=\"remark-preview-area\"></div>\r\n<div class=\"remark-backdrop\"></div>\r\n<div class=\"remark-pause\">\r\n  <div class=\"remark-pause-lozenge\">\r\n    <span>Paused</span>\r\n  </div>\r\n</div>\r\n<div class=\"remark-help\">\r\n  <div class=\"remark-help-content\">\r\n    <h1>Help</h1>\r\n    <p><b>Keyboard shortcuts</b></p>\r\n    <table class=\"light-keys\">\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\"><b>&uarr;</b></span>,\r\n          <span class=\"key\"><b>&larr;</b></span>,\r\n          <span class=\"key\">Pg Up</span>,\r\n          <span class=\"key\">k</span>\r\n        </td>\r\n        <td>Go to previous slide</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\"><b>&darr;</b></span>,\r\n          <span class=\"key\"><b>&rarr;</b></span>,\r\n          <span class=\"key\">Pg Dn</span>,\r\n          <span class=\"key\">Space</span>,\r\n          <span class=\"key\">j</span>\r\n        </td>\r\n        <td>Go to next slide</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">Home</span>\r\n        </td>\r\n        <td>Go to first slide</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">End</span>\r\n        </td>\r\n        <td>Go to last slide</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          Number + <span class=\"key\">Return</span>\r\n        </td>\r\n        <td>Go to specific slide</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">b</span>&nbsp;/\r\n          <span class=\"key\">m</span>&nbsp;/\r\n          <span class=\"key\">f</span>\r\n        </td>\r\n        <td>Toggle blackout / mirrored / fullscreen mode</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">c</span>\r\n        </td>\r\n        <td>Clone slideshow</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">p</span>\r\n        </td>\r\n        <td>Toggle presenter mode</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">s</span>\r\n        </td>\r\n        <td>Start & Stop the presentation timer</td>\r\n      </tr>\r\n       <tr>\r\n        <td>\r\n          <span class=\"key\">t</span>\r\n        </td>\r\n        <td>Reset the presentation timer</td>\r\n      </tr>\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">?</span>,\r\n          <span class=\"key\">h</span>\r\n        </td>\r\n        <td>Toggle this help</td>\r\n      </tr>\r\n    </table>\r\n  </div>\r\n  <div class=\"content dismiss\">\r\n    <table class=\"light-keys\">\r\n      <tr>\r\n        <td>\r\n          <span class=\"key\">Esc</span>\r\n        </td>\r\n        <td>Back to slideshow</td>\r\n      </tr>\r\n    </table>\r\n  </div>\r\n</div>\r\n"
};

},{}],24:[function(require,module,exports){
var referenceWidth = 908
  , referenceHeight = 681
  , referenceRatio = referenceWidth / referenceHeight
  ;

module.exports = Scaler;

function Scaler (events, slideshow) {
  var self = this;

  self.events = events;
  self.slideshow = slideshow;
  self.ratio = getRatio(slideshow);
  self.dimensions = getDimensions(self.ratio);

  self.events.on('propertiesChanged', function (changes) {
    if (changes.hasOwnProperty('ratio')) {
      self.ratio = getRatio(slideshow);
      self.dimensions = getDimensions(self.ratio);
    }
  });
}

Scaler.prototype.scaleToFit = function (element, container) {
  var self = this
    , containerHeight = container.clientHeight
    , containerWidth = container.clientWidth
    , scale
    , scaledWidth
    , scaledHeight
    , ratio = self.ratio
    , dimensions = self.dimensions
    , direction
    , left
    , top
    ;

  if (containerWidth / ratio.width > containerHeight / ratio.height) {
    scale = containerHeight / dimensions.height;
  }
  else {
    scale = containerWidth / dimensions.width;
  }

  scaledWidth = dimensions.width * scale;
  scaledHeight = dimensions.height * scale;

  left = (containerWidth - scaledWidth) / 2;
  top = (containerHeight - scaledHeight) / 2;

  element.style['-webkit-transform'] = 'scale(' + scale + ')';
  element.style.MozTransform = 'scale(' + scale + ')';
  element.style.left = Math.max(left, 0) + 'px';
  element.style.top = Math.max(top, 0) + 'px';
};

function getRatio (slideshow) {
  var ratioComponents = slideshow.getRatio().split(':')
    , ratio
    ;

  ratio = {
    width: parseInt(ratioComponents[0], 10)
  , height: parseInt(ratioComponents[1], 10)
  };

  ratio.ratio = ratio.width / ratio.height;

  return ratio;
}

function getDimensions (ratio) {
  return {
    width: Math.floor(referenceWidth / referenceRatio * ratio.ratio)
  , height: referenceHeight
  };
}

},{}],25:[function(require,module,exports){
exports.addClass = function (element, className) {
  element.className = exports.getClasses(element)
    .concat([className])
    .join(' ');
};

exports.removeClass = function (element, className) {
  element.className = exports.getClasses(element)
    .filter(function (klass) { return klass !== className; })
    .join(' ');
};

exports.toggleClass = function (element, className) {
  var classes = exports.getClasses(element),
      index = classes.indexOf(className);

  if (index !== -1) {
    classes.splice(index, 1);
  }
  else {
    classes.push(className);
  }

  element.className = classes.join(' ');
};

exports.getClasses = function (element) {
  return element.className
    .split(' ')
    .filter(function (s) { return s !== ''; });
};

exports.hasClass = function (element, className) {
  return exports.getClasses(element).indexOf(className) !== -1;
};

exports.getPrefixedProperty = function (element, propertyName) {
  var capitalizedPropertName = propertyName[0].toUpperCase() +
    propertyName.slice(1);

  return element[propertyName] || element['moz' + capitalizedPropertName] ||
    element['webkit' + capitalizedPropertName];
};

},{}],26:[function(require,module,exports){
var converter = require('../converter');

module.exports = NotesView;

function NotesView (events, element, slideViewsAccessor) {
  var self = this;

  self.events = events;
  self.element = element;
  self.slideViewsAccessor = slideViewsAccessor;

  self.configureElements();

  events.on('showSlide', function (slideIndex) {
    self.showSlide(slideIndex);
  });
}

NotesView.prototype.showSlide = function (slideIndex) {
  var self = this
    , slideViews = self.slideViewsAccessor()
    , slideView = slideViews[slideIndex]
    , nextSlideView = slideViews[slideIndex + 1]
    ;

  self.notesElement.innerHTML = slideView.notesElement.innerHTML;

  if (nextSlideView) {
    self.notesPreviewElement.innerHTML = nextSlideView.notesElement.innerHTML;
  }
  else {
    self.notesPreviewElement.innerHTML = '';
  }
};

NotesView.prototype.configureElements = function () {
  var self = this;

  self.notesElement = self.element.getElementsByClassName('remark-notes')[0];
  self.notesPreviewElement = self.element.getElementsByClassName('remark-notes-preview')[0];

  self.notesElement.addEventListener('mousewheel', function (event) {
    event.stopPropagation();
  });

  self.notesPreviewElement.addEventListener('mousewheel', function (event) {
    event.stopPropagation();
  });

  self.toolbarElement = self.element.getElementsByClassName('remark-toolbar')[0];

  var commands = {
    increase: function () {
      self.notesElement.style.fontSize = (parseFloat(self.notesElement.style.fontSize) || 1) + 0.1 + 'em';
      self.notesPreviewElement.style.fontsize = self.notesElement.style.fontSize;
    },
    decrease: function () {
      self.notesElement.style.fontSize = (parseFloat(self.notesElement.style.fontSize) || 1) - 0.1 + 'em';
      self.notesPreviewElement.style.fontsize = self.notesElement.style.fontSize;
    }
  };

  self.toolbarElement.getElementsByTagName('a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var command = e.target.hash.substr(1);
      commands[command]();
      e.preventDefault();
    });
  });
};

},{"../converter":13}],27:[function(require,module,exports){
var SlideNumber = require('../components/slide-number/slide-number')
  , converter = require('../converter')
  , highlighter = require('../highlighter')
  , utils = require('../utils')
  ;

module.exports = SlideView;

function SlideView (events, slideshow, scaler, slide) {
  var self = this;

  self.events = events;
  self.slideshow = slideshow;
  self.scaler = scaler;
  self.slide = slide;

  self.slideNumber = new SlideNumber(slide, slideshow);

  self.configureElements();
  self.updateDimensions();

  self.events.on('propertiesChanged', function (changes) {
    if (changes.hasOwnProperty('ratio')) {
      self.updateDimensions();
    }
  });
}

SlideView.prototype.updateDimensions = function () {
  var self = this
    , dimensions = self.scaler.dimensions
    ;

  self.scalingElement.style.width = dimensions.width + 'px';
  self.scalingElement.style.height = dimensions.height + 'px';
};

SlideView.prototype.scale = function (containerElement) {
  var self = this;

  self.scaler.scaleToFit(self.scalingElement, containerElement);
};

SlideView.prototype.show = function () {
  utils.addClass(this.containerElement, 'remark-visible');
  utils.removeClass(this.containerElement, 'remark-fading');
};

SlideView.prototype.hide = function () {
  var self = this;
  utils.removeClass(this.containerElement, 'remark-visible');
  // Don't just disappear the slide. Mark it as fading, which
  // keeps it on the screen, but at a reduced z-index.
  // Then set a timer to remove the fading state in 1s.
  utils.addClass(this.containerElement, 'remark-fading');
  setTimeout(function(){
      utils.removeClass(self.containerElement, 'remark-fading');
  }, 1000);
};

SlideView.prototype.configureElements = function () {
  var self = this;

  self.containerElement = document.createElement('div');
  self.containerElement.className = 'remark-slide-container';

  self.scalingElement = document.createElement('div');
  self.scalingElement.className = 'remark-slide-scaler';

  self.element = createSlideElement(self.slide);

  self.contentElement = createContentElement(self.events, self.slideshow, self.slide);
  self.notesElement = createNotesElement(self.slideshow, self.slide.notes);

  self.contentElement.appendChild(self.slideNumber.element);
  self.element.appendChild(self.contentElement);
  self.scalingElement.appendChild(self.element);
  self.containerElement.appendChild(self.scalingElement);
  self.containerElement.appendChild(self.notesElement);
};

SlideView.prototype.scaleBackgroundImage = function (dimensions) {
  var self = this
    , styles = window.getComputedStyle(this.contentElement)
    , backgroundImage = styles.backgroundImage
    , backgroundSize = styles.backgroundSize
    , backgroundPosition = styles.backgroundPosition
    , match
    , image
    , scale
    ;

  // If the user explicitly sets the backgroundSize or backgroundPosition, let
  // that win and early return here.
  if ((backgroundSize || backgroundPosition) && !self.backgroundSizeSet) {
    return;
  }

  if ((match = /^url\(("?)([^\)]+?)\1\)/.exec(backgroundImage)) !== null) {
    image = new Image();
    image.onload = function () {
      if (image.width > dimensions.width ||
          image.height > dimensions.height) {
        // Background image is larger than slide
        if (!self.originalBackgroundSize) {
          // No custom background size has been set
          self.originalBackgroundSize = self.contentElement.style.backgroundSize;
          self.originalBackgroundPosition = self.contentElement.style.backgroundPosition;
          self.backgroundSizeSet = true;

          if (dimensions.width / image.width < dimensions.height / image.height) {
            scale = dimensions.width / image.width;
          }
          else {
            scale = dimensions.height / image.height;
          }

          self.contentElement.style.backgroundSize = image.width * scale +
            'px ' + image.height * scale + 'px';
          self.contentElement.style.backgroundPosition = '50% ' +
            ((dimensions.height - (image.height * scale)) / 2) + 'px';
        }
      }
      else {
        // Revert to previous background size setting
        if (self.backgroundSizeSet) {
          self.contentElement.style.backgroundSize = self.originalBackgroundSize;
          self.contentElement.style.backgroundPosition = self.originalBackgroundPosition;
          self.backgroundSizeSet = false;
        }
      }
    };
    image.src = match[2];
  }
};

function createSlideElement(slide) {
  var element = document.createElement('div');
  element.className = 'remark-slide';
  
  if (slide.properties.continued === 'true') {
    utils.addClass(element, 'remark-slide-incremental');
  }
  
  return element;
}

function createContentElement (events, slideshow, slide) {
  var element = document.createElement('div');

  if (slide.properties.name) {
    element.id = 'slide-' + slide.properties.name;
  }

  styleContentElement(slideshow, element, slide.properties);

  element.innerHTML = converter.convertMarkdown(slide.content, slideshow.getLinks());

  highlightCodeBlocks(element, slideshow);

  return element;
}

function styleContentElement (slideshow, element, properties) {
  element.className = '';

  setClassFromProperties(element, properties);
  setHighlightStyleFromProperties(element, properties, slideshow);
  setBackgroundFromProperties(element, properties);
}

function createNotesElement (slideshow, notes) {
  var element = document.createElement('div');

  element.className = 'remark-slide-notes';

  element.innerHTML = converter.convertMarkdown(notes, slideshow.getLinks());

  highlightCodeBlocks(element, slideshow);

  return element;
}

function setBackgroundFromProperties (element, properties) {
  var backgroundImage = properties['background-image'];
  var backgroundColor = properties['background-color'];
  var backgroundSize = properties['background-size'];
  var backgroundPosition = properties['background-position'];

  if (backgroundImage) {
    element.style.backgroundImage = backgroundImage;
  }
  if (backgroundColor) {
    element.style.backgroundColor = backgroundColor;
  }
  if (backgroundSize) {
    element.style.backgroundSize = backgroundSize;
  }
  if (backgroundPosition) {
    element.style.backgroundPosition = backgroundPosition;
  }
}

function setHighlightStyleFromProperties (element, properties, slideshow) {
  var highlightStyle = properties['highlight-style'] ||
      slideshow.getHighlightStyle();

  if (highlightStyle) {
    utils.addClass(element, 'hljs-' + highlightStyle);
  }
}

function setClassFromProperties (element, properties) {
  utils.addClass(element, 'remark-slide-content');

  (properties['class'] || '').split(/,| /)
    .filter(function (s) { return s !== ''; })
    .forEach(function (c) { utils.addClass(element, c); });
}

function highlightCodeBlocks (content, slideshow) {
  var codeBlocks = content.getElementsByTagName('code'),
      highlightLines = slideshow.getHighlightLines(),
      highlightSpans = slideshow.getHighlightSpans(),
      highlightInline = slideshow.getHighlightInlineCode(),
      meta;

  codeBlocks.forEach(function (block) {
    if (block.className === '') {
      block.className = slideshow.getHighlightLanguage();
    }

    if (block.parentElement.tagName !== 'PRE') {
      utils.addClass(block, 'remark-inline-code');
      if (highlightInline) {
        highlighter.engine.highlightBlock(block, '');
      }
      return;
    }

    if (highlightLines) {
      meta = extractMetadata(block);
    }

    if (block.className !== '') {
      highlighter.engine.highlightBlock(block, '  ');
    }

    wrapLines(block);

    if (highlightLines) {
      highlightBlockLines(block, meta.highlightedLines);
    }

    if (highlightSpans) {
      // highlightSpans is either true or a RegExp
      highlightBlockSpans(block, highlightSpans);
    }

    utils.addClass(block, 'remark-code');
  });
}

function extractMetadata (block) {
  var highlightedLines = [];

  block.innerHTML = block.innerHTML.split(/\r?\n/).map(function (line, i) {
    if (line.indexOf('*') === 0) {
      highlightedLines.push(i);
      return line.replace(/^\*( )?/, '$1$1');
    }

    return line;
  }).join('\n');

  return {
    highlightedLines: highlightedLines
  };
}

function wrapLines (block) {
  var lines = block.innerHTML.split(/\r?\n/).map(function (line) {
    return '<div class="remark-code-line">' + line + '</div>';
  });

  // Remove empty last line (due to last \n)
  if (lines.length && lines[lines.length - 1].indexOf('><') !== -1) {
    lines.pop();
  }

  block.innerHTML = lines.join('');
}

function highlightBlockLines (block, lines) {
  lines.forEach(function (i) {
    utils.addClass(block.childNodes[i], 'remark-code-line-highlighted');
  });
}

/**
 * @param highlightSpans `true` or a RegExp
 */
function highlightBlockSpans (block, highlightSpans) {
  var pattern;
  if (highlightSpans === true) {
    pattern = /([^`])`([^`]+?)`/g;
  } else if (highlightSpans instanceof RegExp) {
    if (! highlightSpans.global) {
      throw new Error('The regular expression in `highlightSpans` must have flag /g');
    }
    // Use [^] instead of dot (.) so that even newlines match
    // We prefix the escape group, so users can provide nicer regular expressions
    var flags = highlightSpans.flags || 'g'; // ES6 feature; use if it’s available
    pattern = new RegExp('([^])' + highlightSpans.source, flags);
  } else {
    throw new Error('Illegal value for `highlightSpans`');
  }

  block.childNodes.forEach(function (element) {
    element.innerHTML = element.innerHTML.replace(pattern,
      function (m,e,c) {
        if (e === '\\') {
          return m.substr(1);
        }
        return e + '<span class="remark-code-span-highlighted">' +
          c + '</span>';
      });
  });
}
},{"../components/slide-number/slide-number":"components/slide-number","../converter":13,"../highlighter":15,"../utils":25}],28:[function(require,module,exports){
var SlideView = require('./slideView')
  , Timer = require('../components/timer/timer')
  , NotesView = require('./notesView')
  , Scaler = require('../scaler')
  , resources = require('../resources')
  , utils = require('../utils')
  , printing = require('../components/printing/printing')
  ;

module.exports = SlideshowView;

function SlideshowView (events, dom, options, slideshow) {
  var self = this;
  var containerElement = options.container;

  self.events = events;
  self.dom = dom;
  self.slideshow = slideshow;
  self.scaler = new Scaler(events, slideshow);
  self.slideViews = [];

  self.configureContainerElement(containerElement);
  self.configureChildElements();

  self.updateDimensions();
  self.scaleElements();
  self.updateSlideViews();

  self.timer = new Timer(events, self.timerElement, options.timer);

  events.on('slidesChanged', function () {
    self.updateSlideViews();
  });

  events.on('hideSlide', function (slideIndex) {
    // To make sure that there is only one element fading at a time,
    // remove the fading class from all slides before hiding
    // the new slide.
    self.elementArea.getElementsByClassName('remark-fading').forEach(function (slide) {
      utils.removeClass(slide, 'remark-fading');
    });
    self.hideSlide(slideIndex);
  });

  events.on('showSlide', function (slideIndex) {
    self.showSlide(slideIndex);
  });

  events.on('forcePresenterMode', function () {

    if (!utils.hasClass(self.containerElement, 'remark-presenter-mode')) {
      utils.toggleClass(self.containerElement, 'remark-presenter-mode');
      self.scaleElements();
      printing.setPageOrientation('landscape');
    }
  });

  events.on('togglePresenterMode', function () {
    utils.toggleClass(self.containerElement, 'remark-presenter-mode');
    self.scaleElements();
    events.emit('toggledPresenter', self.slideshow.getCurrentSlideIndex() + 1);

    if (utils.hasClass(self.containerElement, 'remark-presenter-mode')) {
      printing.setPageOrientation('portrait');
    }
    else {
      printing.setPageOrientation('landscape');
    }
  });

  events.on('toggleHelp', function () {
    utils.toggleClass(self.containerElement, 'remark-help-mode');
  });

  events.on('toggleBlackout', function () {
    utils.toggleClass(self.containerElement, 'remark-blackout-mode');
  });

  events.on('toggleMirrored', function () {
    utils.toggleClass(self.containerElement, 'remark-mirrored-mode');
  });

  events.on('hideOverlay', function () {
    utils.removeClass(self.containerElement, 'remark-blackout-mode');
    utils.removeClass(self.containerElement, 'remark-help-mode');
  });

  events.on('pause', function () {
    utils.toggleClass(self.containerElement, 'remark-pause-mode');
  });

  events.on('resume', function () {
    utils.toggleClass(self.containerElement, 'remark-pause-mode');
  });

  handleFullscreen(self);
}

function handleFullscreen(self) {
  var requestFullscreen = utils.getPrefixedProperty(self.containerElement, 'requestFullScreen')
    , cancelFullscreen = utils.getPrefixedProperty(document, 'cancelFullScreen')
    ;

  self.events.on('toggleFullscreen', function () {
    var fullscreenElement = utils.getPrefixedProperty(document, 'fullscreenElement') ||
      utils.getPrefixedProperty(document, 'fullScreenElement');

    if (!fullscreenElement && requestFullscreen) {
      requestFullscreen.call(self.containerElement, Element.ALLOW_KEYBOARD_INPUT);
    }
    else if (cancelFullscreen) {
      cancelFullscreen.call(document);
    }
    self.scaleElements();
  });
}

SlideshowView.prototype.isEmbedded = function () {
  return this.containerElement !== this.dom.getBodyElement();
};

SlideshowView.prototype.configureContainerElement = function (element) {
  var self = this;

  self.containerElement = element;

  utils.addClass(element, 'remark-container');

  if (element === self.dom.getBodyElement()) {
    utils.addClass(self.dom.getHTMLElement(), 'remark-container');

    forwardEvents(self.events, window, [
      'hashchange', 'resize', 'keydown', 'keypress', 'mousewheel',
      'message', 'DOMMouseScroll'
    ]);
    forwardEvents(self.events, self.containerElement, [
      'touchstart', 'touchmove', 'touchend', 'click', 'contextmenu'
    ]);
  }
  else {
    element.style.position = 'absolute';
    element.tabIndex = -1;

    forwardEvents(self.events, window, ['resize']);
    forwardEvents(self.events, element, [
      'keydown', 'keypress', 'mousewheel',
      'touchstart', 'touchmove', 'touchend'
    ]);
  }

  // Tap event is handled in slideshow view
  // rather than controller as knowledge of
  // container width is needed to determine
  // whether to move backwards or forwards
  self.events.on('tap', function (endX) {
    if (endX < self.containerElement.clientWidth / 2) {
      self.slideshow.gotoPreviousSlide();
    }
    else {
      self.slideshow.gotoNextSlide();
    }
  });
};

function forwardEvents (target, source, events) {
  events.forEach(function (eventName) {
    source.addEventListener(eventName, function () {
      var args = Array.prototype.slice.call(arguments);
      target.emit.apply(target, [eventName].concat(args));
    });
  });
}

SlideshowView.prototype.configureChildElements = function () {
  var self = this;

  self.containerElement.innerHTML += resources.containerLayout;

  self.elementArea = self.containerElement.getElementsByClassName('remark-slides-area')[0];
  self.previewArea = self.containerElement.getElementsByClassName('remark-preview-area')[0];
  self.notesArea = self.containerElement.getElementsByClassName('remark-notes-area')[0];

  self.notesView = new NotesView (self.events, self.notesArea, function () {
    return self.slideViews;
  });

  self.backdropElement = self.containerElement.getElementsByClassName('remark-backdrop')[0];
  self.helpElement = self.containerElement.getElementsByClassName('remark-help')[0];

  self.timerElement = self.notesArea.getElementsByClassName('remark-toolbar-timer')[0];
  self.pauseElement = self.containerElement.getElementsByClassName('remark-pause')[0];

  self.events.on('propertiesChanged', function (changes) {
    if (changes.hasOwnProperty('ratio')) {
      self.updateDimensions();
    }
  });

  self.events.on('resize', onResize);

  printing.init();
  printing.on('print', onPrint);

  function onResize () {
    self.scaleElements();
  }

  function onPrint (e) {
    var slideHeight;

    if (e.isPortrait) {
      slideHeight = e.pageHeight * 0.4;
    }
    else {
      slideHeight = e.pageHeight;
    }

    self.slideViews.forEach(function (slideView) {
      slideView.scale({
        clientWidth: e.pageWidth,
        clientHeight: slideHeight
      });

      if (e.isPortrait) {
        slideView.scalingElement.style.top = '20px';
        slideView.notesElement.style.top = slideHeight + 40 + 'px';
      }
    });
  }
};

SlideshowView.prototype.updateSlideViews = function () {
  var self = this;

  self.slideViews.forEach(function (slideView) {
    self.elementArea.removeChild(slideView.containerElement);
  });

  self.slideViews = self.slideshow.getSlides().map(function (slide) {
    return new SlideView(self.events, self.slideshow, self.scaler, slide);
  });

  self.slideViews.forEach(function (slideView) {
    self.elementArea.appendChild(slideView.containerElement);
  });

  self.updateDimensions();

  if (self.slideshow.getCurrentSlideIndex() > -1) {
    self.showSlide(self.slideshow.getCurrentSlideIndex());
  }
};

SlideshowView.prototype.scaleSlideBackgroundImages = function (dimensions) {
  var self = this;

  self.slideViews.forEach(function (slideView) {
    slideView.scaleBackgroundImage(dimensions);
  });
};

SlideshowView.prototype.showSlide =  function (slideIndex) {
  var self = this
    , slideView = self.slideViews[slideIndex]
    , nextSlideView = self.slideViews[slideIndex + 1]
    ;

  self.events.emit("beforeShowSlide", slideIndex);

  slideView.show();

  if (nextSlideView) {
    self.previewArea.innerHTML = nextSlideView.containerElement.outerHTML;
  }
  else {
    self.previewArea.innerHTML = '';
  }

  self.events.emit("afterShowSlide", slideIndex);
};

SlideshowView.prototype.hideSlide = function (slideIndex) {
  var self = this
    , slideView = self.slideViews[slideIndex]
    ;

  self.events.emit("beforeHideSlide", slideIndex);
  slideView.hide();
  self.events.emit("afterHideSlide", slideIndex);

};

SlideshowView.prototype.updateDimensions = function () {
  var self = this
    , dimensions = self.scaler.dimensions
    ;

  self.helpElement.style.width = dimensions.width + 'px';
  self.helpElement.style.height = dimensions.height + 'px';

  self.scaleSlideBackgroundImages(dimensions);
  self.scaleElements();
};

SlideshowView.prototype.scaleElements = function () {
  var self = this;

  self.slideViews.forEach(function (slideView) {
    slideView.scale(self.elementArea);
  });

  if (self.previewArea.children.length) {
    self.scaler.scaleToFit(self.previewArea.children[0].children[0], self.previewArea);
  }
  self.scaler.scaleToFit(self.helpElement, self.containerElement);
  self.scaler.scaleToFit(self.pauseElement, self.containerElement);
};

},{"../components/printing/printing":"components/printing","../components/timer/timer":"components/timer","../resources":23,"../scaler":24,"../utils":25,"./notesView":26,"./slideView":27}],"components/printing":[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
  , styler = require('../styler/styler')
  ;

var LANDSCAPE = 'landscape'
  , PORTRAIT = 'portrait'
  , PAGE_HEIGHT = 681
  , PAGE_WIDTH = 908
  ;

function PrintComponent () {}

// Add eventing
PrintComponent.prototype = new EventEmitter();

// Sets up listener for printing
PrintComponent.prototype.init = function () {
  var self = this;

  this.setPageOrientation(LANDSCAPE);

  if (!window.matchMedia) {
    return false;
  }

  window.matchMedia('print').addListener(function (e) {
    self.onPrint(e);
  });
};

// Handles printing event
PrintComponent.prototype.onPrint = function (e) {
  var slideHeight;

  if (!e.matches) {
    return;
  }

  this.emit('print', {
    isPortrait: this._orientation === 'portrait'
  , pageHeight: this._pageHeight
  , pageWidth: this._pageWidth
  });
};

PrintComponent.prototype.setPageOrientation = function (orientation) {
  if (orientation === PORTRAIT) {
    // Flip dimensions for portrait orientation
    this._pageHeight = PAGE_WIDTH;
    this._pageWidth = PAGE_HEIGHT;
  }
  else if (orientation === LANDSCAPE) {
    this._pageHeight = PAGE_HEIGHT;
    this._pageWidth = PAGE_WIDTH;
  }
  else {
    throw new Error('Unknown print orientation: ' + orientation);
  }

  this._orientation = orientation;

  styler.setPageSize(this._pageWidth + 'px ' + this._pageHeight + 'px');
};

// Export singleton instance
module.exports = new PrintComponent();

},{"../styler/styler":"components/styler","events":1}],"components/slide-number":[function(require,module,exports){
module.exports = SlideNumberViewModel;

function SlideNumberViewModel (slide, slideshow) {
  var self = this;

  self.slide = slide;
  self.slideshow = slideshow;

  self.element = document.createElement('div');
  self.element.className = 'remark-slide-number';
  self.element.innerHTML = formatSlideNumber(self.slide, self.slideshow);
}

function formatSlideNumber (slide, slideshow) {
  var format = slideshow.getSlideNumberFormat()
    , slides = slideshow.getSlides()
    , current = getSlideNo(slide, slideshow)
    , total = getSlideNo(slides[slides.length - 1], slideshow)
    ;

  if (typeof format === 'function') {
    return format.call(slideshow, current, total);
  }

  return format
      .replace('%current%', current)
      .replace('%total%', total);
}

function getSlideNo (slide, slideshow) {
  return slide.getSlideNumber();
}

},{}],"components/styler":[function(require,module,exports){
var resources = require('../../resources')
  , highlighter = require('../../highlighter')
  ;

module.exports = {
  styleDocument: styleDocument
, setPageSize: setPageSize
};

// Applies bundled styles to document
function styleDocument () {
  var headElement, styleElement, style;

  // Bail out if document has already been styled
  if (getRemarkStylesheet()) {
    return;
  }

  headElement = document.getElementsByTagName('head')[0];
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';

  // Set title in order to enable lookup
  styleElement.title = 'remark';

  // Set document styles
  styleElement.innerHTML = resources.documentStyles;

  // Append highlighting styles
  for (style in highlighter.styles) {
    if (highlighter.styles.hasOwnProperty(style)) {
      styleElement.innerHTML = styleElement.innerHTML +
        highlighter.styles[style];
    }
  }

  // Put element first to prevent overriding user styles
  headElement.insertBefore(styleElement, headElement.firstChild);
}

function setPageSize (size) {
  var stylesheet = getRemarkStylesheet()
    , pageRule = getPageRule(stylesheet)
    ;

  pageRule.style.size = size;
}

// Locates the embedded remark stylesheet
function getRemarkStylesheet () {
  var i, l = document.styleSheets.length;

  for (i = 0; i < l; ++i) {
    if (document.styleSheets[i].title === 'remark') {
      return document.styleSheets[i];
    }
  }
}

// Locates the CSS @page rule
function getPageRule (stylesheet) {
  var i, l = stylesheet.cssRules.length;

  for (i = 0; i < l; ++i) {
    if (stylesheet.cssRules[i] instanceof window.CSSPageRule) {
      return stylesheet.cssRules[i];
    }
  }
}

},{"../../highlighter":15,"../../resources":23}],"components/timer":[function(require,module,exports){
var utils = require('../../utils');
var extend = require('extend');

module.exports = TimerViewModel;

function TimerViewModel(events, element, options) {
  var self = this;

  self.options = extend({}, { enabled: true, resetable: true, startOnChange: true, formatter: defaultFormatter }, options || {});
  self.element = element;
  self.reset();

  events.on('start', function () {
    if (self.options.startOnChange) {
      events.emit('startTimer');
    }
  });

  events.on('startTimer', function () {
    self.start();
  });

  events.on('pauseTimer', function () {
    self.pause();
  });

  events.on('toggleTimer', function () {
    self.toggle();
  });

  events.on('resetTimer', function () {
    if (self.options.resetable) {
      self.reset();
    }
  });


  setInterval(function () {
    self.tick();
  }, 100);
}
TimerViewModel.prototype.tick = function () {
  var self = this;

  self.chronos.tick();
  self.state.update(self.chronos);
  self.view.update(self.chronos.elapsedTime);
};
TimerViewModel.prototype.start = function () {
  var self = this;

  self.state = self.RUNNING;
};
TimerViewModel.prototype.pause = function () {
  var self = this;

  self.state = self.PAUSED;
};
TimerViewModel.prototype.toggle = function () {
  var self = this;

  if (self.state === self.RUNNING) {
    self.state = self.PAUSED;
  } else { // state === PAUSED || state == INITIAL
    self.state = self.RUNNING;
  }
};
TimerViewModel.prototype.reset = function () {
  var self = this;

  self.chronos = new Chronos();
  self.state = self.INITIAL;
  self.view = new TimerView(self.element, self.options);
};

TimerViewModel.prototype.INITIAL = new State('INITIAL', function (chronos) { /* do nothing */ });
TimerViewModel.prototype.RUNNING = new State('RUNNING', function (chronos) { chronos.addDelta(); });
TimerViewModel.prototype.PAUSED = new State('PAUSED', function (chronos) { /* do nothing */ });

function Chronos() {
  var self = this;

  var now = new Date().getTime();
  self.currentTick = now;
  self.lastTick = now;
  self.elapsedTime = 0;
}
Chronos.prototype.tick = function () {
  var self = this;

  var now = new Date().getTime();
  self.lastTick = self.currentTick;
  self.currentTick = now;
};
Chronos.prototype.addDelta = function () {
  var self = this;

  var delta = self.currentTick - self.lastTick;
  self.elapsedTime += delta;
};

function State(identifier, updater) {
  var self = this;

  self.identifier = identifier;
  self.updater = updater;
}
State.prototype.update = function (chronos) {
  this.updater(chronos);
};

function TimerView(element, options) {
  var self = this;

  self.element = element;
  self.enabled = options.enabled;
  self.formatter = options.formatter;

  if (!self.enabled) {
    self.element.style = 'display: none';
  }
}
TimerView.prototype.update = function (elapsedTime) {
  var self = this;

  var content = self.enabled ? self.formatter(elapsedTime) : '';
  self.element.innerHTML = content;
};

function defaultFormatter(elapsedTime) {
  var left = elapsedTime;
  var millis = left % 1000; left = idiv(left, 1000);
  var seconds = left % 60; left = idiv(left, 60);
  var minutes = left % 60; left = idiv(left, 60);
  var hours = left;

  return '' + hours + ':' + ([minutes, seconds]
    .map(function (d) { return '' + d; })
    .map(function (s) { return padStart(s, 2, '0'); })
    .join(':'));
}

function idiv(n, d) {
  return Math.floor(n / d);
}

function padStart(s, length, pad) {
  var result = s;
  while (result.length < length) {
    result = pad + result;
  }
  return result;
}
},{"../../utils":25,"extend":2}]},{},[5]);
