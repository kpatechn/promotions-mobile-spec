/*
 * Minimal standalone runtime for the design canvas's .dc.html artboards.
 * Lets each screen render in any browser (GitHub Pages or a local server)
 * without the Claude design canvas. Supports: {{holes}}, <sc-if>, <sc-for>,
 * <dc-import>, on* event bindings, and class Component extends DCLogic.
 */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var BOOL_ATTRS = { disabled: 1, checked: 1, hidden: 1, selected: 1, readonly: 1, required: 1 };
  var EVENT_NAMES = { onclick: 'click', oninput: 'input', onchange: 'change', onsubmit: 'submit', onkeydown: 'keydown', onfocus: 'focus', onblur: 'blur' };
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
    this.__render = null;
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.__render) this.__render();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__render) this.__render(); };
  window.DCLogic = DCLogic;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) {
      var v = lookup(e, scope);
      return v == null ? '' : String(v);
    });
  }

  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }

  // ---- loading other artboard files for <dc-import> ----
  var fileCache = {};
  function loadFile(name) {
    if (!fileCache[name]) {
      fileCache[name] = fetch(name + '.dc.html').then(function (r) {
        if (!r.ok) throw new Error('Could not load ' + name + '.dc.html');
        return r.text();
      }).then(parseSource);
    }
    return fileCache[name];
  }

  function parseSource(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return fromDocument(doc);
  }

  function fromDocument(doc) {
    var xdc = doc.querySelector('x-dc');
    var script = doc.querySelector('script[data-dc-script]');
    var tpl = document.createElement('template');
    tpl.innerHTML = xdc ? xdc.innerHTML : '';
    var helmet = tpl.content.querySelector('helmet');
    var helmetNodes = [];
    if (helmet) {
      helmetNodes = Array.prototype.slice.call(helmet.childNodes);
      helmet.parentNode.removeChild(helmet);
    }
    var Klass = DCLogic;
    var defaults = {};
    if (script) {
      try {
        Klass = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
      } catch (e) { console.error('Component script failed', e); }
      try {
        var meta = JSON.parse(script.getAttribute('data-props') || '{}');
        Object.keys(meta).forEach(function (k) { if (k[0] !== '$' && meta[k] && 'default' in meta[k] && meta[k].editor) defaults[k] = undefined; });
      } catch (e) { /* ignore */ }
    }
    return { template: tpl, helmetNodes: helmetNodes, Klass: Klass };
  }

  function applyHelmet(nodes) {
    nodes.forEach(function (n) {
      if (n.nodeType !== 1) return;
      var key = n.outerHTML;
      if (document.head.querySelector('[data-dc-helmet="' + btoa(unescape(encodeURIComponent(key))).slice(0, 40) + '"]')) return;
      var clone = document.importNode(n, true);
      clone.setAttribute('data-dc-helmet', btoa(unescape(encodeURIComponent(key))).slice(0, 40));
      document.head.appendChild(clone);
    });
  }

  // ---- mounting a component ----
  function mount(def, props, host) {
    applyHelmet(def.helmetNodes);
    var inst = new def.Klass(props);
    inst.props = props || {};
    if (!inst.state) inst.state = {};
    var children = {};
    inst.__render = function () {
      var scrolls = [];
      host.querySelectorAll('*').forEach(function (el) { scrolls.push(el.scrollTop); });
      var vals;
      try { vals = inst.renderVals ? inst.renderVals() : {}; } catch (e) { console.error(e); vals = {}; }
      var frag = document.createDocumentFragment();
      var ctx = { importIndex: 0, children: children };
      renderChildren(def.template.content, vals, frag, false, ctx);
      host.innerHTML = '';
      host.appendChild(frag);
      var all = host.querySelectorAll('*');
      for (var i = 0; i < all.length && i < scrolls.length; i++) if (scrolls[i]) all[i].scrollTop = scrolls[i];
    };
    inst.__render();
    if (inst.componentDidMount) inst.componentDidMount();
    return inst;
  }

  function renderChildren(parent, scope, out, inSvg, ctx) {
    var nodes = parent.childNodes;
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out, inSvg, ctx);
  }

  function renderNode(node, scope, out, inSvg, ctx) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();

    if (tag === 'sc-if') {
      var m = WHOLE.exec(node.getAttribute('value') || '');
      var ok = m ? lookup(m[1], scope) : false;
      if (ok) renderChildren(node.content || node, scope, out, inSvg, ctx);
      return;
    }
    if (tag === 'sc-for') {
      var lm = WHOLE.exec(node.getAttribute('list') || '');
      var list = lm ? lookup(lm[1], scope) : [];
      var as = node.getAttribute('as') || 'item';
      (list || []).forEach(function (item, idx) {
        var s = Object.create(scope);
        s[as] = item;
        s.$index = idx;
        renderChildren(node, s, out, inSvg, ctx);
      });
      return;
    }
    if (tag === 'dc-import') {
      var name = node.getAttribute('name');
      var props = {};
      Array.prototype.forEach.call(node.attributes, function (a) {
        if (a.name === 'name' || a.name.indexOf('hint-') === 0) return;
        var wm = WHOLE.exec(a.value);
        props[camel(a.name)] = wm ? lookup(wm[1], scope) : interp(a.value, scope);
      });
      var key = name + '#' + (ctx.importIndex++);
      var holder = ctx.children[key];
      if (!holder) {
        holder = document.createElement('div');
        holder.style.display = 'contents';
        ctx.children[key] = holder;
        loadFile(name).then(function (def) { mount(def, props, holder); })
          .catch(function (e) { holder.textContent = e.message; });
      }
      out.appendChild(holder);
      return;
    }

    var svg = inSvg || tag === 'svg';
    var el = svg ? document.createElementNS(SVG_NS, node.tagName.toLowerCase() === 'svg' ? 'svg' : node.localName) : document.createElement(tag);
    Array.prototype.forEach.call(node.attributes, function (a) {
      var n = a.name;
      if (n.indexOf('hint-') === 0) return;
      var wm = WHOLE.exec(a.value);
      if (EVENT_NAMES[n]) {
        var fn = wm ? lookup(wm[1], scope) : null;
        if (typeof fn === 'function') el.addEventListener(EVENT_NAMES[n], function (ev) { fn(ev); });
        return;
      }
      if (wm) {
        var v = lookup(wm[1], scope);
        if (BOOL_ATTRS[n]) { if (v) el.setAttribute(n, ''); return; }
        if (v == null || v === false && n.indexOf('aria-') !== 0) return;
        el.setAttribute(n, String(v));
        return;
      }
      el.setAttribute(n, interp(a.value, scope));
    });
    var src = tag === 'template' ? node.content : node;
    renderChildren(src, scope, el, svg && tag !== 'foreignobject', ctx);
    out.appendChild(el);
  }

  function boot() {
    var xdc = document.querySelector('x-dc');
    if (!xdc) return;
    var def = fromDocument(document);
    var host = document.createElement('div');
    host.setAttribute('data-dc-root', '');
    xdc.parentNode.replaceChild(host, xdc);
    var params = new URLSearchParams(location.search);
    var props = {};
    params.forEach(function (v, k) { props[k] = v === 'true' ? true : v === 'false' ? false : v; });
    mount(def, props, host);
  }

  // Hide raw template markup until the runtime has rendered it.
  var st = document.createElement('style');
  st.textContent = 'x-dc{display:none}';
  document.head.appendChild(st);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
