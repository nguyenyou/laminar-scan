"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i7 = decorators.length - 1, decorator; i7 >= 0; i7--)
      if (decorator = decorators[i7])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result) __defProp(target, key, result);
    return result;
  };

  // node_modules/@lit/reactive-element/css-tag.js
  var t = globalThis;
  var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
  var s = /* @__PURE__ */ Symbol();
  var o = /* @__PURE__ */ new WeakMap();
  var n = class {
    constructor(t6, e7, o6) {
      if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t6, this.t = e7;
    }
    get styleSheet() {
      let t6 = this.o;
      const s5 = this.t;
      if (e && void 0 === t6) {
        const e7 = void 0 !== s5 && 1 === s5.length;
        e7 && (t6 = o.get(s5)), void 0 === t6 && ((this.o = t6 = new CSSStyleSheet()).replaceSync(this.cssText), e7 && o.set(s5, t6));
      }
      return t6;
    }
    toString() {
      return this.cssText;
    }
  };
  var r = (t6) => new n("string" == typeof t6 ? t6 : t6 + "", void 0, s);
  var i = (t6, ...e7) => {
    const o6 = 1 === t6.length ? t6[0] : e7.reduce((e8, s5, o7) => e8 + ((t7) => {
      if (true === t7._$cssResult$) return t7.cssText;
      if ("number" == typeof t7) return t7;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t7 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s5) + t6[o7 + 1], t6[0]);
    return new n(o6, t6, s);
  };
  var S = (s5, o6) => {
    if (e) s5.adoptedStyleSheets = o6.map((t6) => t6 instanceof CSSStyleSheet ? t6 : t6.styleSheet);
    else for (const e7 of o6) {
      const o7 = document.createElement("style"), n5 = t.litNonce;
      void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e7.cssText, s5.appendChild(o7);
    }
  };
  var c = e ? (t6) => t6 : (t6) => t6 instanceof CSSStyleSheet ? ((t7) => {
    let e7 = "";
    for (const s5 of t7.cssRules) e7 += s5.cssText;
    return r(e7);
  })(t6) : t6;

  // node_modules/@lit/reactive-element/reactive-element.js
  var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
  var a = globalThis;
  var c2 = a.trustedTypes;
  var l = c2 ? c2.emptyScript : "";
  var p = a.reactiveElementPolyfillSupport;
  var d = (t6, s5) => t6;
  var u = { toAttribute(t6, s5) {
    switch (s5) {
      case Boolean:
        t6 = t6 ? l : null;
        break;
      case Object:
      case Array:
        t6 = null == t6 ? t6 : JSON.stringify(t6);
    }
    return t6;
  }, fromAttribute(t6, s5) {
    let i7 = t6;
    switch (s5) {
      case Boolean:
        i7 = null !== t6;
        break;
      case Number:
        i7 = null === t6 ? null : Number(t6);
        break;
      case Object:
      case Array:
        try {
          i7 = JSON.parse(t6);
        } catch (t7) {
          i7 = null;
        }
    }
    return i7;
  } };
  var f = (t6, s5) => !i2(t6, s5);
  var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
  Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
  var y = class extends HTMLElement {
    static addInitializer(t6) {
      this._$Ei(), (this.l ??= []).push(t6);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t6, s5 = b) {
      if (s5.state && (s5.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t6) && ((s5 = Object.create(s5)).wrapped = true), this.elementProperties.set(t6, s5), !s5.noAccessor) {
        const i7 = /* @__PURE__ */ Symbol(), h4 = this.getPropertyDescriptor(t6, i7, s5);
        void 0 !== h4 && e2(this.prototype, t6, h4);
      }
    }
    static getPropertyDescriptor(t6, s5, i7) {
      const { get: e7, set: r6 } = h(this.prototype, t6) ?? { get() {
        return this[s5];
      }, set(t7) {
        this[s5] = t7;
      } };
      return { get: e7, set(s6) {
        const h4 = e7?.call(this);
        r6?.call(this, s6), this.requestUpdate(t6, h4, i7);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t6) {
      return this.elementProperties.get(t6) ?? b;
    }
    static _$Ei() {
      if (this.hasOwnProperty(d("elementProperties"))) return;
      const t6 = n2(this);
      t6.finalize(), void 0 !== t6.l && (this.l = [...t6.l]), this.elementProperties = new Map(t6.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(d("finalized"))) return;
      if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
        const t7 = this.properties, s5 = [...r2(t7), ...o2(t7)];
        for (const i7 of s5) this.createProperty(i7, t7[i7]);
      }
      const t6 = this[Symbol.metadata];
      if (null !== t6) {
        const s5 = litPropertyMetadata.get(t6);
        if (void 0 !== s5) for (const [t7, i7] of s5) this.elementProperties.set(t7, i7);
      }
      this._$Eh = /* @__PURE__ */ new Map();
      for (const [t7, s5] of this.elementProperties) {
        const i7 = this._$Eu(t7, s5);
        void 0 !== i7 && this._$Eh.set(i7, t7);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(s5) {
      const i7 = [];
      if (Array.isArray(s5)) {
        const e7 = new Set(s5.flat(1 / 0).reverse());
        for (const s6 of e7) i7.unshift(c(s6));
      } else void 0 !== s5 && i7.push(c(s5));
      return i7;
    }
    static _$Eu(t6, s5) {
      const i7 = s5.attribute;
      return false === i7 ? void 0 : "string" == typeof i7 ? i7 : "string" == typeof t6 ? t6.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      this._$ES = new Promise((t6) => this.enableUpdating = t6), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t6) => t6(this));
    }
    addController(t6) {
      (this._$EO ??= /* @__PURE__ */ new Set()).add(t6), void 0 !== this.renderRoot && this.isConnected && t6.hostConnected?.();
    }
    removeController(t6) {
      this._$EO?.delete(t6);
    }
    _$E_() {
      const t6 = /* @__PURE__ */ new Map(), s5 = this.constructor.elementProperties;
      for (const i7 of s5.keys()) this.hasOwnProperty(i7) && (t6.set(i7, this[i7]), delete this[i7]);
      t6.size > 0 && (this._$Ep = t6);
    }
    createRenderRoot() {
      const t6 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return S(t6, this.constructor.elementStyles), t6;
    }
    connectedCallback() {
      this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t6) => t6.hostConnected?.());
    }
    enableUpdating(t6) {
    }
    disconnectedCallback() {
      this._$EO?.forEach((t6) => t6.hostDisconnected?.());
    }
    attributeChangedCallback(t6, s5, i7) {
      this._$AK(t6, i7);
    }
    _$ET(t6, s5) {
      const i7 = this.constructor.elementProperties.get(t6), e7 = this.constructor._$Eu(t6, i7);
      if (void 0 !== e7 && true === i7.reflect) {
        const h4 = (void 0 !== i7.converter?.toAttribute ? i7.converter : u).toAttribute(s5, i7.type);
        this._$Em = t6, null == h4 ? this.removeAttribute(e7) : this.setAttribute(e7, h4), this._$Em = null;
      }
    }
    _$AK(t6, s5) {
      const i7 = this.constructor, e7 = i7._$Eh.get(t6);
      if (void 0 !== e7 && this._$Em !== e7) {
        const t7 = i7.getPropertyOptions(e7), h4 = "function" == typeof t7.converter ? { fromAttribute: t7.converter } : void 0 !== t7.converter?.fromAttribute ? t7.converter : u;
        this._$Em = e7;
        const r6 = h4.fromAttribute(s5, t7.type);
        this[e7] = r6 ?? this._$Ej?.get(e7) ?? r6, this._$Em = null;
      }
    }
    requestUpdate(t6, s5, i7, e7 = false, h4) {
      if (void 0 !== t6) {
        const r6 = this.constructor;
        if (false === e7 && (h4 = this[t6]), i7 ??= r6.getPropertyOptions(t6), !((i7.hasChanged ?? f)(h4, s5) || i7.useDefault && i7.reflect && h4 === this._$Ej?.get(t6) && !this.hasAttribute(r6._$Eu(t6, i7)))) return;
        this.C(t6, s5, i7);
      }
      false === this.isUpdatePending && (this._$ES = this._$EP());
    }
    C(t6, s5, { useDefault: i7, reflect: e7, wrapped: h4 }, r6) {
      i7 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t6) && (this._$Ej.set(t6, r6 ?? s5 ?? this[t6]), true !== h4 || void 0 !== r6) || (this._$AL.has(t6) || (this.hasUpdated || i7 || (s5 = void 0), this._$AL.set(t6, s5)), true === e7 && this._$Em !== t6 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t6));
    }
    async _$EP() {
      this.isUpdatePending = true;
      try {
        await this._$ES;
      } catch (t7) {
        Promise.reject(t7);
      }
      const t6 = this.scheduleUpdate();
      return null != t6 && await t6, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      if (!this.isUpdatePending) return;
      if (!this.hasUpdated) {
        if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
          for (const [t8, s6] of this._$Ep) this[t8] = s6;
          this._$Ep = void 0;
        }
        const t7 = this.constructor.elementProperties;
        if (t7.size > 0) for (const [s6, i7] of t7) {
          const { wrapped: t8 } = i7, e7 = this[s6];
          true !== t8 || this._$AL.has(s6) || void 0 === e7 || this.C(s6, void 0, i7, e7);
        }
      }
      let t6 = false;
      const s5 = this._$AL;
      try {
        t6 = this.shouldUpdate(s5), t6 ? (this.willUpdate(s5), this._$EO?.forEach((t7) => t7.hostUpdate?.()), this.update(s5)) : this._$EM();
      } catch (s6) {
        throw t6 = false, this._$EM(), s6;
      }
      t6 && this._$AE(s5);
    }
    willUpdate(t6) {
    }
    _$AE(t6) {
      this._$EO?.forEach((t7) => t7.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t6)), this.updated(t6);
    }
    _$EM() {
      this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t6) {
      return true;
    }
    update(t6) {
      this._$Eq &&= this._$Eq.forEach((t7) => this._$ET(t7, this[t7])), this._$EM();
    }
    updated(t6) {
    }
    firstUpdated(t6) {
    }
  };
  y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

  // node_modules/lit-html/lit-html.js
  var t2 = globalThis;
  var i3 = (t6) => t6;
  var s2 = t2.trustedTypes;
  var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t6) => t6 }) : void 0;
  var h2 = "$lit$";
  var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
  var n3 = "?" + o3;
  var r3 = `<${n3}>`;
  var l2 = document;
  var c3 = () => l2.createComment("");
  var a2 = (t6) => null === t6 || "object" != typeof t6 && "function" != typeof t6;
  var u2 = Array.isArray;
  var d2 = (t6) => u2(t6) || "function" == typeof t6?.[Symbol.iterator];
  var f2 = "[ 	\n\f\r]";
  var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
  var _ = /-->/g;
  var m = />/g;
  var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
  var g = /'/g;
  var $ = /"/g;
  var y2 = /^(?:script|style|textarea|title)$/i;
  var x = (t6) => (i7, ...s5) => ({ _$litType$: t6, strings: i7, values: s5 });
  var b2 = x(1);
  var w = x(2);
  var T = x(3);
  var E = /* @__PURE__ */ Symbol.for("lit-noChange");
  var A = /* @__PURE__ */ Symbol.for("lit-nothing");
  var C = /* @__PURE__ */ new WeakMap();
  var P = l2.createTreeWalker(l2, 129);
  function V(t6, i7) {
    if (!u2(t6) || !t6.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== e3 ? e3.createHTML(i7) : i7;
  }
  var N = (t6, i7) => {
    const s5 = t6.length - 1, e7 = [];
    let n5, l3 = 2 === i7 ? "<svg>" : 3 === i7 ? "<math>" : "", c5 = v;
    for (let i8 = 0; i8 < s5; i8++) {
      const s6 = t6[i8];
      let a3, u5, d3 = -1, f3 = 0;
      for (; f3 < s6.length && (c5.lastIndex = f3, u5 = c5.exec(s6), null !== u5); ) f3 = c5.lastIndex, c5 === v ? "!--" === u5[1] ? c5 = _ : void 0 !== u5[1] ? c5 = m : void 0 !== u5[2] ? (y2.test(u5[2]) && (n5 = RegExp("</" + u5[2], "g")), c5 = p2) : void 0 !== u5[3] && (c5 = p2) : c5 === p2 ? ">" === u5[0] ? (c5 = n5 ?? v, d3 = -1) : void 0 === u5[1] ? d3 = -2 : (d3 = c5.lastIndex - u5[2].length, a3 = u5[1], c5 = void 0 === u5[3] ? p2 : '"' === u5[3] ? $ : g) : c5 === $ || c5 === g ? c5 = p2 : c5 === _ || c5 === m ? c5 = v : (c5 = p2, n5 = void 0);
      const x2 = c5 === p2 && t6[i8 + 1].startsWith("/>") ? " " : "";
      l3 += c5 === v ? s6 + r3 : d3 >= 0 ? (e7.push(a3), s6.slice(0, d3) + h2 + s6.slice(d3) + o3 + x2) : s6 + o3 + (-2 === d3 ? i8 : x2);
    }
    return [V(t6, l3 + (t6[s5] || "<?>") + (2 === i7 ? "</svg>" : 3 === i7 ? "</math>" : "")), e7];
  };
  var S2 = class _S {
    constructor({ strings: t6, _$litType$: i7 }, e7) {
      let r6;
      this.parts = [];
      let l3 = 0, a3 = 0;
      const u5 = t6.length - 1, d3 = this.parts, [f3, v3] = N(t6, i7);
      if (this.el = _S.createElement(f3, e7), P.currentNode = this.el.content, 2 === i7 || 3 === i7) {
        const t7 = this.el.content.firstChild;
        t7.replaceWith(...t7.childNodes);
      }
      for (; null !== (r6 = P.nextNode()) && d3.length < u5; ) {
        if (1 === r6.nodeType) {
          if (r6.hasAttributes()) for (const t7 of r6.getAttributeNames()) if (t7.endsWith(h2)) {
            const i8 = v3[a3++], s5 = r6.getAttribute(t7).split(o3), e8 = /([.?@])?(.*)/.exec(i8);
            d3.push({ type: 1, index: l3, name: e8[2], strings: s5, ctor: "." === e8[1] ? I : "?" === e8[1] ? L : "@" === e8[1] ? z : H }), r6.removeAttribute(t7);
          } else t7.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t7));
          if (y2.test(r6.tagName)) {
            const t7 = r6.textContent.split(o3), i8 = t7.length - 1;
            if (i8 > 0) {
              r6.textContent = s2 ? s2.emptyScript : "";
              for (let s5 = 0; s5 < i8; s5++) r6.append(t7[s5], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
              r6.append(t7[i8], c3());
            }
          }
        } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
        else {
          let t7 = -1;
          for (; -1 !== (t7 = r6.data.indexOf(o3, t7 + 1)); ) d3.push({ type: 7, index: l3 }), t7 += o3.length - 1;
        }
        l3++;
      }
    }
    static createElement(t6, i7) {
      const s5 = l2.createElement("template");
      return s5.innerHTML = t6, s5;
    }
  };
  function M(t6, i7, s5 = t6, e7) {
    if (i7 === E) return i7;
    let h4 = void 0 !== e7 ? s5._$Co?.[e7] : s5._$Cl;
    const o6 = a2(i7) ? void 0 : i7._$litDirective$;
    return h4?.constructor !== o6 && (h4?._$AO?.(false), void 0 === o6 ? h4 = void 0 : (h4 = new o6(t6), h4._$AT(t6, s5, e7)), void 0 !== e7 ? (s5._$Co ??= [])[e7] = h4 : s5._$Cl = h4), void 0 !== h4 && (i7 = M(t6, h4._$AS(t6, i7.values), h4, e7)), i7;
  }
  var R = class {
    constructor(t6, i7) {
      this._$AV = [], this._$AN = void 0, this._$AD = t6, this._$AM = i7;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t6) {
      const { el: { content: i7 }, parts: s5 } = this._$AD, e7 = (t6?.creationScope ?? l2).importNode(i7, true);
      P.currentNode = e7;
      let h4 = P.nextNode(), o6 = 0, n5 = 0, r6 = s5[0];
      for (; void 0 !== r6; ) {
        if (o6 === r6.index) {
          let i8;
          2 === r6.type ? i8 = new k(h4, h4.nextSibling, this, t6) : 1 === r6.type ? i8 = new r6.ctor(h4, r6.name, r6.strings, this, t6) : 6 === r6.type && (i8 = new Z(h4, this, t6)), this._$AV.push(i8), r6 = s5[++n5];
        }
        o6 !== r6?.index && (h4 = P.nextNode(), o6++);
      }
      return P.currentNode = l2, e7;
    }
    p(t6) {
      let i7 = 0;
      for (const s5 of this._$AV) void 0 !== s5 && (void 0 !== s5.strings ? (s5._$AI(t6, s5, i7), i7 += s5.strings.length - 2) : s5._$AI(t6[i7])), i7++;
    }
  };
  var k = class _k {
    get _$AU() {
      return this._$AM?._$AU ?? this._$Cv;
    }
    constructor(t6, i7, s5, e7) {
      this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t6, this._$AB = i7, this._$AM = s5, this.options = e7, this._$Cv = e7?.isConnected ?? true;
    }
    get parentNode() {
      let t6 = this._$AA.parentNode;
      const i7 = this._$AM;
      return void 0 !== i7 && 11 === t6?.nodeType && (t6 = i7.parentNode), t6;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t6, i7 = this) {
      t6 = M(this, t6, i7), a2(t6) ? t6 === A || null == t6 || "" === t6 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t6 !== this._$AH && t6 !== E && this._(t6) : void 0 !== t6._$litType$ ? this.$(t6) : void 0 !== t6.nodeType ? this.T(t6) : d2(t6) ? this.k(t6) : this._(t6);
    }
    O(t6) {
      return this._$AA.parentNode.insertBefore(t6, this._$AB);
    }
    T(t6) {
      this._$AH !== t6 && (this._$AR(), this._$AH = this.O(t6));
    }
    _(t6) {
      this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t6 : this.T(l2.createTextNode(t6)), this._$AH = t6;
    }
    $(t6) {
      const { values: i7, _$litType$: s5 } = t6, e7 = "number" == typeof s5 ? this._$AC(t6) : (void 0 === s5.el && (s5.el = S2.createElement(V(s5.h, s5.h[0]), this.options)), s5);
      if (this._$AH?._$AD === e7) this._$AH.p(i7);
      else {
        const t7 = new R(e7, this), s6 = t7.u(this.options);
        t7.p(i7), this.T(s6), this._$AH = t7;
      }
    }
    _$AC(t6) {
      let i7 = C.get(t6.strings);
      return void 0 === i7 && C.set(t6.strings, i7 = new S2(t6)), i7;
    }
    k(t6) {
      u2(this._$AH) || (this._$AH = [], this._$AR());
      const i7 = this._$AH;
      let s5, e7 = 0;
      for (const h4 of t6) e7 === i7.length ? i7.push(s5 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s5 = i7[e7], s5._$AI(h4), e7++;
      e7 < i7.length && (this._$AR(s5 && s5._$AB.nextSibling, e7), i7.length = e7);
    }
    _$AR(t6 = this._$AA.nextSibling, s5) {
      for (this._$AP?.(false, true, s5); t6 !== this._$AB; ) {
        const s6 = i3(t6).nextSibling;
        i3(t6).remove(), t6 = s6;
      }
    }
    setConnected(t6) {
      void 0 === this._$AM && (this._$Cv = t6, this._$AP?.(t6));
    }
  };
  var H = class {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t6, i7, s5, e7, h4) {
      this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t6, this.name = i7, this._$AM = e7, this.options = h4, s5.length > 2 || "" !== s5[0] || "" !== s5[1] ? (this._$AH = Array(s5.length - 1).fill(new String()), this.strings = s5) : this._$AH = A;
    }
    _$AI(t6, i7 = this, s5, e7) {
      const h4 = this.strings;
      let o6 = false;
      if (void 0 === h4) t6 = M(this, t6, i7, 0), o6 = !a2(t6) || t6 !== this._$AH && t6 !== E, o6 && (this._$AH = t6);
      else {
        const e8 = t6;
        let n5, r6;
        for (t6 = h4[0], n5 = 0; n5 < h4.length - 1; n5++) r6 = M(this, e8[s5 + n5], i7, n5), r6 === E && (r6 = this._$AH[n5]), o6 ||= !a2(r6) || r6 !== this._$AH[n5], r6 === A ? t6 = A : t6 !== A && (t6 += (r6 ?? "") + h4[n5 + 1]), this._$AH[n5] = r6;
      }
      o6 && !e7 && this.j(t6);
    }
    j(t6) {
      t6 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t6 ?? "");
    }
  };
  var I = class extends H {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t6) {
      this.element[this.name] = t6 === A ? void 0 : t6;
    }
  };
  var L = class extends H {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t6) {
      this.element.toggleAttribute(this.name, !!t6 && t6 !== A);
    }
  };
  var z = class extends H {
    constructor(t6, i7, s5, e7, h4) {
      super(t6, i7, s5, e7, h4), this.type = 5;
    }
    _$AI(t6, i7 = this) {
      if ((t6 = M(this, t6, i7, 0) ?? A) === E) return;
      const s5 = this._$AH, e7 = t6 === A && s5 !== A || t6.capture !== s5.capture || t6.once !== s5.once || t6.passive !== s5.passive, h4 = t6 !== A && (s5 === A || e7);
      e7 && this.element.removeEventListener(this.name, this, s5), h4 && this.element.addEventListener(this.name, this, t6), this._$AH = t6;
    }
    handleEvent(t6) {
      "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t6) : this._$AH.handleEvent(t6);
    }
  };
  var Z = class {
    constructor(t6, i7, s5) {
      this.element = t6, this.type = 6, this._$AN = void 0, this._$AM = i7, this.options = s5;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t6) {
      M(this, t6);
    }
  };
  var j = { M: h2, P: o3, A: n3, C: 1, L: N, R, D: d2, V: M, I: k, H, N: L, U: z, B: I, F: Z };
  var B = t2.litHtmlPolyfillSupport;
  B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.2");
  var D = (t6, i7, s5) => {
    const e7 = s5?.renderBefore ?? i7;
    let h4 = e7._$litPart$;
    if (void 0 === h4) {
      const t7 = s5?.renderBefore ?? null;
      e7._$litPart$ = h4 = new k(i7.insertBefore(c3(), t7), t7, void 0, s5 ?? {});
    }
    return h4._$AI(t6), h4;
  };

  // node_modules/lit-element/lit-element.js
  var s3 = globalThis;
  var i4 = class extends y {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
    }
    createRenderRoot() {
      const t6 = super.createRenderRoot();
      return this.renderOptions.renderBefore ??= t6.firstChild, t6;
    }
    update(t6) {
      const r6 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t6), this._$Do = D(r6, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      super.connectedCallback(), this._$Do?.setConnected(true);
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._$Do?.setConnected(false);
    }
    render() {
      return E;
    }
  };
  i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
  var o4 = s3.litElementPolyfillSupport;
  o4?.({ LitElement: i4 });
  (s3.litElementVersions ??= []).push("4.2.2");

  // node_modules/@lit/reactive-element/decorators/custom-element.js
  var t3 = (t6) => (e7, o6) => {
    void 0 !== o6 ? o6.addInitializer(() => {
      customElements.define(t6, e7);
    }) : customElements.define(t6, e7);
  };

  // node_modules/@lit/reactive-element/decorators/property.js
  var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
  var r4 = (t6 = o5, e7, r6) => {
    const { kind: n5, metadata: i7 } = r6;
    let s5 = globalThis.litPropertyMetadata.get(i7);
    if (void 0 === s5 && globalThis.litPropertyMetadata.set(i7, s5 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t6 = Object.create(t6)).wrapped = true), s5.set(r6.name, t6), "accessor" === n5) {
      const { name: o6 } = r6;
      return { set(r7) {
        const n6 = e7.get.call(this);
        e7.set.call(this, r7), this.requestUpdate(o6, n6, t6, true, r7);
      }, init(e8) {
        return void 0 !== e8 && this.C(o6, void 0, t6, e8), e8;
      } };
    }
    if ("setter" === n5) {
      const { name: o6 } = r6;
      return function(r7) {
        const n6 = this[o6];
        e7.call(this, r7), this.requestUpdate(o6, n6, t6, true, r7);
      };
    }
    throw Error("Unsupported decorator location: " + n5);
  };
  function n4(t6) {
    return (e7, o6) => "object" == typeof o6 ? r4(t6, e7, o6) : ((t7, e8, o7) => {
      const r6 = e8.hasOwnProperty(o7);
      return e8.constructor.createProperty(o7, t7), r6 ? Object.getOwnPropertyDescriptor(e8, o7) : void 0;
    })(t6, e7, o6);
  }

  // node_modules/@lit/reactive-element/decorators/state.js
  function r5(r6) {
    return n4({ ...r6, state: true, attribute: false });
  }

  // node_modules/@lit/reactive-element/decorators/base.js
  var e4 = (e7, t6, c5) => (c5.configurable = true, c5.enumerable = true, Reflect.decorate && "object" != typeof t6 && Object.defineProperty(e7, t6, c5), c5);

  // node_modules/@lit/reactive-element/decorators/query.js
  function e5(e7, r6) {
    return (n5, s5, i7) => {
      const o6 = (t6) => t6.renderRoot?.querySelector(e7) ?? null;
      if (r6) {
        const { get: e8, set: r7 } = "object" == typeof s5 ? n5 : i7 ?? /* @__PURE__ */ (() => {
          const t6 = /* @__PURE__ */ Symbol();
          return { get() {
            return this[t6];
          }, set(e9) {
            this[t6] = e9;
          } };
        })();
        return e4(n5, s5, { get() {
          let t6 = e8.call(this);
          return void 0 === t6 && (t6 = o6(this), (null !== t6 || this.hasUpdated) && r7.call(this, t6)), t6;
        } });
      }
      return e4(n5, s5, { get() {
        return o6(this);
      } });
    };
  }

  // frontend-devtools/ui/fd-toggle-icon-button.ts
  var CLOSE_ICON = w`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="width: 16px; height: 16px;"
  >
    <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
  </svg>
`;
  var FdToggleIconButton = class extends i4 {
    constructor() {
      super(...arguments);
      this.disabled = false;
      this.active = false;
      this.label = "";
      this.tooltip = "";
    }
    _handleClick(e7) {
      if (this.disabled) {
        e7.preventDefault();
        e7.stopPropagation();
        return;
      }
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { active: !this.active },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      const ariaLabel = this.label || this.tooltip || void 0;
      return b2`
      <button
        class="toggle-button"
        aria-label=${ariaLabel ?? ""}
        title=${this.tooltip}
        @click=${this._handleClick}
      >
        ${this.active ? CLOSE_ICON : b2`<slot></slot>`}
      </button>
    `;
    }
  };
  FdToggleIconButton.styles = i`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
    }

    :host([active]) .toggle-button {
      color: var(--fd-primary);
    }

    :host([active]) .toggle-button:hover {
      color: var(--fd-primary-hover);
    }

    .toggle-button {
      padding: 0;
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      box-shadow: none;
      cursor: pointer;
      color: var(--fd-text-muted);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-button:hover {
      color: var(--fd-text-primary);
      background: var(--fd-bg-hover);
    }

    /* ===== Focus states ===== */
    .toggle-button:focus {
      outline: none;
    }

    .toggle-button:focus-visible {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdToggleIconButton.prototype, "disabled", 2);
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdToggleIconButton.prototype, "active", 2);
  __decorateClass([
    n4({ type: String })
  ], FdToggleIconButton.prototype, "label", 2);
  __decorateClass([
    n4({ type: String })
  ], FdToggleIconButton.prototype, "tooltip", 2);
  FdToggleIconButton = __decorateClass([
    t3("fd-toggle-icon-button")
  ], FdToggleIconButton);

  // frontend-devtools/ui/fd-icon.ts
  var ICONS = {
    inspect: w`
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/>
    <path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h2"/>
    <path d="M14 3h1"/><path d="M3 9v1"/><path d="M21 9v2"/><path d="M3 14v1"/>
  `,
    close: w`
    <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
  `,
    domTree: w`
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
  `,
    settings: w`
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  `,
    laminarTree: w`
    <path d="M8 5h13"/>
    <path d="M13 12h8"/>
    <path d="M13 19h8"/>
    <path d="M3 10a2 2 0 0 0 2 2h3"/>
    <path d="M3 5v12a2 2 0 0 0 2 2h3"/>
  `,
    refresh: w`
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  `
  };
  var FdIcon = class extends i4 {
    constructor() {
      super(...arguments);
      this.name = "inspect";
      this.size = 16;
    }
    render() {
      const iconContent = ICONS[this.name];
      if (!iconContent) {
        return A;
      }
      return b2`
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="width: ${this.size}px; height: ${this.size}px;"
        part="svg"
      >
        ${iconContent}
      </svg>
    `;
    }
  };
  FdIcon.styles = i`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      line-height: 0;
    }

    svg {
      display: block;
    }
  `;
  __decorateClass([
    n4({ type: String, reflect: true })
  ], FdIcon.prototype, "name", 2);
  __decorateClass([
    n4({ type: Number })
  ], FdIcon.prototype, "size", 2);
  FdIcon = __decorateClass([
    t3("fd-icon")
  ], FdIcon);

  // frontend-devtools/ui/fd-inspect.ts
  var FdInspect = class extends i4 {
    constructor() {
      super(...arguments);
      this.active = false;
    }
    _handleChange(e7) {
      this.active = e7.detail.active;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { active: this.active },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b2`
      <fd-toggle-icon-button
        tooltip="Inspect Component (Ctrl+Shift+C)"
        ?active=${this.active}
        @change=${this._handleChange}
      >
        <fd-icon name="inspect"></fd-icon>
      </fd-toggle-icon-button>
    `;
    }
  };
  FdInspect.styles = i`
    :host {
      display: inline-flex;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdInspect.prototype, "active", 2);
  FdInspect = __decorateClass([
    t3("fd-inspect")
  ], FdInspect);

  // frontend-devtools/ui/fd-dom-stats.ts
  var FdDomStats = class extends i4 {
    constructor() {
      super(...arguments);
      this._tagCounts = [];
      this._interval = 1e3;
      this._updateIntervalId = null;
    }
    connectedCallback() {
      super.connectedCallback();
      this._calculateDomStats();
      this._startUpdateInterval();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._stopUpdateInterval();
    }
    _startUpdateInterval() {
      this._updateIntervalId = setInterval(() => {
        this._calculateDomStats();
      }, this._interval);
    }
    _stopUpdateInterval() {
      if (this._updateIntervalId) {
        clearInterval(this._updateIntervalId);
        this._updateIntervalId = null;
      }
    }
    _calculateDomStats() {
      const tagMap = /* @__PURE__ */ new Map();
      document.querySelectorAll("*").forEach((el) => {
        const tagName = el.tagName.toLowerCase();
        tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
      });
      this._tagCounts = Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count })).sort((a3, b3) => b3.count - a3.count);
    }
    get _maxCount() {
      return this._tagCounts[0]?.count || 1;
    }
    _getBarWidth(count) {
      return count / this._maxCount * 100;
    }
    render() {
      return b2`
      <div class="dom-stats-container">
        ${this._tagCounts.map(
        (item) => b2`
            <div class="dom-stats-row">
              <div class="bar" style="width: ${this._getBarWidth(item.count)}%"></div>
              <span class="tag-name">${item.tag}</span>
              <span class="tag-count">${item.count}</span>
            </div>
          `
      )}
      </div>
    `;
    }
  };
  FdDomStats.styles = i`
    :host {
      display: block;
      max-height: 196px;
      overflow-y: auto;
      border-radius: 8px;
    }

    .dom-stats-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: var(--fd-bg-elevated);

      padding: 8px;
      color: var(--fd-text-secondary);
      max-height: 100%;
      overflow-y: auto;
      box-shadow: var(--fd-shadow-panel);
    }

    .dom-stats-row {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.4;
    }

    .bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--fd-info-bg);
      border-radius: 4px;
      pointer-events: none;
      transition: width 300ms ease-out;
    }

    .dom-stats-row:hover .bar {
      background: var(--fd-info-bg-hover);
    }

    .tag-name {
      position: relative;
      color: var(--fd-info);
      font-weight: 500;
      flex: 1;
    }

    .tag-count {
      position: relative;
      color: var(--fd-success);
      font-weight: 600;
      min-width: 40px;
      text-align: right;
    }
  `;
  __decorateClass([
    r5()
  ], FdDomStats.prototype, "_tagCounts", 2);
  FdDomStats = __decorateClass([
    t3("fd-dom-stats")
  ], FdDomStats);

  // frontend-devtools/ui/fd-toolbar.ts
  var FdToolbar = class extends i4 {
    constructor() {
      super(...arguments);
      this.collapsed = false;
      this.orientation = "horizontal";
    }
    render() {
      return b2`<slot></slot>`;
    }
  };
  FdToolbar.styles = i`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--fd-bg-solid);
      border-radius: 8px;
      box-shadow: var(--fd-shadow-panel);
    }

    :host([orientation='vertical']) {
      flex-direction: column;
    }

    :host([collapsed]) {
      padding: 4px;
      gap: 4px;
      opacity: 0.75;
      transition: opacity 0.15s;
    }

    :host([collapsed]:hover) {
      opacity: 1;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdToolbar.prototype, "collapsed", 2);
  __decorateClass([
    n4({ type: String, reflect: true })
  ], FdToolbar.prototype, "orientation", 2);
  FdToolbar = __decorateClass([
    t3("fd-toolbar")
  ], FdToolbar);

  // frontend-devtools/core/config.ts
  var DRAG_CONFIG = {
    thresholds: {
      dragStart: 5,
      // Pixels to move before drag initiates
      snapDistance: 60,
      // If moved less than this, return to original corner
      directionThreshold: 40
      // Threshold for determining drag direction
    },
    animation: {
      snapTransitionMs: 300
    },
    dimensions: {
      safeArea: 16
      // Padding from viewport edges
    }
  };

  // frontend-devtools/core/utils.ts
  function calculatePositionForCorner(corner, width, height) {
    const safeArea = DRAG_CONFIG.dimensions.safeArea;
    const rightX = window.innerWidth - width - safeArea;
    const bottomY = window.innerHeight - height - safeArea;
    switch (corner) {
      case "top-left":
        return { x: safeArea, y: safeArea };
      case "top-right":
        return { x: rightX, y: safeArea };
      case "bottom-left":
        return { x: safeArea, y: bottomY };
      case "bottom-right":
      default:
        return { x: rightX, y: bottomY };
    }
  }
  function getBestCorner(mouseX, mouseY, initialMouseX, initialMouseY) {
    const deltaX = mouseX - initialMouseX;
    const deltaY = mouseY - initialMouseY;
    const threshold = DRAG_CONFIG.thresholds.directionThreshold;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const movingRight = deltaX > threshold;
    const movingLeft = deltaX < -threshold;
    const movingDown = deltaY > threshold;
    const movingUp = deltaY < -threshold;
    if (movingRight || movingLeft) {
      const isBottom = mouseY > centerY;
      return movingRight ? isBottom ? "bottom-right" : "top-right" : isBottom ? "bottom-left" : "top-left";
    }
    if (movingDown || movingUp) {
      const isRight = mouseX > centerX;
      return movingDown ? isRight ? "bottom-right" : "bottom-left" : isRight ? "top-right" : "top-left";
    }
    return mouseX > centerX ? mouseY > centerY ? "bottom-right" : "top-right" : mouseY > centerY ? "bottom-left" : "top-left";
  }

  // frontend-devtools/ui/fd-panel.ts
  var FdPanel = class extends i4 {
    constructor() {
      super(...arguments);
      this.position = "top-right";
      this._panelSize = {
        width: 0,
        height: 0
      };
      // Transform-based position (GPU accelerated)
      this._transformPos = { x: 0, y: 0 };
      this._transitionTimeoutId = null;
      this._panelResizeObserver = null;
      // Drag state tracking for cleanup
      this._dragRafId = null;
      this._dragPointerId = null;
      this._dragMoveHandler = null;
      this._dragEndHandler = null;
      this._handleWindowResize = () => {
        this._updateTransformFromCorner();
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this.addEventListener("pointerdown", this._handlePointerDown);
      window.addEventListener("resize", this._handleWindowResize);
      this._panelResizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        this._handlePanelResize(entry);
      });
      this._panelResizeObserver.observe(this);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener("pointerdown", this._handlePointerDown);
      window.removeEventListener("resize", this._handleWindowResize);
      if (this._transitionTimeoutId) {
        clearTimeout(this._transitionTimeoutId);
        this._transitionTimeoutId = null;
      }
      if (this._panelResizeObserver) {
        this._panelResizeObserver.disconnect();
        this._panelResizeObserver = null;
      }
      this._cleanupDrag();
    }
    _cleanupDrag() {
      if (this._dragRafId) {
        cancelAnimationFrame(this._dragRafId);
        this._dragRafId = null;
      }
      if (this._dragMoveHandler) {
        document.removeEventListener("pointermove", this._dragMoveHandler);
        this._dragMoveHandler = null;
      }
      if (this._dragEndHandler) {
        document.removeEventListener("pointerup", this._dragEndHandler);
        document.removeEventListener("pointercancel", this._dragEndHandler);
        this._dragEndHandler = null;
      }
      if (this._dragPointerId !== null && this.hasPointerCapture(this._dragPointerId)) {
        this.releasePointerCapture(this._dragPointerId);
      }
      this._dragPointerId = null;
      this.removeAttribute("dragging");
    }
    _handlePanelResize(entry) {
      const borderBoxSize = entry.borderBoxSize[0];
      if (borderBoxSize) {
        this._panelSize = {
          width: borderBoxSize.inlineSize,
          height: borderBoxSize.blockSize
        };
      }
      this._updateTransformFromCorner();
    }
    _updateTransformFromCorner() {
      this._transformPos = calculatePositionForCorner(this.position, this._panelSize.width, this._panelSize.height);
      this._applyTransform(false);
    }
    _handlePointerDown(e7) {
      const target = e7.target;
      if (target.closest("fd-toolbar")) {
        return;
      }
      e7.preventDefault();
      this._cleanupDrag();
      const initialMouseX = e7.clientX;
      const initialMouseY = e7.clientY;
      const initialX = this._transformPos.x;
      const initialY = this._transformPos.y;
      let currentX = initialX;
      let currentY = initialY;
      let lastMouseX = initialMouseX;
      let lastMouseY = initialMouseY;
      let hasMoved = false;
      this.setPointerCapture(e7.pointerId);
      this._dragPointerId = e7.pointerId;
      const handlePointerMove = (moveEvent) => {
        lastMouseX = moveEvent.clientX;
        lastMouseY = moveEvent.clientY;
        if (this._dragRafId) return;
        this._dragRafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX;
          const deltaY = lastMouseY - initialMouseY;
          if (!hasMoved && (Math.abs(deltaX) > DRAG_CONFIG.thresholds.dragStart || Math.abs(deltaY) > DRAG_CONFIG.thresholds.dragStart)) {
            hasMoved = true;
            this.setAttribute("dragging", "");
            this.dispatchEvent(new CustomEvent("drag-start", { bubbles: true, composed: true }));
          }
          if (hasMoved) {
            currentX = initialX + deltaX;
            currentY = initialY + deltaY;
            this.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          }
          this._dragRafId = null;
        });
      };
      const handlePointerEnd = () => {
        this._dragMoveHandler = null;
        this._dragEndHandler = null;
        if (this._dragPointerId !== null && this.hasPointerCapture(this._dragPointerId)) {
          this.releasePointerCapture(this._dragPointerId);
        }
        this._dragPointerId = null;
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);
        document.removeEventListener("pointercancel", handlePointerEnd);
        if (this._dragRafId) {
          cancelAnimationFrame(this._dragRafId);
          this._dragRafId = null;
        }
        this.removeAttribute("dragging");
        this.dispatchEvent(new CustomEvent("drag-end", { bubbles: true, composed: true }));
        if (!hasMoved) return;
        const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
        const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
        const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
        if (totalMovement < DRAG_CONFIG.thresholds.snapDistance) {
          this._transformPos = calculatePositionForCorner(this.position, this.offsetWidth, this.offsetHeight);
          this._applyTransform(true);
          return;
        }
        const newCorner = getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY);
        const oldPosition = this.position;
        this.position = newCorner;
        this._transformPos = calculatePositionForCorner(newCorner, this.offsetWidth, this.offsetHeight);
        this._applyTransform(true);
        if (oldPosition !== newCorner) {
          this.dispatchEvent(
            new CustomEvent("position-change", {
              detail: { position: newCorner, previousPosition: oldPosition },
              bubbles: true,
              composed: true
            })
          );
        }
      };
      this._dragMoveHandler = handlePointerMove;
      this._dragEndHandler = handlePointerEnd;
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerEnd);
      document.addEventListener("pointercancel", handlePointerEnd);
    }
    _applyTransform(animate) {
      if (animate) {
        if (this._transitionTimeoutId) {
          clearTimeout(this._transitionTimeoutId);
        }
        this.style.transition = `transform ${DRAG_CONFIG.animation.snapTransitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        requestAnimationFrame(() => {
          this.style.transform = `translate3d(${this._transformPos.x}px, ${this._transformPos.y}px, 0)`;
        });
        this._transitionTimeoutId = setTimeout(() => {
          this.style.transition = "none";
          this._transitionTimeoutId = null;
        }, DRAG_CONFIG.animation.snapTransitionMs + 50);
      } else {
        this.style.transition = "none";
        this.style.transform = `translate3d(${this._transformPos.x}px, ${this._transformPos.y}px, 0)`;
      }
    }
    render() {
      return b2`<slot></slot>`;
    }
  };
  FdPanel.styles = i`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 9999;
      will-change: transform;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
    }

    /* Reverse flex direction for bottom positions */
    :host([position="bottom-left"]),
    :host([position="bottom-right"]) {
      flex-direction: column-reverse;
    }

    :host([dragging]) {
      cursor: grabbing;
    }

    :host {
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
  `;
  __decorateClass([
    n4({ type: String, reflect: true })
  ], FdPanel.prototype, "position", 2);
  FdPanel = __decorateClass([
    t3("fd-panel")
  ], FdPanel);

  // frontend-devtools/core/performance-color.ts
  var COLOR_CONFIG = {
    /** Maximum hue value (green in HSL) */
    maxHue: 120,
    /** Maximum frame time considered (1 second = red) */
    maxMs: 1e3,
    /** Logarithmic factor - baseline for "perfect" frame time (~10ms = 100 FPS) */
    logFactor: 10,
    /** Saturation for HSL color */
    saturation: 80,
    /** Lightness for HSL color */
    lightness: 40
  };
  var LOG_MULTIPLIER = COLOR_CONFIG.maxHue / Math.log(COLOR_CONFIG.maxMs / COLOR_CONFIG.logFactor);
  function calcHueFromFrameTime(frameTimeMs) {
    if (frameTimeMs <= 0) return COLOR_CONFIG.maxHue;
    const logValue = Math.log(frameTimeMs / COLOR_CONFIG.logFactor);
    const scaledValue = LOG_MULTIPLIER * logValue;
    const clampedValue = Math.max(0, Math.min(scaledValue, COLOR_CONFIG.maxHue));
    return COLOR_CONFIG.maxHue - clampedValue;
  }
  function calcHueFromFps(fps) {
    if (fps <= 0) return 0;
    const frameTimeMs = 1e3 / fps;
    return calcHueFromFrameTime(frameTimeMs);
  }
  function getColorFromFrameTime(frameTimeMs) {
    const hue = calcHueFromFrameTime(frameTimeMs);
    return `hsl(${hue}, ${COLOR_CONFIG.saturation}%, ${COLOR_CONFIG.lightness}%)`;
  }
  function getColorFromFps(fps) {
    const hue = calcHueFromFps(fps);
    return `hsl(${hue}, ${COLOR_CONFIG.saturation}%, ${COLOR_CONFIG.lightness}%)`;
  }

  // frontend-devtools/ui/fd-fps.ts
  var FdFps = class extends i4 {
    constructor() {
      super(...arguments);
      this.active = false;
      this._fps = 0;
      this._frameCount = 0;
      this._lastTime = 0;
      this._animationId = null;
      this._displayFps = 0;
    }
    _handleClick() {
      this.active = !this.active;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { active: this.active },
          bubbles: true,
          composed: true
        })
      );
    }
    connectedCallback() {
      super.connectedCallback();
      this._start();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._stop();
    }
    _start() {
      this._lastTime = performance.now();
      this._frameCount = 0;
      this._tick();
    }
    _stop() {
      if (this._animationId) {
        cancelAnimationFrame(this._animationId);
        this._animationId = null;
      }
    }
    _tick() {
      this._frameCount++;
      const now = performance.now();
      if (now - this._lastTime >= 1e3) {
        this._fps = this._frameCount;
        this._frameCount = 0;
        this._lastTime = now;
        this._displayFps = this._fps;
      }
      this._animationId = requestAnimationFrame(() => this._tick());
    }
    render() {
      const color = getColorFromFps(this._displayFps);
      return b2`
      <button class="devtools-meter" title="Show Lag Radar" @click=${this._handleClick}>
        <span class="devtools-meter-value" style="color: ${color}">${this._displayFps}</span>
        <span class="devtools-meter-label">FPS</span>
      </button>
    `;
    }
  };
  FdFps.styles = i`
    .devtools-meter {
      appearance: none;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 8px;
      white-space: nowrap;
      font-family: var(--fd-font-mono);
      background: var(--fd-bg-panel);
      box-shadow: var(--fd-inset-border-subtle);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .devtools-meter:hover {
      background: var(--fd-bg-elevated);
      box-shadow: var(--fd-inset-border-medium);
    }

    .devtools-meter-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
      color: var(--fd-text-primary);
      font-family: var(--fd-font-mono);
    }

    .devtools-meter-value.memory {
      min-width: 38px;
      text-align: center;
    }

    .devtools-meter-label {
      color: var(--fd-text-faint);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
      white-space: nowrap;
      transition: color 0.15s ease-in-out;
    }

    :host([active]) .devtools-meter {
      box-shadow: var(--fd-inset-border-primary);
    }

    /* ===== Focus states ===== */
    .devtools-meter:focus {
      outline: none;
    }

    .devtools-meter:focus-visible {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdFps.prototype, "active", 2);
  __decorateClass([
    r5()
  ], FdFps.prototype, "_displayFps", 2);
  FdFps = __decorateClass([
    t3("fd-fps")
  ], FdFps);

  // frontend-devtools/core/fd-mem-observer.ts
  var SAMPLE_INTERVAL = 1e3;
  var FdMemObserverImpl = class {
    constructor() {
      this._listeners = /* @__PURE__ */ new Set();
      this._intervalId = null;
      this._lastInfo = { usedMB: 0, totalMB: 0, limitMB: 0 };
    }
    /**
     * Check if the memory API is supported in the current browser.
     */
    static isSupported() {
      const perf = performance;
      return !!(perf.memory && typeof perf.memory.usedJSHeapSize === "number");
    }
    /**
     * Subscribe to memory updates.
     * Returns an unsubscribe function.
     */
    subscribe(listener) {
      this._listeners.add(listener);
      if (this._listeners.size === 1) {
        this._startSampling();
      }
      listener(this._lastInfo);
      return () => {
        this._listeners.delete(listener);
        if (this._listeners.size === 0) {
          this._stopSampling();
        }
      };
    }
    /**
     * Get the current memory info without subscribing.
     */
    getCurrentInfo() {
      return this._lastInfo;
    }
    _startSampling() {
      if (this._intervalId !== null) return;
      this._sampleMemory();
      this._intervalId = window.setInterval(() => {
        this._sampleMemory();
      }, SAMPLE_INTERVAL);
    }
    _stopSampling() {
      if (this._intervalId !== null) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    }
    _sampleMemory() {
      const perf = performance;
      if (!perf.memory) {
        return;
      }
      const bytesToMB = (bytes) => Math.floor(bytes / (1024 * 1024));
      this._lastInfo = {
        usedMB: bytesToMB(perf.memory.usedJSHeapSize),
        totalMB: bytesToMB(perf.memory.totalJSHeapSize),
        limitMB: bytesToMB(perf.memory.jsHeapSizeLimit)
      };
      for (const listener of this._listeners) {
        listener(this._lastInfo);
      }
    }
  };
  var FdMemObserver = new FdMemObserverImpl();

  // frontend-devtools/ui/fd-mem.ts
  var FdMem = class extends i4 {
    constructor() {
      super(...arguments);
      this.active = false;
      this._memoryMB = 0;
      this._unsubscribe = null;
    }
    connectedCallback() {
      super.connectedCallback();
      this._unsubscribe = FdMemObserver.subscribe((info) => {
        this._memoryMB = info.usedMB;
      });
    }
    disconnectedCallback() {
      this._unsubscribe?.();
      this._unsubscribe = null;
      super.disconnectedCallback();
    }
    _handleClick() {
      this.active = !this.active;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { active: this.active },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b2`
      <button class="devtools-meter" title="Show Memory Chart" @click=${this._handleClick}>
        <span class="devtools-meter-value memory">${this._memoryMB}</span>
        <span class="devtools-meter-label">MB</span>
      </button>
    `;
    }
  };
  FdMem.styles = i`
    .devtools-meter {
      appearance: none;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 8px;
      white-space: nowrap;
      font-family: var(--fd-font-mono);
      background: var(--fd-bg-panel);
      box-shadow: var(--fd-inset-border-subtle);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .devtools-meter:hover {
      background: var(--fd-bg-elevated);
      box-shadow: var(--fd-inset-border-medium);
    }

    .devtools-meter-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
      color: var(--fd-primary);
      font-family: var(--fd-font-mono);
    }

    .devtools-meter-value.memory {
      min-width: 38px;
      text-align: center;
    }

    .devtools-meter-label {
      color: var(--fd-text-faint);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
      white-space: nowrap;
      transition: color 0.15s ease-in-out;
    }

    :host([active]) .devtools-meter {
      box-shadow: var(--fd-inset-border-primary);
    }

    /* ===== Focus states ===== */
    .devtools-meter:focus {
      outline: none;
    }

    .devtools-meter:focus-visible {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdMem.prototype, "active", 2);
  __decorateClass([
    r5()
  ], FdMem.prototype, "_memoryMB", 2);
  FdMem = __decorateClass([
    t3("fd-mem")
  ], FdMem);

  // frontend-devtools/ui/fd-lag-radar.ts
  var FdLagRadar = class extends i4 {
    constructor() {
      super(...arguments);
      this.size = 220;
      this.frames = 50;
      this.speed = 17e-4;
      this.inset = 3;
      // Not @state() since it's not used in render() - avoids "change in update" warning
      this._running = false;
      this._animationId = null;
      this._last = null;
      this._framePtr = 0;
      this._arcs = [];
      this._hand = null;
    }
    get _middle() {
      return this.size / 2;
    }
    get _radius() {
      return this._middle - this.inset;
    }
    connectedCallback() {
      super.connectedCallback();
    }
    disconnectedCallback() {
      this.stop();
      super.disconnectedCallback();
    }
    firstUpdated(_changedProperties) {
      super.firstUpdated(_changedProperties);
      this._initializeArcs();
      this.start();
    }
    _initializeArcs() {
      const svg = this.shadowRoot?.querySelector(".radar-sweep");
      const hand = this.shadowRoot?.querySelector(".radar-hand");
      if (!svg || !hand) return;
      this._hand = hand;
      this._arcs = [];
      for (let i7 = 0; i7 < this.frames; i7++) {
        const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svg.appendChild(arc);
        this._arcs.push(arc);
      }
    }
    /** Start the radar animation */
    start() {
      if (this._running) return;
      this._running = true;
      this._last = {
        rotation: 0,
        now: Date.now(),
        tx: this._middle + this._radius,
        ty: this._middle
      };
      this._framePtr = 0;
      this._animate();
    }
    /** Stop the radar animation */
    stop() {
      this._running = false;
      if (this._animationId) {
        cancelAnimationFrame(this._animationId);
        this._animationId = null;
      }
    }
    _animate() {
      if (!this._running || !this._last) return;
      const PI2 = Math.PI * 2;
      const middle = this._middle;
      const radius = this._radius;
      const frames = this.frames;
      const now = Date.now();
      const frameTimeMs = now - this._last.now;
      const rdelta = Math.min(PI2 - this.speed, this.speed * frameTimeMs);
      const rotation = (this._last.rotation + rdelta) % PI2;
      const tx = middle + radius * Math.cos(rotation);
      const ty = middle + radius * Math.sin(rotation);
      const bigArc = rdelta < Math.PI ? "0" : "1";
      const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${this._last.tx} ${this._last.ty}L${middle} ${middle}`;
      const color = getColorFromFrameTime(frameTimeMs);
      const currentArc = this._arcs[this._framePtr % frames];
      if (currentArc) {
        currentArc.setAttribute("d", path);
        currentArc.setAttribute("fill", color);
      }
      if (this._hand) {
        this._hand.setAttribute("d", `M${middle} ${middle}L${tx} ${ty}`);
      }
      for (let i7 = 0; i7 < frames; i7++) {
        const arc = this._arcs[(frames + this._framePtr - i7) % frames];
        if (arc) {
          arc.style.fillOpacity = String(1 - i7 / frames);
        }
      }
      this._framePtr++;
      this._last = { now, rotation, tx, ty };
      this._animationId = requestAnimationFrame(() => this._animate());
    }
    render() {
      return b2`
      <div class="radar-container">
        <svg
          class="radar-svg"
          width="${this.size}"
          height="${this.size}"
          viewBox="0 0 ${this.size} ${this.size}"
        >
          <g class="radar-sweep"></g>
          <path class="radar-hand"></path>
          <circle
            class="radar-face"
            cx="${this._middle}"
            cy="${this._middle}"
            r="${this._radius}"
          ></circle>
        </svg>
      </div>
    `;
    }
  };
  FdLagRadar.styles = i`
    :host {
      display: block;
      font-family: var(--fd-font);
    }

    .radar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 26px 12px;
      background: var(--fd-bg-panel);
      border-radius: 8px;
      box-shadow: var(--fd-inset-border-subtle);
    }

    .radar-svg {
      display: block;
    }

    .radar-sweep > * {
      shape-rendering: crispEdges;
    }

    .radar-face {
      fill: transparent;
      stroke: var(--fd-radar-stroke);
      stroke-width: 4px;
    }

    .radar-hand {
      stroke: var(--fd-radar-stroke);
      stroke-width: 4px;
      stroke-linecap: round;
    }
  `;
  __decorateClass([
    n4({ type: Number })
  ], FdLagRadar.prototype, "size", 2);
  __decorateClass([
    n4({ type: Number })
  ], FdLagRadar.prototype, "frames", 2);
  __decorateClass([
    n4({ type: Number })
  ], FdLagRadar.prototype, "speed", 2);
  __decorateClass([
    n4({ type: Number })
  ], FdLagRadar.prototype, "inset", 2);
  FdLagRadar = __decorateClass([
    t3("fd-lag-radar")
  ], FdLagRadar);

  // frontend-devtools/ui/fd-mem-chart.ts
  var MAX_POINTS = 120;
  var Y_AXIS_WIDTH = 48;
  var CHART_PADDING = 2;
  var CHART_TOP_MARGIN = 10;
  var FdMemChart = class extends i4 {
    constructor() {
      super(...arguments);
      this.active = false;
      this.height = 184;
      this._dataPoints = [];
      this._width = 200;
      this._unsubscribe = null;
      this._resizeObserver = null;
    }
    connectedCallback() {
      super.connectedCallback();
      this._initializeData();
      this._unsubscribe = FdMemObserver.subscribe((info) => {
        this._handleMemoryUpdate(info);
      });
      this._setupResizeObserver();
    }
    disconnectedCallback() {
      this._unsubscribe?.();
      this._unsubscribe = null;
      this._cleanupResizeObserver();
      super.disconnectedCallback();
    }
    _setupResizeObserver() {
      this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const borderBoxSize = entry.borderBoxSize[0];
          if (borderBoxSize) {
            const width = borderBoxSize.inlineSize;
            this._width = width - 16;
          }
        }
      });
      this._resizeObserver.observe(this);
    }
    _cleanupResizeObserver() {
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
    }
    _initializeData() {
      this._dataPoints = Array.from({ length: MAX_POINTS }, () => 0);
    }
    _handleMemoryUpdate(info) {
      const newData = [...this._dataPoints.slice(1), info.usedMB];
      this._dataPoints = newData;
    }
    _getMinMax() {
      const validPoints = this._dataPoints.filter((v3) => v3 > 0);
      if (validPoints.length === 0) return { min: 0, max: 100 };
      const min = Math.min(...validPoints) * 0.9;
      const max = Math.max(...validPoints) * 1.1;
      return { min, max };
    }
    _getChartDimensions() {
      const chartLeft = Y_AXIS_WIDTH;
      const chartTop = CHART_TOP_MARGIN;
      const chartWidth = this._width - chartLeft - CHART_PADDING;
      const chartHeight = this.height - chartTop - CHART_PADDING;
      return { chartWidth, chartHeight, chartLeft, chartTop };
    }
    _getPathData() {
      const data = this._dataPoints;
      if (data.length === 0) return "";
      const { chartWidth, chartHeight, chartLeft, chartTop } = this._getChartDimensions();
      const { min, max } = this._getMinMax();
      const range = max - min || 1;
      const points = data.map((value, index) => {
        const x2 = chartLeft + index / (MAX_POINTS - 1) * chartWidth;
        const y3 = value === 0 ? chartTop + chartHeight : chartTop + chartHeight - (value - min) / range * chartHeight;
        return { x: x2, y: y3 };
      });
      if (points.length === 0) return "";
      const firstPoint = points[0];
      let path = `M ${firstPoint.x} ${firstPoint.y}`;
      for (let i7 = 1; i7 < points.length; i7++) {
        const point = points[i7];
        path += ` L ${point.x} ${point.y}`;
      }
      return path;
    }
    _getAreaPath() {
      const linePath = this._getPathData();
      if (!linePath) return "";
      const { chartWidth, chartHeight, chartLeft, chartTop } = this._getChartDimensions();
      const bottom = chartTop + chartHeight;
      return `${linePath} L ${chartLeft + chartWidth} ${bottom} L ${chartLeft} ${bottom} Z`;
    }
    _formatMB(value) {
      if (value >= 1e4) {
        return `${(value / 1e3).toFixed(1)}G`;
      }
      return `${Math.round(value)}`;
    }
    render() {
      const { min, max } = this._getMinMax();
      const { chartLeft, chartTop, chartHeight } = this._getChartDimensions();
      const mid = (min + max) / 2;
      const bottom = chartTop + chartHeight;
      const middle = chartTop + chartHeight / 2;
      return b2`
      <div class="chart-container">
        <svg
          class="chart-svg"
          width="${this._width}"
          height="${this.height}"
          viewBox="0 0 ${this._width} ${this.height}"
        >
          <!-- Y-axis labels -->
          <text class="axis-label" x="${chartLeft - 4}" y="${chartTop + 4}" text-anchor="end">
            ${this._formatMB(max)}
          </text>
          <text class="axis-label" x="${chartLeft - 4}" y="${middle + 3}" text-anchor="end">
            ${this._formatMB(mid)}
          </text>
          <text class="axis-label" x="${chartLeft - 4}" y="${bottom}" text-anchor="end">
            ${this._formatMB(min)}
          </text>

          <!-- Grid lines -->
          <line
            class="grid-line"
            x1="${chartLeft}"
            y1="${chartTop}"
            x2="${this._width - CHART_PADDING}"
            y2="${chartTop}"
          />
          <line
            class="grid-line"
            x1="${chartLeft}"
            y1="${middle}"
            x2="${this._width - CHART_PADDING}"
            y2="${middle}"
          />
          <line
            class="grid-line"
            x1="${chartLeft}"
            y1="${bottom}"
            x2="${this._width - CHART_PADDING}"
            y2="${bottom}"
          />

          <!-- Y-axis line -->
          <line
            class="axis-line"
            x1="${chartLeft}"
            y1="${chartTop}"
            x2="${chartLeft}"
            y2="${bottom}"
          />

          <!-- Area fill -->
          <path class="chart-area" d="${this._getAreaPath()}" />
          <!-- Line -->
          <path class="chart-line" d="${this._getPathData()}" />
        </svg>
      </div>
    `;
    }
  };
  FdMemChart.styles = i`
    :host {
      display: block;
      width: 100%;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: var(--fd-bg-panel);
      border-radius: 8px;
      box-shadow: var(--fd-inset-border-subtle);
      width: 100%;
      box-sizing: border-box;
    }

    .chart-svg {
      display: block;
    }

    .grid-line {
      stroke: var(--fd-chart-grid);
      stroke-width: 1;
      stroke-dasharray: 2 2;
    }

    .axis-line {
      stroke: var(--fd-chart-grid-major);
      stroke-width: 1;
    }

    .axis-label {
      font-family: var(--fd-font-mono);
      font-size: 9px;
      fill: var(--fd-chart-label);
    }

    .chart-area {
      fill: var(--fd-chart-fill);
    }

    .chart-line {
      fill: none;
      stroke: var(--fd-chart-stroke);
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdMemChart.prototype, "active", 2);
  __decorateClass([
    n4({ type: Number })
  ], FdMemChart.prototype, "height", 2);
  __decorateClass([
    r5()
  ], FdMemChart.prototype, "_dataPoints", 2);
  __decorateClass([
    r5()
  ], FdMemChart.prototype, "_width", 2);
  FdMemChart = __decorateClass([
    t3("fd-mem-chart")
  ], FdMemChart);

  // frontend-devtools/core/utilities.ts
  var CONFIG = {
    colors: {
      // Primary purple: rgb(142, 97, 227)
      primary: { r: 142, g: 97, b: 227 },
      inspectStroke: "rgba(142, 97, 227, 0.5)",
      inspectFill: "rgba(142, 97, 227, 0.10)",
      inspectPillBg: "rgba(37, 37, 38, 0.80)",
      inspectPillText: "white",
      inspectMarkedStroke: "rgba(79, 192, 255, 0.6)",
      inspectMarkedFill: "rgba(79, 192, 255, 0.10)",
      inspectMarkedPillBg: "rgba(20, 60, 80, 0.85)",
      inspectMarkedPillText: "#79c0ff",
      inspectReactStroke: "rgba(97, 218, 251, 0.6)",
      inspectReactFill: "rgba(97, 218, 251, 0.10)",
      inspectReactPillBg: "rgba(20, 44, 52, 0.90)",
      inspectReactPillText: "#61dafb",
      inspectCrosshair: "rgba(142, 97, 227, 0.4)"
    },
    animation: {
      totalFrames: 45,
      highlightDurationMs: 750,
      interpolationSpeed: 0.51,
      snapTransitionMs: 300,
      tooltipFadeMs: 200,
      tooltipSlideMs: 120
    },
    dimensions: {
      toolbarWidth: 284,
      tooltipMinHeight: 92,
      safeArea: 16,
      collapsedHorizontal: { width: 20, height: 48 },
      collapsedVertical: { width: 48, height: 20 },
      radarSize: 220
    },
    thresholds: {
      dragStart: 5,
      snapDistance: 60,
      collapseRatio: 0.5,
      expandDragDistance: 50,
      fpsWarning: 50,
      fpsCritical: 30,
      memoryWarning: 60,
      memoryCritical: 80
    },
    intervals: {
      fpsDisplay: 200,
      memoryDisplay: 1e3,
      resizeDebounce: 100,
      tooltipShowDelay: 400,
      tooltipHideDelay: 200
    },
    attributes: {
      scalaComponent: "data-scala",
      devtools: "data-frontend-devtools"
    },
    properties: {
      sourcePath: "__scalasourcepath",
      sourceLine: "__scalasourceline",
      filename: "__scalafilename",
      name: "__scalaname",
      markAsComponent: "__markascomponent"
    },
    storageKeys: {
      position: "FRONTEND_DEVTOOLS_POSITION",
      collapsed: "FRONTEND_DEVTOOLS_COLLAPSED",
      enabled: "FRONTEND_DEVTOOLS_ENABLED",
      scanning: "FRONTEND_DEVTOOLS_SCANNING",
      domStatsPinned: "FRONTEND_DEVTOOLS_DOM_STATS_PINNED",
      lagRadarPinned: "FRONTEND_DEVTOOLS_LAG_RADAR_PINNED"
    },
    fonts: {
      mono: "11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace",
      ui: "system-ui, -apple-system, sans-serif"
    }
  };
  function lerp(start, end, speed = CONFIG.animation.interpolationSpeed) {
    return start + (end - start) * speed;
  }
  function debounce(fn, delay) {
    let timeoutId = null;
    const debounced = (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    };
    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    return debounced;
  }
  function getDevicePixelRatio() {
    return Math.max(window.devicePixelRatio, 1);
  }
  function isDevtoolsElement(element) {
    if (!element) return false;
    const attr = CONFIG.attributes.devtools;
    return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null;
  }
  function getScalaComponent(element) {
    if (!element) return null;
    const attr = CONFIG.attributes.scalaComponent;
    const closest = element.closest(`[${attr}]`);
    if (!closest) return null;
    return {
      element: closest,
      name: closest.getAttribute(attr)
    };
  }
  function getScalaSource(node) {
    const element = node && node.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    if (!element) return null;
    const attr = CONFIG.attributes.scalaComponent;
    const value = element.getAttribute(attr);
    if (value) return value;
    const closest = element.closest(`[${attr}]`);
    return closest ? closest.getAttribute(attr) : null;
  }
  function getComponentSourceInfo(element) {
    if (!element) return null;
    const props = CONFIG.properties;
    const el = element;
    return {
      sourcePath: el[props.sourcePath] || null,
      sourceLine: el[props.sourceLine] !== void 0 ? String(el[props.sourceLine]) : null,
      filename: el[props.filename] || null,
      scalaName: el[props.name] || null,
      isMarked: el[props.markAsComponent] === "true",
      displayName: element.getAttribute(CONFIG.attributes.scalaComponent)
    };
  }
  function openInIDE(sourcePath, sourceLine = null) {
    if (!sourcePath) {
      console.warn("Devtools: No source path provided");
      return;
    }
    let uri = `idea://open?file=${sourcePath}`;
    if (sourceLine) {
      uri += `&line=${sourceLine}`;
    }
    window.open(uri, "_blank");
  }

  // frontend-devtools/core/react-inspector.ts
  function getReactFiber(domNode) {
    try {
      if (!domNode) return null;
      const key = Object.keys(domNode).find((k2) => k2.startsWith("__reactFiber$") || k2.startsWith("__reactContainer$"));
      return key ? domNode[key] : null;
    } catch {
      return null;
    }
  }
  function getComponentNameFromType(type) {
    try {
      if (type == null) return null;
      if (typeof type === "function") {
        return type.displayName || type.name || null;
      }
      if (typeof type === "string") {
        return type;
      }
      if (typeof type === "object") {
        const $$typeof = type.$$typeof;
        if (!$$typeof) return null;
        const typeStr = $$typeof.toString();
        if (typeStr === "Symbol(react.forward_ref)") {
          const displayName = type.displayName;
          if (displayName) return displayName;
          const innerName = type.render?.displayName || type.render?.name || "";
          return innerName ? `ForwardRef(${innerName})` : "ForwardRef";
        }
        if (typeStr === "Symbol(react.memo)") {
          return type.displayName || getComponentNameFromType(type.type) || "Memo";
        }
        if (typeStr === "Symbol(react.lazy)") {
          try {
            return getComponentNameFromType(type._init(type._payload));
          } catch {
            return null;
          }
        }
        if (typeStr === "Symbol(react.context)") {
          return (type.displayName || "Context") + ".Provider";
        }
        if (typeStr === "Symbol(react.consumer)") {
          return (type._context?.displayName || "Context") + ".Consumer";
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  function getComponentNameFromFiber(fiber) {
    try {
      if (!fiber) return null;
      const { type } = fiber;
      if (typeof type === "function") {
        return type.displayName || type.name || null;
      }
      if (typeof type === "string") {
        return type;
      }
      if (typeof type === "object" && type !== null) {
        return getComponentNameFromType(type);
      }
      return null;
    } catch {
      return null;
    }
  }
  function getReactComponentFromNode(domNode) {
    try {
      const fiber = getReactFiber(domNode);
      if (!fiber) return null;
      let current = fiber;
      let iterations = 0;
      const maxIterations = 500;
      while (current && iterations < maxIterations) {
        iterations++;
        const name = getComponentNameFromFiber(current);
        if (name && typeof current.type !== "string") {
          return {
            name,
            fiber: current,
            props: current.memoizedProps,
            element: domNode
            // The DOM node we started from
          };
        }
        current = current.return;
      }
      return null;
    } catch {
      return null;
    }
  }
  function getReactComponent(element) {
    try {
      if (!element) return null;
      const reactInfo = getReactComponentFromNode(element);
      if (!reactInfo) return null;
      return {
        element: reactInfo.element,
        name: reactInfo.name,
        isReact: true
      };
    } catch {
      return null;
    }
  }
  function getReactComponentSourceInfo(element) {
    try {
      const reactInfo = getReactComponentFromNode(element);
      if (!reactInfo) return null;
      let sourcePath = null;
      let sourceLine = null;
      let filename = null;
      const name = reactInfo.name || "";
      if (name.includes("/")) {
        const lineMatch = name.match(/^(.+):(\d+)$/);
        if (lineMatch) {
          sourcePath = lineMatch[1] ?? null;
          sourceLine = lineMatch[2] ?? null;
        } else {
          sourcePath = name;
        }
        if (sourcePath) {
          const pathParts = sourcePath.split("/");
          filename = pathParts[pathParts.length - 1] ?? null;
        }
      }
      return {
        sourcePath,
        sourceLine,
        filename,
        scalaName: null,
        isMarked: false,
        isReact: true,
        displayName: reactInfo.name,
        props: reactInfo.props,
        fiber: reactInfo.fiber
      };
    } catch {
      return null;
    }
  }

  // frontend-devtools/ui/fd-mutation-canvas.ts
  var REACT_COLOR = { r: 97, g: 218, b: 251 };
  var FdMutationCanvas = class extends i4 {
    constructor() {
      super(...arguments);
      this.active = false;
      this._canvas = null;
      this._ctx = null;
      this._animationId = null;
      this._highlights = /* @__PURE__ */ new Map();
      this._resizeHandler = null;
      this._observer = null;
    }
    updated(changedProperties) {
      if (changedProperties.has("active")) {
        if (this.active) {
          this._start();
        } else {
          this._stop();
        }
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._stop();
    }
    /**
     * Manually highlight an element (useful for external integrations).
     */
    highlight(element, name, options = {}) {
      if (!this._canvas || !element.isConnected) return;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const isReact = options.isReact ?? false;
      const existing = this._highlights.get(element);
      if (existing) {
        existing.targetX = rect.left;
        existing.targetY = rect.top;
        existing.targetWidth = rect.width;
        existing.targetHeight = rect.height;
        existing.startTime = performance.now();
        existing.count++;
        existing.isReact = isReact;
      } else {
        this._highlights.set(element, {
          name,
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          targetX: rect.left,
          targetY: rect.top,
          targetWidth: rect.width,
          targetHeight: rect.height,
          startTime: performance.now(),
          count: 1,
          isReact
        });
      }
      this._startAnimation();
    }
    /**
     * Clear all highlights.
     */
    clear() {
      this._highlights.clear();
      this._clearCanvas();
    }
    _start() {
      this._createCanvas();
      this._startObserver();
    }
    _stop() {
      this._stopObserver();
      this._destroyCanvas();
    }
    _createCanvas() {
      if (this._canvas) return;
      const existing = document.querySelector(
        `[${CONFIG.attributes.devtools}="mutation-canvas"]`
      );
      if (existing) {
        this._canvas = existing;
        this._ctx = existing.getContext("2d");
      } else {
        const canvas = document.createElement("canvas");
        canvas.setAttribute(CONFIG.attributes.devtools, "mutation-canvas");
        const dpr = getDevicePixelRatio();
        Object.assign(canvas.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: `${window.innerWidth}px`,
          height: `${window.innerHeight}px`,
          pointerEvents: "none",
          zIndex: "2147483647"
        });
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        document.body.appendChild(canvas);
        this._canvas = canvas;
        this._ctx = canvas.getContext("2d");
        this._ctx?.scale(dpr, dpr);
      }
      if (this._resizeHandler) {
        this._resizeHandler.cancel();
        window.removeEventListener("resize", this._resizeHandler);
      }
      this._resizeHandler = debounce(() => this._handleResize(), CONFIG.intervals.resizeDebounce);
      window.addEventListener("resize", this._resizeHandler);
    }
    _destroyCanvas() {
      this._stopAnimation();
      this._highlights.clear();
      if (this._resizeHandler) {
        this._resizeHandler.cancel();
        window.removeEventListener("resize", this._resizeHandler);
        this._resizeHandler = null;
      }
      if (this._canvas?.parentNode) {
        this._canvas.parentNode.removeChild(this._canvas);
      }
      this._canvas = null;
      this._ctx = null;
    }
    _handleResize() {
      if (!this._canvas || !this._ctx) return;
      const dpr = getDevicePixelRatio();
      this._canvas.style.width = `${window.innerWidth}px`;
      this._canvas.style.height = `${window.innerHeight}px`;
      this._canvas.width = window.innerWidth * dpr;
      this._canvas.height = window.innerHeight * dpr;
      this._ctx.scale(dpr, dpr);
    }
    _startAnimation() {
      if (this._animationId) return;
      this._sweepStale();
      this._animationId = requestAnimationFrame(() => this._draw());
    }
    _stopAnimation() {
      if (this._animationId) {
        cancelAnimationFrame(this._animationId);
        this._animationId = null;
      }
    }
    _sweepStale() {
      for (const [element] of this._highlights) {
        if (!element.isConnected) {
          this._highlights.delete(element);
        }
      }
    }
    _clearCanvas() {
      if (!this._ctx || !this._canvas) return;
      const dpr = getDevicePixelRatio();
      this._ctx.clearRect(0, 0, this._canvas.width / dpr, this._canvas.height / dpr);
    }
    _draw() {
      if (!this._ctx || !this._canvas) return;
      this._clearCanvas();
      const toRemove = [];
      const labelMap = /* @__PURE__ */ new Map();
      const { r: r6, g: g2, b: b3 } = CONFIG.colors.primary;
      const reactColor = REACT_COLOR;
      const duration = CONFIG.animation.highlightDurationMs;
      const now = performance.now();
      for (const [element, highlight] of this._highlights) {
        if (!element.isConnected) {
          toRemove.push(element);
          continue;
        }
        highlight.x = lerp(highlight.x, highlight.targetX);
        highlight.y = lerp(highlight.y, highlight.targetY);
        highlight.width = lerp(highlight.width, highlight.targetWidth);
        highlight.height = lerp(highlight.height, highlight.targetHeight);
        const elapsed = now - highlight.startTime;
        const progress = Math.min(elapsed / duration, 1);
        const alpha = 1 - progress;
        if (progress >= 1) {
          toRemove.push(element);
          continue;
        }
        const color = highlight.isReact ? reactColor : { r: r6, g: g2, b: b3 };
        this._ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
        this._ctx.lineWidth = 1;
        this._ctx.beginPath();
        this._ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height);
        this._ctx.stroke();
        this._ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`;
        this._ctx.fill();
        const labelKey = `${highlight.x},${highlight.y}`;
        const existing = labelMap.get(labelKey);
        if (!existing) {
          labelMap.set(labelKey, { ...highlight, alpha });
        } else {
          existing.count += highlight.count;
          if (alpha > existing.alpha) existing.alpha = alpha;
        }
      }
      this._ctx.font = CONFIG.fonts.mono;
      for (const [, { x: x2, y: y3, name, count, alpha, isReact }] of labelMap) {
        const color = isReact ? reactColor : { r: r6, g: g2, b: b3 };
        const displayName = isReact ? `\u269B ${name}` : name;
        const labelText = count > 1 ? `${displayName} \xD7${count}` : displayName;
        const textWidth = this._ctx.measureText(labelText).width;
        const textHeight = 11;
        const padding = 2;
        let labelY = y3 - textHeight - padding * 2;
        if (labelY < 0) labelY = 0;
        this._ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
        this._ctx.fillRect(x2, labelY, textWidth + padding * 2, textHeight + padding * 2);
        this._ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        this._ctx.fillText(labelText, x2 + padding, labelY + textHeight + padding - 2);
      }
      for (const element of toRemove) {
        this._highlights.delete(element);
      }
      if (this._highlights.size > 0) {
        this._animationId = requestAnimationFrame(() => this._draw());
      } else {
        this._animationId = null;
      }
    }
    _startObserver() {
      if (this._observer) return;
      this._observer = new MutationObserver((mutations) => this._handleMutations(mutations));
      this._observer.observe(document.body, {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
      });
    }
    _stopObserver() {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
    }
    _handleMutations(mutations) {
      if (!this.active) return;
      for (const record of mutations) {
        const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
        if (!target || isDevtoolsElement(target)) continue;
        this._highlightElement(target);
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node)) {
            this._highlightElement(node);
          }
        }
      }
    }
    _highlightElement(element) {
      if (!this._canvas) return;
      if (!element.isConnected) return;
      let name = getScalaSource(element);
      let isReact = false;
      if (!name) {
        const reactComponent = getReactComponentFromNode(element);
        if (reactComponent) {
          name = reactComponent.name;
          isReact = true;
        }
      }
      const displayName = name ?? element.tagName.toLowerCase();
      this.highlight(element, displayName, { isReact });
    }
  };
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdMutationCanvas.prototype, "active", 2);
  FdMutationCanvas = __decorateClass([
    t3("fd-mutation-canvas")
  ], FdMutationCanvas);

  // frontend-devtools/ui/fd-switch.ts
  var FdSwitch = class extends i4 {
    constructor() {
      super(...arguments);
      this.checked = false;
      this.title = "";
    }
    _handleChange(e7) {
      const input = e7.target;
      this.checked = input.checked;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { checked: this.checked },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b2`
      <label class="devtools-toggle" part="container">
        <input
          type="checkbox"
          .checked=${this.checked}
          @change=${this._handleChange}
          title=${this.title}
          part="input"
        />
        <span class="devtools-toggle-track" part="track">
          <span class="devtools-toggle-thumb" part="thumb"></span>
        </span>
      </label>
    `;
    }
  };
  FdSwitch.styles = i`
    :host {
      display: inline-flex;
    }

    .devtools-toggle {
      position: relative;
      width: 36px;
      height: 20px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .devtools-toggle input {
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
      cursor: pointer;
      width: 36px;
      height: 20px;
      z-index: 1;
      margin: 0;
    }

    .devtools-toggle-track {
      position: relative;
      width: 36px;
      height: 20px;
      background: var(--fd-switch-off);
      border-radius: 9999px;
      transition: background-color 0.2s;
      flex-shrink: 0;
    }

    .devtools-toggle input:checked + .devtools-toggle-track {
      background: var(--fd-primary);
    }

    .devtools-toggle-thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      background: var(--fd-switch-knob);
      border-radius: 9999px;
      box-shadow: var(--fd-switch-knob-shadow);
      transition: left 0.2s ease;
    }

    .devtools-toggle input:checked + .devtools-toggle-track .devtools-toggle-thumb {
      left: calc(100% - 18px);
    }

    /* ===== Focus states ===== */
    .devtools-toggle input:focus + .devtools-toggle-track {
      outline: none;
    }

    .devtools-toggle input:focus-visible + .devtools-toggle-track {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdSwitch.prototype, "checked", 2);
  __decorateClass([
    n4({ type: String })
  ], FdSwitch.prototype, "title", 2);
  FdSwitch = __decorateClass([
    t3("fd-switch")
  ], FdSwitch);

  // frontend-devtools/core/keyboard-manager.ts
  var KeyboardPriority = {
    /** Modal/dialog level - highest priority */
    MODAL: 1e3,
    /** Overlay panels like component tree */
    PANEL: 500,
    /** Active tools like component inspector */
    TOOL: 100,
    /** Global shortcuts like Ctrl+Shift+C */
    GLOBAL: 0
  };
  var KeyboardManager = class {
    constructor() {
      this._handlers = [];
      this._active = false;
      /**
       * Handle keydown events by calling handlers in priority order.
       */
      this._handleKeydown = (e7) => {
        for (const { handler } of this._handlers) {
          try {
            const handled = handler(e7);
            if (handled) {
              return;
            }
          } catch (error) {
            console.error("KeyboardManager: handler error", error);
          }
        }
      };
    }
    /**
     * Register a keyboard handler with a priority level.
     * Higher priority handlers are called first.
     * Returns an unregister function.
     */
    register(id, handler, priority) {
      this._handlers = this._handlers.filter((h4) => h4.id !== id);
      const registration = { id, handler, priority };
      this._handlers.push(registration);
      this._handlers.sort((a3, b3) => b3.priority - a3.priority);
      return () => this.unregister(id);
    }
    /**
     * Unregister a handler by id.
     */
    unregister(id) {
      this._handlers = this._handlers.filter((h4) => h4.id !== id);
    }
    /**
     * Start listening for keyboard events.
     */
    start() {
      if (this._active) return;
      this._active = true;
      document.addEventListener("keydown", this._handleKeydown, { capture: true });
    }
    /**
     * Stop listening for keyboard events.
     */
    stop() {
      if (!this._active) return;
      this._active = false;
      document.removeEventListener("keydown", this._handleKeydown, { capture: true });
    }
    /**
     * Cleanup all handlers.
     */
    destroy() {
      this.stop();
      this._handlers = [];
    }
  };
  var keyboardManager = new KeyboardManager();

  // frontend-devtools/ui/fd-component-inspector.ts
  var FdComponentInspector = class extends i4 {
    constructor() {
      super(...arguments);
      this.active = false;
      // Canvas state
      this._canvas = null;
      this._ctx = null;
      this._currentRect = null;
      this._animationId = null;
      this._removeTimeoutId = null;
      this._startAnimationId = null;
      // Crosshair state
      this._cursorX = 0;
      this._cursorY = 0;
      // Event catcher state
      this._eventCatcher = null;
      this._lastHovered = null;
      this._focusedElement = null;
      this._focusedIsReact = false;
      this._focusHistory = [];
      // Boundary feedback animation state
      this._boundaryAnimationId = null;
      this._borderScale = 1;
      this._pillShakeOffset = 0;
      this._handlePointerMove = (e7) => {
        if (!this.active) return;
        this._cursorX = e7.clientX;
        this._cursorY = e7.clientY;
        if (this._lastHovered && !this._lastHovered.isConnected) {
          this._lastHovered = null;
          this._clearOverlay();
        }
        if (!this._eventCatcher) return;
        this._eventCatcher.style.pointerEvents = "none";
        const element = document.elementFromPoint(e7.clientX, e7.clientY);
        this._eventCatcher.style.pointerEvents = "auto";
        if (!element) {
          this._clearCanvas();
          this._drawCrosshair();
          return;
        }
        let component = getScalaComponent(element);
        let info = null;
        if (component) {
          const sourceInfo = getComponentSourceInfo(component.element);
          info = { isMarked: sourceInfo?.isMarked ?? false };
        } else {
          component = getReactComponent(element);
          if (component) {
            info = { isReact: true };
          }
        }
        if (!component) {
          if (this._lastHovered) {
            this._lastHovered = null;
            this._clearOverlay();
          }
          this._clearCanvas();
          this._drawCrosshair();
          return;
        }
        if (component.element === this._lastHovered) {
          if (this._currentRect) {
            this._drawOverlay(this._currentRect, component.name ?? "Unknown", info ?? {});
          }
          return;
        }
        this._lastHovered = component.element;
        this._focusedElement = component.element;
        this._focusedIsReact = info?.isReact ?? false;
        this._focusHistory = [];
        const rect = component.element.getBoundingClientRect();
        this._animateTo(
          { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          component.name ?? "Unknown",
          info ?? {}
        );
        this.dispatchEvent(
          new CustomEvent("hover-change", {
            detail: {
              element: component.element,
              name: component.name ?? "Unknown",
              isReact: info?.isReact ?? false
            },
            bubbles: true,
            composed: true
          })
        );
      };
      this._handleClick = (e7) => {
        if (!this.active) return;
        if (isDevtoolsElement(e7.target) && e7.target !== this._eventCatcher) return;
        e7.preventDefault();
        e7.stopPropagation();
        if (!this._eventCatcher) return;
        this._eventCatcher.style.pointerEvents = "none";
        const element = document.elementFromPoint(e7.clientX, e7.clientY);
        this._eventCatcher.style.pointerEvents = "auto";
        if (!element) return;
        const scalaComponent = getScalaComponent(element);
        if (scalaComponent) {
          const info = getComponentSourceInfo(scalaComponent.element);
          if (info?.sourcePath) {
            openInIDE(info.sourcePath, info.sourceLine);
            this.active = false;
            return;
          }
        }
        const reactComponent = getReactComponent(element);
        if (reactComponent) {
          const info = getReactComponentSourceInfo(reactComponent.element);
          if (info?.sourcePath) {
            openInIDE(info.sourcePath, info.sourceLine);
            this.active = false;
            return;
          }
          this.active = false;
          return;
        }
      };
      /**
       * Handle keyboard events for inspector navigation.
       * Returns true if the event was handled.
       */
      this._handleKeyboardEvent = (e7) => {
        if (!this.active) return false;
        if (e7.key === "Escape") {
          this.active = false;
          return true;
        }
        if (e7.key === "Enter") {
          e7.preventDefault();
          this._selectCurrentComponent();
          return true;
        }
        if (e7.key === "ArrowUp" && this._focusedElement) {
          e7.preventDefault();
          if (this._focusedIsReact) {
            const parent = this._getParentReactComponent(this._focusedElement);
            if (parent) {
              const currentName = this._getCurrentComponentName();
              this._focusHistory.push({
                element: this._focusedElement,
                name: currentName,
                isReact: true
              });
              this._focusComponent(parent.element, parent.name, { isReact: true });
            } else {
              this._animatePillShake();
            }
          } else {
            const parent = this._getParentScalaComponent(this._focusedElement);
            if (parent) {
              const currentName = this._getCurrentComponentName();
              this._focusHistory.push({
                element: this._focusedElement,
                name: currentName,
                isReact: false
              });
              const sourceInfo = getComponentSourceInfo(parent.element);
              this._focusComponent(parent.element, parent.name, {
                isMarked: sourceInfo?.isMarked ?? false
              });
            } else {
              this._animatePillShake();
            }
          }
          return true;
        }
        if (e7.key === "ArrowDown") {
          e7.preventDefault();
          if (this._focusHistory.length > 0) {
            const previous = this._focusHistory.pop();
            if (previous.isReact) {
              this._focusComponent(previous.element, previous.name, { isReact: true });
            } else {
              const sourceInfo = getComponentSourceInfo(previous.element);
              this._focusComponent(previous.element, previous.name, {
                isMarked: sourceInfo?.isMarked ?? false
              });
            }
          } else {
            this._animateBoundaryPulse();
          }
          return true;
        }
        return false;
      };
    }
    updated(changedProperties) {
      if (changedProperties.has("active")) {
        if (this.active) {
          this._start();
        } else {
          this._stop();
        }
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._stop();
    }
    _start() {
      this._createCanvas();
      this._createEventCatcher();
      this._addEventListeners();
      this._startAnimationId = requestAnimationFrame(() => {
        this._startAnimationId = null;
        this._showCanvas();
        if (this._eventCatcher) {
          this._eventCatcher.style.pointerEvents = "auto";
        }
      });
      this._dispatchChange(true);
    }
    _stop() {
      this._removeEventListeners();
      this._lastHovered = null;
      this._focusedElement = null;
      this._focusedIsReact = false;
      this._focusHistory = [];
      if (this._startAnimationId) {
        cancelAnimationFrame(this._startAnimationId);
        this._startAnimationId = null;
      }
      this._cancelBoundaryAnimation();
      this._destroyCanvas();
      this._destroyEventCatcher();
      this._dispatchChange(false);
    }
    _dispatchChange(active) {
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { active },
          bubbles: true,
          composed: true
        })
      );
    }
    _createCanvas() {
      if (this._canvas) return;
      const existing = document.querySelector(
        `[${CONFIG.attributes.devtools}="inspect-canvas"]`
      );
      if (existing) {
        this._canvas = existing;
        this._ctx = existing.getContext("2d");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.setAttribute(CONFIG.attributes.devtools, "inspect-canvas");
      const dpr = getDevicePixelRatio();
      Object.assign(canvas.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: `${window.innerWidth}px`,
        height: `${window.innerHeight}px`,
        pointerEvents: "none",
        zIndex: "2147483646",
        opacity: "0",
        transition: "opacity 0.15s ease-in-out"
      });
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      document.body.appendChild(canvas);
      this._canvas = canvas;
      this._ctx = canvas.getContext("2d");
      this._ctx?.scale(dpr, dpr);
    }
    _showCanvas() {
      if (this._canvas) {
        this._canvas.style.opacity = "1";
      }
    }
    _destroyCanvas() {
      this._cancelAnimation();
      this._currentRect = null;
      if (this._removeTimeoutId) {
        clearTimeout(this._removeTimeoutId);
        this._removeTimeoutId = null;
      }
      if (this._canvas) {
        const canvasToRemove = this._canvas;
        this._canvas = null;
        this._ctx = null;
        canvasToRemove.style.opacity = "0";
        this._removeTimeoutId = setTimeout(() => {
          if (canvasToRemove.parentNode) {
            canvasToRemove.parentNode.removeChild(canvasToRemove);
          }
          this._removeTimeoutId = null;
        }, 150);
      }
    }
    _clearCanvas() {
      if (!this._ctx || !this._canvas) return;
      const dpr = getDevicePixelRatio();
      this._ctx.clearRect(0, 0, this._canvas.width / dpr, this._canvas.height / dpr);
    }
    _cancelAnimation() {
      if (this._animationId) {
        cancelAnimationFrame(this._animationId);
        this._animationId = null;
      }
    }
    _cancelBoundaryAnimation() {
      if (this._boundaryAnimationId) {
        cancelAnimationFrame(this._boundaryAnimationId);
        this._boundaryAnimationId = null;
      }
      this._borderScale = 1;
      this._pillShakeOffset = 0;
    }
    _animateBoundaryPulse() {
      this._cancelBoundaryAnimation();
      const duration = 200;
      const startTime = performance.now();
      const maxScale = 1.5;
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this._borderScale = 1 + Math.sin(progress * Math.PI) * (maxScale - 1);
        if (this._currentRect && this._focusedElement) {
          const name = this._getCurrentComponentName();
          const info = this._focusedIsReact ? { isReact: true } : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false };
          this._drawOverlay(this._currentRect, name, info);
        }
        if (progress < 1) {
          this._boundaryAnimationId = requestAnimationFrame(animate);
        } else {
          this._borderScale = 1;
          this._boundaryAnimationId = null;
          if (this._currentRect && this._focusedElement) {
            const name = this._getCurrentComponentName();
            const info = this._focusedIsReact ? { isReact: true } : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false };
            this._drawOverlay(this._currentRect, name, info);
          }
        }
      };
      this._boundaryAnimationId = requestAnimationFrame(animate);
    }
    _animatePillShake() {
      this._cancelBoundaryAnimation();
      const duration = 300;
      const startTime = performance.now();
      const shakeAmount = 6;
      const shakeFrequency = 3;
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const decay = 1 - progress;
        this._pillShakeOffset = Math.sin(progress * Math.PI * 2 * shakeFrequency) * shakeAmount * decay;
        if (this._currentRect && this._focusedElement) {
          const name = this._getCurrentComponentName();
          const info = this._focusedIsReact ? { isReact: true } : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false };
          this._drawOverlay(this._currentRect, name, info);
        }
        if (progress < 1) {
          this._boundaryAnimationId = requestAnimationFrame(animate);
        } else {
          this._pillShakeOffset = 0;
          this._boundaryAnimationId = null;
          if (this._currentRect && this._focusedElement) {
            const name = this._getCurrentComponentName();
            const info = this._focusedIsReact ? { isReact: true } : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false };
            this._drawOverlay(this._currentRect, name, info);
          }
        }
      };
      this._boundaryAnimationId = requestAnimationFrame(animate);
    }
    _createEventCatcher() {
      if (this._eventCatcher) return;
      const existing = document.querySelector(`[${CONFIG.attributes.devtools}="event-catcher"]`);
      if (existing) {
        this._eventCatcher = existing;
        return;
      }
      const div = document.createElement("div");
      div.setAttribute(CONFIG.attributes.devtools, "event-catcher");
      Object.assign(div.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: "2147483645",
        cursor: "crosshair"
      });
      document.body.appendChild(div);
      this._eventCatcher = div;
    }
    _destroyEventCatcher() {
      if (this._eventCatcher?.parentNode) {
        this._eventCatcher.parentNode.removeChild(this._eventCatcher);
      }
      this._eventCatcher = null;
    }
    _addEventListeners() {
      document.addEventListener("pointermove", this._handlePointerMove, {
        passive: true,
        capture: true
      });
      document.addEventListener("click", this._handleClick, { capture: true });
      this._registerKeyboardHandlers();
    }
    _removeEventListeners() {
      document.removeEventListener("pointermove", this._handlePointerMove, { capture: true });
      document.removeEventListener("click", this._handleClick, { capture: true });
      this._unregisterKeyboardHandlers();
    }
    _registerKeyboardHandlers() {
      keyboardManager.register(
        "inspector:navigation",
        (e7) => this._handleKeyboardEvent(e7),
        KeyboardPriority.TOOL
      );
    }
    _unregisterKeyboardHandlers() {
      keyboardManager.unregister("inspector:navigation");
    }
    _clearOverlay() {
      this._currentRect = null;
      this._clearCanvas();
    }
    _animateTo(targetRect, componentName, info = {}) {
      if (!this._currentRect) {
        this._currentRect = { ...targetRect };
        this._drawOverlay(this._currentRect, componentName, info);
        return;
      }
      this._cancelAnimation();
      const animate = () => {
        if (!this._currentRect) return;
        this._currentRect.left = lerp(this._currentRect.left, targetRect.left);
        this._currentRect.top = lerp(this._currentRect.top, targetRect.top);
        this._currentRect.width = lerp(this._currentRect.width, targetRect.width);
        this._currentRect.height = lerp(this._currentRect.height, targetRect.height);
        this._drawOverlay(this._currentRect, componentName, info);
        const stillMoving = Math.abs(this._currentRect.left - targetRect.left) > 0.5 || Math.abs(this._currentRect.top - targetRect.top) > 0.5 || Math.abs(this._currentRect.width - targetRect.width) > 0.5 || Math.abs(this._currentRect.height - targetRect.height) > 0.5;
        if (stillMoving) {
          this._animationId = requestAnimationFrame(animate);
        } else {
          this._currentRect = { ...targetRect };
          this._drawOverlay(this._currentRect, componentName, info);
        }
      };
      this._animationId = requestAnimationFrame(animate);
    }
    _drawOverlay(rect, componentName, info) {
      if (!this._ctx) return;
      this._clearCanvas();
      if (!rect) return;
      const isReact = info?.isReact || false;
      const colors = CONFIG.colors;
      let strokeColor, fillColor, pillBg, pillText;
      if (isReact) {
        strokeColor = colors.inspectReactStroke;
        fillColor = colors.inspectReactFill;
        pillBg = colors.inspectReactPillBg;
        pillText = colors.inspectReactPillText;
      } else {
        strokeColor = colors.inspectStroke;
        fillColor = colors.inspectFill;
        pillBg = colors.inspectPillBg;
        pillText = colors.inspectPillText;
      }
      const scale = this._borderScale;
      const expandAmount = (scale - 1) * 8;
      const adjustedRect = {
        left: rect.left - expandAmount,
        top: rect.top - expandAmount,
        width: rect.width + expandAmount * 2,
        height: rect.height + expandAmount * 2
      };
      this._ctx.strokeStyle = strokeColor;
      this._ctx.fillStyle = fillColor;
      this._ctx.lineWidth = 1 + (scale - 1) * 2;
      this._ctx.setLineDash([4]);
      this._ctx.fillRect(adjustedRect.left, adjustedRect.top, adjustedRect.width, adjustedRect.height);
      this._ctx.strokeRect(adjustedRect.left, adjustedRect.top, adjustedRect.width, adjustedRect.height);
      if (componentName) {
        this._drawPill(rect, componentName, isReact, pillBg, pillText);
      }
      this._drawCrosshair();
    }
    _drawPill(rect, componentName, isReact, pillBg, pillText) {
      if (!this._ctx) return;
      const pillHeight = 24;
      const pillPadding = 8;
      const pillGap = 4;
      this._ctx.font = "12px system-ui, -apple-system, sans-serif";
      const displayName = isReact ? `\u269B ${componentName}` : componentName;
      const textWidth = this._ctx.measureText(displayName).width;
      const pillWidth = textWidth + pillPadding * 2;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - (rect.top + rect.height);
      const spaceInside = rect.height;
      let pillY;
      const requiredHeight = pillHeight + pillGap;
      if (spaceAbove >= requiredHeight) {
        pillY = rect.top - pillHeight - pillGap;
      } else if (spaceBelow >= requiredHeight) {
        pillY = rect.top + rect.height + pillGap;
      } else if (spaceInside >= pillHeight + pillGap * 2) {
        pillY = rect.top + pillGap;
      } else {
        pillY = Math.max(pillGap, Math.min(rect.top + pillGap, viewportHeight - pillHeight - pillGap));
      }
      let pillX = rect.left + this._pillShakeOffset;
      if (pillX + pillWidth > viewportWidth - pillGap) {
        pillX = viewportWidth - pillWidth - pillGap;
      }
      if (pillX < pillGap) {
        pillX = pillGap;
      }
      this._ctx.fillStyle = pillBg;
      this._ctx.beginPath();
      this._ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      this._ctx.fill();
      this._ctx.fillStyle = pillText;
      this._ctx.textBaseline = "middle";
      this._ctx.fillText(displayName, pillX + pillPadding, pillY + pillHeight / 2);
    }
    _drawCrosshair() {
      if (!this._ctx) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const colors = CONFIG.colors;
      const crosshairColor = colors.inspectCrosshair ?? "rgba(99, 102, 241, 0.5)";
      this._ctx.save();
      this._ctx.strokeStyle = crosshairColor;
      this._ctx.lineWidth = 1;
      this._ctx.setLineDash([4, 4]);
      this._ctx.beginPath();
      this._ctx.moveTo(this._cursorX, 0);
      this._ctx.lineTo(this._cursorX, viewportHeight);
      this._ctx.stroke();
      this._ctx.beginPath();
      this._ctx.moveTo(0, this._cursorY);
      this._ctx.lineTo(viewportWidth, this._cursorY);
      this._ctx.stroke();
      this._ctx.restore();
    }
    _getParentScalaComponent(element) {
      const attr = CONFIG.attributes.scalaComponent;
      const parent = element.parentElement?.closest(`[${attr}]`);
      if (!parent) return null;
      return {
        element: parent,
        name: parent.getAttribute(attr) ?? "Unknown"
      };
    }
    _getParentReactComponent(element) {
      const fiber = element.__reactFiber$ || Object.keys(element).find((k2) => k2.startsWith("__reactFiber$")) ? element[Object.keys(element).find((k2) => k2.startsWith("__reactFiber$"))] : null;
      if (!fiber) return null;
      let current = fiber.return;
      let iterations = 0;
      const maxIterations = 500;
      while (current && iterations < maxIterations) {
        iterations++;
        if (current.type && typeof current.type !== "string") {
          const name = current.type.displayName || current.type.name || (current.type.render?.displayName || current.type.render?.name) || "Unknown";
          let stateNode = current.stateNode;
          if (!stateNode || !(stateNode instanceof Element)) {
            let child = current.child;
            while (child && !(child.stateNode instanceof Element)) {
              child = child.child;
            }
            stateNode = child?.stateNode;
          }
          if (stateNode instanceof Element) {
            return { element: stateNode, name, isReact: true };
          }
        }
        current = current.return;
      }
      return null;
    }
    _focusComponent(element, name, info) {
      this._focusedElement = element;
      this._focusedIsReact = info.isReact ?? false;
      this._lastHovered = element;
      const rect = element.getBoundingClientRect();
      this._animateTo(
        { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        name,
        info
      );
    }
    /**
     * Public method to highlight an element from external code (e.g., laminar tree).
     * Requires the inspector to be active.
     */
    highlightElement(element, name) {
      if (!this.active) return;
      const sourceInfo = getComponentSourceInfo(element);
      this._focusComponent(element, name, {
        isMarked: sourceInfo?.isMarked ?? false
      });
    }
    _selectCurrentComponent() {
      if (!this._focusedElement) return;
      if (this._focusedIsReact) {
        const info = getReactComponentSourceInfo(this._focusedElement);
        if (info?.sourcePath) {
          openInIDE(info.sourcePath, info.sourceLine);
          this.active = false;
        } else {
          this.active = false;
        }
      } else {
        const info = getComponentSourceInfo(this._focusedElement);
        if (info?.sourcePath) {
          openInIDE(info.sourcePath, info.sourceLine);
          this.active = false;
        }
      }
    }
    _getCurrentComponentName() {
      if (!this._focusedElement) return "Unknown";
      if (this._focusedIsReact) {
        const component = getReactComponent(this._focusedElement);
        return component?.name ?? "Unknown";
      } else {
        const component = getScalaComponent(this._focusedElement);
        return component?.name ?? "Unknown";
      }
    }
  };
  FdComponentInspector.styles = i`
    :host {
      display: none;
    }
  `;
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdComponentInspector.prototype, "active", 2);
  FdComponentInspector = __decorateClass([
    t3("fd-component-inspector")
  ], FdComponentInspector);

  // node_modules/lit-html/directive.js
  var t4 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
  var e6 = (t6) => (...e7) => ({ _$litDirective$: t6, values: e7 });
  var i5 = class {
    constructor(t6) {
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t6, e7, i7) {
      this._$Ct = t6, this._$AM = e7, this._$Ci = i7;
    }
    _$AS(t6, e7) {
      return this.update(t6, e7);
    }
    update(t6, e7) {
      return this.render(...e7);
    }
  };

  // node_modules/lit-html/directive-helpers.js
  var { I: t5 } = j;
  var i6 = (o6) => o6;
  var s4 = () => document.createComment("");
  var v2 = (o6, n5, e7) => {
    const l3 = o6._$AA.parentNode, d3 = void 0 === n5 ? o6._$AB : n5._$AA;
    if (void 0 === e7) {
      const i7 = l3.insertBefore(s4(), d3), n6 = l3.insertBefore(s4(), d3);
      e7 = new t5(i7, n6, o6, o6.options);
    } else {
      const t6 = e7._$AB.nextSibling, n6 = e7._$AM, c5 = n6 !== o6;
      if (c5) {
        let t7;
        e7._$AQ?.(o6), e7._$AM = o6, void 0 !== e7._$AP && (t7 = o6._$AU) !== n6._$AU && e7._$AP(t7);
      }
      if (t6 !== d3 || c5) {
        let o7 = e7._$AA;
        for (; o7 !== t6; ) {
          const t7 = i6(o7).nextSibling;
          i6(l3).insertBefore(o7, d3), o7 = t7;
        }
      }
    }
    return e7;
  };
  var u3 = (o6, t6, i7 = o6) => (o6._$AI(t6, i7), o6);
  var m2 = {};
  var p3 = (o6, t6 = m2) => o6._$AH = t6;
  var M2 = (o6) => o6._$AH;
  var h3 = (o6) => {
    o6._$AR(), o6._$AA.remove();
  };

  // node_modules/lit-html/directives/repeat.js
  var u4 = (e7, s5, t6) => {
    const r6 = /* @__PURE__ */ new Map();
    for (let l3 = s5; l3 <= t6; l3++) r6.set(e7[l3], l3);
    return r6;
  };
  var c4 = e6(class extends i5 {
    constructor(e7) {
      if (super(e7), e7.type !== t4.CHILD) throw Error("repeat() can only be used in text expressions");
    }
    dt(e7, s5, t6) {
      let r6;
      void 0 === t6 ? t6 = s5 : void 0 !== s5 && (r6 = s5);
      const l3 = [], o6 = [];
      let i7 = 0;
      for (const s6 of e7) l3[i7] = r6 ? r6(s6, i7) : i7, o6[i7] = t6(s6, i7), i7++;
      return { values: o6, keys: l3 };
    }
    render(e7, s5, t6) {
      return this.dt(e7, s5, t6).values;
    }
    update(s5, [t6, r6, c5]) {
      const d3 = M2(s5), { values: p4, keys: a3 } = this.dt(t6, r6, c5);
      if (!Array.isArray(d3)) return this.ut = a3, p4;
      const h4 = this.ut ??= [], v3 = [];
      let m3, y3, x2 = 0, j2 = d3.length - 1, k2 = 0, w2 = p4.length - 1;
      for (; x2 <= j2 && k2 <= w2; ) if (null === d3[x2]) x2++;
      else if (null === d3[j2]) j2--;
      else if (h4[x2] === a3[k2]) v3[k2] = u3(d3[x2], p4[k2]), x2++, k2++;
      else if (h4[j2] === a3[w2]) v3[w2] = u3(d3[j2], p4[w2]), j2--, w2--;
      else if (h4[x2] === a3[w2]) v3[w2] = u3(d3[x2], p4[w2]), v2(s5, v3[w2 + 1], d3[x2]), x2++, w2--;
      else if (h4[j2] === a3[k2]) v3[k2] = u3(d3[j2], p4[k2]), v2(s5, d3[x2], d3[j2]), j2--, k2++;
      else if (void 0 === m3 && (m3 = u4(a3, k2, w2), y3 = u4(h4, x2, j2)), m3.has(h4[x2])) if (m3.has(h4[j2])) {
        const e7 = y3.get(a3[k2]), t7 = void 0 !== e7 ? d3[e7] : null;
        if (null === t7) {
          const e8 = v2(s5, d3[x2]);
          u3(e8, p4[k2]), v3[k2] = e8;
        } else v3[k2] = u3(t7, p4[k2]), v2(s5, d3[x2], t7), d3[e7] = null;
        k2++;
      } else h3(d3[j2]), j2--;
      else h3(d3[x2]), x2++;
      for (; k2 <= w2; ) {
        const e7 = v2(s5, v3[w2 + 1]);
        u3(e7, p4[k2]), v3[k2++] = e7;
      }
      for (; x2 <= j2; ) {
        const e7 = d3[x2++];
        null !== e7 && h3(e7);
      }
      return this.ut = a3, p3(s5, v3), E;
    }
  });

  // frontend-devtools/core/persistence-storage.ts
  var StorageKeys = {
    DEVTOOLS_ENABLED: "FRONTEND_DEVTOOLS_ENABLED",
    ACTIVE_WIDGETS: "FRONTEND_DEVTOOLS_ACTIVE_WIDGETS",
    MUTATION_SCAN_ACTIVE: "FRONTEND_DEVTOOLS_MUTATION_SCAN_ACTIVE",
    PANEL_POSITION: "FRONTEND_DEVTOOLS_PANEL_POSITION",
    COMPONENT_TREE_SIZE: "FRONTEND_DEVTOOLS_COMPONENT_TREE_SIZE",
    COMPONENT_TREE_POSITION: "FRONTEND_DEVTOOLS_COMPONENT_TREE_POSITION"
  };
  var PersistenceStorage = class {
    get(key) {
      return localStorage.getItem(key);
    }
    set(key, value) {
      localStorage.setItem(key, value);
    }
    remove(key) {
      localStorage.removeItem(key);
    }
    getBoolean(key) {
      return this.get(key) === "true";
    }
    setBoolean(key, value) {
      this.set(key, String(value));
    }
    getArray(key) {
      const value = this.get(key);
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    setArray(key, value) {
      this.set(key, JSON.stringify(value));
    }
  };
  var persistenceStorage = new PersistenceStorage();

  // frontend-devtools/ui/fd-button.ts
  var FdButton = class extends i4 {
    constructor() {
      super(...arguments);
      this.size = "default";
      this.disabled = false;
      this.active = false;
      this.label = "";
      this.tooltip = "";
    }
    _handleClick(e7) {
      if (this.disabled) {
        e7.preventDefault();
        e7.stopPropagation();
        return;
      }
    }
    render() {
      const ariaLabel = this.label || this.tooltip || void 0;
      return b2`
      <button
        class="devtools-btn"
        ?disabled=${this.disabled}
        aria-label=${ariaLabel ?? ""}
        title=${this.tooltip}
        @click=${this._handleClick}
        part="button"
      >
        <slot></slot>
      </button>
    `;
    }
  };
  FdButton.styles = i`
    :host {
      display: inline-flex;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    .devtools-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
      padding: 4px 10px;
      font-size: 12px;
      height: 26px;
    }

    /* ===== Base styles ===== */
    .devtools-btn {
      background: transparent;
      color: var(--fd-text-muted);
      box-shadow: none;
    }

    .devtools-btn:hover {
      background: var(--fd-bg-hover);
      color: var(--fd-text-primary);
    }

    :host([active]) .devtools-btn {
      color: var(--fd-primary);
    }

    :host([active]) .devtools-btn:hover {
      color: var(--fd-primary-hover);
    }

    /* ===== Small size ===== */
    :host([size='sm']) .devtools-btn {
      padding: 2px 6px;
      font-size: 11px;
      height: 22px;
      gap: 4px;
    }

    /* ===== Icon size ===== */
    :host([size='icon']) .devtools-btn {
      padding: 0;
      border-radius: 4px;
      width: 26px;
      height: 26px;
    }

    /* ===== Focus states ===== */
    .devtools-btn:focus {
      outline: none;
    }

    .devtools-btn:focus-visible {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }

    /* ===== Icon sizing ===== */
    ::slotted(svg),
    ::slotted(fd-icon) {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }
  `;
  __decorateClass([
    n4({ type: String, reflect: true })
  ], FdButton.prototype, "size", 2);
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdButton.prototype, "disabled", 2);
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdButton.prototype, "active", 2);
  __decorateClass([
    n4({ type: String })
  ], FdButton.prototype, "label", 2);
  __decorateClass([
    n4({ type: String })
  ], FdButton.prototype, "tooltip", 2);
  FdButton = __decorateClass([
    t3("fd-button")
  ], FdButton);

  // frontend-devtools/ui/fd-laminar-component-tree.ts
  var CHEVRON_DOWN = w`<path d="m6 9 6 6 6-6"/>`;
  var CHEVRON_RIGHT = w`<path d="m9 18 6-6-6-6"/>`;
  var DEFAULT_PANEL_WIDTH = 500;
  var DEFAULT_PANEL_HEIGHT = 400;
  var MIN_PANEL_WIDTH = 300;
  var MIN_PANEL_HEIGHT = 200;
  var MAX_PANEL_WIDTH_RATIO = 0.9;
  var MAX_PANEL_HEIGHT_RATIO = 0.9;
  var FdLaminarComponentTree = class extends i4 {
    constructor() {
      super(...arguments);
      this.open = false;
      this._treeData = [];
      this._focusedIndex = 0;
      this._posX = 0;
      this._posY = 0;
      this._isDragging = false;
      this._autoRefresh = false;
      this._isRefreshing = false;
      this._panelWidth = DEFAULT_PANEL_WIDTH;
      this._panelHeight = DEFAULT_PANEL_HEIGHT;
      this._isResizing = false;
      this._flattenedNodes = [];
      this._resizeDirection = null;
      this._resizeStartX = 0;
      this._resizeStartY = 0;
      this._resizeStartWidth = 0;
      this._resizeStartHeight = 0;
      this._autoRefreshInterval = null;
      this._refreshAnimationTimeoutId = null;
      this._nodeIdCounter = 0;
      this._dragStartX = 0;
      this._dragStartY = 0;
      this._dragStartPosX = 0;
      this._dragStartPosY = 0;
      this._handleHeaderPointerDown = (e7) => {
        if (e7.button !== 0) return;
        if (e7.target.closest("button")) return;
        e7.preventDefault();
        this._isDragging = true;
        this._dragStartX = e7.clientX;
        this._dragStartY = e7.clientY;
        this._dragStartPosX = this._posX;
        this._dragStartPosY = this._posY;
        document.addEventListener("pointermove", this._handlePointerMove);
        document.addEventListener("pointerup", this._handlePointerUp);
      };
      this._handlePointerMove = (e7) => {
        if (!this._isDragging) return;
        const deltaX = e7.clientX - this._dragStartX;
        const deltaY = e7.clientY - this._dragStartY;
        const newX = this._dragStartPosX + deltaX;
        const newY = this._dragStartPosY + deltaY;
        const clamped = this._clampPosition(newX, newY);
        this._posX = clamped.x;
        this._posY = clamped.y;
      };
      this._handlePointerUp = () => {
        this._isDragging = false;
        document.removeEventListener("pointermove", this._handlePointerMove);
        document.removeEventListener("pointerup", this._handlePointerUp);
        this._savePanelPosition();
      };
      this._handleResizePointerDown = (direction) => (e7) => {
        if (e7.button !== 0) return;
        e7.preventDefault();
        e7.stopPropagation();
        this._isResizing = true;
        this._resizeDirection = direction;
        this._resizeStartX = e7.clientX;
        this._resizeStartY = e7.clientY;
        this._resizeStartWidth = this._panelWidth;
        this._resizeStartHeight = this._panelHeight;
        document.addEventListener("pointermove", this._handleResizePointerMove);
        document.addEventListener("pointerup", this._handleResizePointerUp);
      };
      this._handleResizePointerMove = (e7) => {
        if (!this._isResizing || !this._resizeDirection) return;
        const deltaX = e7.clientX - this._resizeStartX;
        const deltaY = e7.clientY - this._resizeStartY;
        const maxWidth = window.innerWidth * MAX_PANEL_WIDTH_RATIO;
        const maxHeight = window.innerHeight * MAX_PANEL_HEIGHT_RATIO;
        if (this._resizeDirection === "e" || this._resizeDirection === "se") {
          const newWidth = this._resizeStartWidth + deltaX;
          this._panelWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth));
        }
        if (this._resizeDirection === "s" || this._resizeDirection === "se") {
          const newHeight = this._resizeStartHeight + deltaY;
          this._panelHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(newHeight, maxHeight));
        }
      };
      this._handleResizePointerUp = () => {
        this._isResizing = false;
        this._resizeDirection = null;
        this._savePanelSize();
        document.removeEventListener("pointermove", this._handleResizePointerMove);
        document.removeEventListener("pointerup", this._handleResizePointerUp);
      };
      /**
       * Handle keyboard events for tree navigation.
       * Returns true if the event was handled.
       */
      this._handleKeyboardEvent = (e7) => {
        if (!this.open) return false;
        if (this._flattenedNodes.length === 0) return false;
        switch (e7.key) {
          case "Escape":
            e7.preventDefault();
            e7.stopPropagation();
            this._close();
            return true;
          case "ArrowUp":
            e7.preventDefault();
            e7.stopPropagation();
            this._focusedIndex = Math.max(0, this._focusedIndex - 1);
            this._onFocusChange();
            return true;
          case "ArrowDown":
            e7.preventDefault();
            e7.stopPropagation();
            this._focusedIndex = Math.min(this._flattenedNodes.length - 1, this._focusedIndex + 1);
            this._onFocusChange();
            return true;
          case "ArrowLeft":
            e7.preventDefault();
            e7.stopPropagation();
            this._collapseOrNavigateUp();
            return true;
          case "ArrowRight":
            e7.preventDefault();
            e7.stopPropagation();
            this._expandOrNavigateDown();
            return true;
          case "Enter":
            e7.preventDefault();
            e7.stopPropagation();
            this._openInIDE(this._focusedIndex);
            return true;
          default:
            return false;
        }
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this.setAttribute("popover", "manual");
      this._loadPanelSize();
    }
    _loadPanelSize() {
      const stored = persistenceStorage.get(StorageKeys.COMPONENT_TREE_SIZE);
      if (stored) {
        try {
          const { width, height } = JSON.parse(stored);
          this._panelWidth = Math.max(MIN_PANEL_WIDTH, Math.min(width, window.innerWidth * MAX_PANEL_WIDTH_RATIO));
          this._panelHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(height, window.innerHeight * MAX_PANEL_HEIGHT_RATIO));
        } catch {
        }
      }
    }
    _savePanelSize() {
      persistenceStorage.set(
        StorageKeys.COMPONENT_TREE_SIZE,
        JSON.stringify({ width: this._panelWidth, height: this._panelHeight })
      );
    }
    _loadPanelPosition() {
      const stored = persistenceStorage.get(StorageKeys.COMPONENT_TREE_POSITION);
      if (stored) {
        try {
          const { xPercent, yPercent } = JSON.parse(stored);
          const x2 = Math.round(xPercent * window.innerWidth);
          const y3 = Math.round(yPercent * window.innerHeight);
          const clamped = this._clampPosition(x2, y3);
          this._posX = clamped.x;
          this._posY = clamped.y;
          return true;
        } catch {
        }
      }
      return false;
    }
    _savePanelPosition() {
      const xPercent = this._posX / window.innerWidth;
      const yPercent = this._posY / window.innerHeight;
      persistenceStorage.set(
        StorageKeys.COMPONENT_TREE_POSITION,
        JSON.stringify({ xPercent, yPercent })
      );
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unregisterKeyboardHandlers();
      this._stopAutoRefresh();
      this._cancelRefreshAnimation();
      this._treeData = [];
      this._flattenedNodes = [];
    }
    _cancelRefreshAnimation() {
      if (this._refreshAnimationTimeoutId) {
        clearTimeout(this._refreshAnimationTimeoutId);
        this._refreshAnimationTimeoutId = null;
      }
    }
    // Use willUpdate instead of updated to avoid "change in update" warning.
    // willUpdate runs before render and state changes here don't trigger a new update cycle.
    willUpdate(changedProperties) {
      if (changedProperties.has("open")) {
        if (this.open) {
          this._prepareShow();
        } else {
          this._prepareHide();
        }
      }
    }
    updated(changedProperties) {
      if (changedProperties.has("open") && this.open) {
        this._afterShow();
      }
    }
    // State changes that need to happen before render (no async, no DOM access)
    _prepareShow() {
      this._buildTree();
      this._focusedIndex = 0;
      if (!this._loadPanelPosition()) {
        this._centerPanel();
      }
      this._registerKeyboardHandlers();
    }
    _registerKeyboardHandlers() {
      keyboardManager.register(
        "laminar-tree:navigation",
        (e7) => this._handleKeyboardEvent(e7),
        KeyboardPriority.PANEL
      );
    }
    _unregisterKeyboardHandlers() {
      keyboardManager.unregister("laminar-tree:navigation");
    }
    // DOM operations that need to happen after render
    _afterShow() {
      try {
        this.showPopover();
      } catch {
      }
      void this.updateComplete.then(() => {
        this._focusTreeContainer();
        this._dispatchFocusChange();
      });
    }
    // State changes for hiding (run before render in willUpdate)
    _prepareHide() {
      this._unregisterKeyboardHandlers();
      try {
        this.hidePopover();
      } catch {
      }
      this._stopAutoRefresh();
      this._autoRefresh = false;
      this._treeData = [];
      this._flattenedNodes = [];
    }
    _toggleAutoRefresh() {
      this._autoRefresh = !this._autoRefresh;
      if (this._autoRefresh) {
        this._refreshTree();
        this._startAutoRefresh();
      } else {
        this._stopAutoRefresh();
      }
    }
    _startAutoRefresh() {
      this._stopAutoRefresh();
      this._autoRefreshInterval = setInterval(() => {
        this._refreshTree();
      }, 5e3);
    }
    _stopAutoRefresh() {
      if (this._autoRefreshInterval) {
        clearInterval(this._autoRefreshInterval);
        this._autoRefreshInterval = null;
      }
    }
    _refreshTree() {
      this._isRefreshing = true;
      const currentFocusedItem = this._flattenedNodes[this._focusedIndex];
      const currentFocusedElement = currentFocusedItem?.node.element;
      this._buildTree();
      if (currentFocusedElement) {
        const newIndex = this._flattenedNodes.findIndex(
          (item) => item.node.element === currentFocusedElement
        );
        if (newIndex !== -1) {
          this._focusedIndex = newIndex;
        }
      }
      this._cancelRefreshAnimation();
      this._refreshAnimationTimeoutId = setTimeout(() => {
        this._isRefreshing = false;
        this._refreshAnimationTimeoutId = null;
      }, 500);
    }
    _dispatchFocusChange() {
      const item = this._flattenedNodes[this._focusedIndex];
      if (!item) return;
      this.dispatchEvent(
        new CustomEvent("focus-change", {
          detail: { element: item.node.element, name: item.node.name, index: this._focusedIndex },
          bubbles: true,
          composed: true
        })
      );
    }
    _centerPanel() {
      this._posX = Math.round((window.innerWidth - this._panelWidth) / 2);
      this._posY = Math.round((window.innerHeight - this._panelHeight) / 2);
    }
    _clampPosition(x2, y3) {
      const panelHeight = this.offsetHeight || this._panelHeight;
      const panelWidth = this.offsetWidth || this._panelWidth;
      const margin = 8;
      const clampedX = Math.max(margin, Math.min(x2, window.innerWidth - panelWidth - margin));
      const clampedY = Math.max(margin, Math.min(y3, window.innerHeight - panelHeight - margin));
      return { x: clampedX, y: clampedY };
    }
    _focusTreeContainer() {
      const container = this.shadowRoot?.querySelector(".tree-container");
      container?.focus();
    }
    _generateNodeId() {
      return `node-${this._nodeIdCounter++}`;
    }
    _buildTree() {
      this._nodeIdCounter = 0;
      const attr = CONFIG.attributes.scalaComponent;
      const allElements = Array.from(document.querySelectorAll(`[${attr}]`));
      const devtoolsAttr = CONFIG.attributes.devtools;
      const scalaElements = allElements.filter(
        (el) => !el.hasAttribute(devtoolsAttr) && !el.closest(`[${devtoolsAttr}]`)
      );
      const rootNodes = [];
      const nodeMap = /* @__PURE__ */ new Map();
      for (const el of scalaElements) {
        const node = {
          id: this._generateNodeId(),
          element: el,
          name: el.getAttribute(attr) || "Unknown",
          children: [],
          expanded: true,
          depth: 0
        };
        nodeMap.set(el, node);
      }
      for (const el of scalaElements) {
        const node = nodeMap.get(el);
        const parentScalaEl = el.parentElement?.closest(`[${attr}]`);
        if (parentScalaEl && nodeMap.has(parentScalaEl)) {
          const parentNode = nodeMap.get(parentScalaEl);
          parentNode.children.push(node);
          node.depth = parentNode.depth + 1;
        } else {
          rootNodes.push(node);
        }
      }
      this._treeData = rootNodes;
      this._updateFlattenedNodes();
    }
    _updateFlattenedNodes() {
      const flattened = [];
      const traverse = (nodes, ancestorLines) => {
        const lastIndex = nodes.length - 1;
        nodes.forEach((node, idx) => {
          const isLast = idx === lastIndex;
          flattened.push({
            node,
            isLast,
            ancestorLines: [...ancestorLines]
          });
          if (node.expanded && node.children.length > 0) {
            traverse(node.children, [...ancestorLines, !isLast]);
          }
        });
      };
      traverse(this._treeData, []);
      this._flattenedNodes = flattened;
      if (this._focusedIndex >= this._flattenedNodes.length) {
        this._focusedIndex = Math.max(0, this._flattenedNodes.length - 1);
      }
    }
    _onFocusChange() {
      this._scrollToFocused();
      this._dispatchFocusChange();
    }
    _scrollToFocused() {
      void this.updateComplete.then(() => {
        const focusedEl = this.shadowRoot?.querySelector(`[data-index="${this._focusedIndex}"]`);
        focusedEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
    _toggleNode(index) {
      const item = this._flattenedNodes[index];
      if (!item || item.node.children.length === 0) return;
      item.node.expanded = !item.node.expanded;
      this._updateFlattenedNodes();
      this.requestUpdate();
    }
    _collapseOrNavigateUp() {
      const item = this._flattenedNodes[this._focusedIndex];
      if (!item) return;
      const node = item.node;
      if (node.expanded && node.children.length > 0) {
        node.expanded = false;
        this._updateFlattenedNodes();
        this.requestUpdate();
      } else if (node.depth > 0) {
        const parentIndex = this._findParentIndex(this._focusedIndex);
        if (parentIndex !== -1) {
          this._focusedIndex = parentIndex;
          this._onFocusChange();
        }
      }
    }
    _expandOrNavigateDown() {
      const item = this._flattenedNodes[this._focusedIndex];
      if (!item) return;
      const node = item.node;
      if (node.children.length > 0) {
        if (!node.expanded) {
          node.expanded = true;
          this._updateFlattenedNodes();
          this.requestUpdate();
        } else {
          this._focusedIndex = Math.min(this._flattenedNodes.length - 1, this._focusedIndex + 1);
          this._onFocusChange();
        }
      }
    }
    _findParentIndex(index) {
      const item = this._flattenedNodes[index];
      if (!item || item.node.depth === 0) return -1;
      for (let i7 = index - 1; i7 >= 0; i7--) {
        if (this._flattenedNodes[i7].node.depth === item.node.depth - 1) {
          return i7;
        }
      }
      return -1;
    }
    _expandAll() {
      const setExpanded = (nodes, expanded) => {
        for (const node of nodes) {
          node.expanded = expanded;
          if (node.children.length > 0) {
            setExpanded(node.children, expanded);
          }
        }
      };
      setExpanded(this._treeData, true);
      this._updateFlattenedNodes();
      this.requestUpdate();
    }
    _collapseAll() {
      const setExpanded = (nodes, expanded) => {
        for (const node of nodes) {
          node.expanded = expanded;
          if (node.children.length > 0) {
            setExpanded(node.children, expanded);
          }
        }
      };
      setExpanded(this._treeData, false);
      this._updateFlattenedNodes();
      this.requestUpdate();
    }
    _openInIDE(index) {
      const item = this._flattenedNodes[index];
      if (!item) return;
      const info = getComponentSourceInfo(item.node.element);
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine);
      }
      this._highlightElement(item.node.element);
    }
    _highlightElement(element) {
      const rect = element.getBoundingClientRect();
      const highlight = document.createElement("div");
      highlight.setAttribute(CONFIG.attributes.devtools, "tree-highlight");
      Object.assign(highlight.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: "rgba(142, 97, 227, 0.3)",
        border: "2px solid rgba(142, 97, 227, 0.8)",
        borderRadius: "4px",
        pointerEvents: "none",
        zIndex: "2147483646",
        transition: "opacity 0.3s ease-out"
      });
      document.body.appendChild(highlight);
      setTimeout(() => {
        highlight.style.opacity = "0";
        setTimeout(() => highlight.remove(), 300);
      }, 500);
    }
    /**
     * Public method to focus on a specific element in the tree.
     * Called by the inspector when hovering over components.
     */
    focusOnElement(element) {
      if (!this.open) return;
      let index = this._flattenedNodes.findIndex((item) => item.node.element === element);
      if (index === -1) {
        const expanded = this._expandToElement(element);
        if (expanded) {
          this._updateFlattenedNodes();
          this.requestUpdate();
          index = this._flattenedNodes.findIndex((item) => item.node.element === element);
        }
      }
      if (index !== -1 && index !== this._focusedIndex) {
        this._focusedIndex = index;
        this._scrollToFocused();
      }
    }
    _expandToElement(element) {
      const findAndExpand = (nodes) => {
        for (const node of nodes) {
          if (node.element === element) {
            return true;
          }
          if (node.children.length > 0) {
            const found = findAndExpand(node.children);
            if (found) {
              node.expanded = true;
              return true;
            }
          }
        }
        return false;
      };
      return findAndExpand(this._treeData);
    }
    _close() {
      this._stopAutoRefresh();
      this._autoRefresh = false;
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("close", {
          bubbles: true,
          composed: true
        })
      );
    }
    _handleItemClick(index, e7) {
      const prevIndex = this._focusedIndex;
      this._focusedIndex = index;
      const target = e7.target;
      if (target.classList.contains("toggle")) {
        this._toggleNode(index);
      }
      if (prevIndex !== index) {
        this._dispatchFocusChange();
      }
    }
    _handleItemDblClick(index) {
      this._openInIDE(index);
    }
    _renderGuideLines(item) {
      const { node, isLast, ancestorLines } = item;
      if (node.depth === 0) {
        return A;
      }
      const guides = [];
      for (let i7 = 0; i7 < ancestorLines.length; i7++) {
        const hasLine = ancestorLines[i7];
        guides.push(b2`<span class="guide-line">${hasLine ? "\u2502" : " "}</span>`);
      }
      const connector = isLast ? "\u2514" : "\u251C";
      guides.push(b2`<span class="guide-line connector">${connector}</span>`);
      return guides;
    }
    _renderToggleIcon(hasChildren, expanded) {
      if (!hasChildren) {
        return b2`<span class="toggle-placeholder">─</span>`;
      }
      return b2`
      <svg
        class="toggle-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${expanded ? CHEVRON_DOWN : CHEVRON_RIGHT}
      </svg>
    `;
    }
    _renderTreeItem(item, index) {
      const { node } = item;
      const isFocused = index === this._focusedIndex;
      const hasChildren = node.children.length > 0;
      return b2`
      <div
        class="tree-item ${isFocused ? "focused" : ""}"
        data-index=${index}
        @click=${(e7) => this._handleItemClick(index, e7)}
        @dblclick=${() => this._handleItemDblClick(index)}
      >
        <span class="guides">${this._renderGuideLines(item)}</span>
        <span
          class="toggle ${hasChildren ? "has-children" : ""}"
          @click=${(e7) => {
        if (hasChildren) {
          e7.stopPropagation();
          this._toggleNode(index);
        }
      }}
        >
          ${this._renderToggleIcon(hasChildren, node.expanded)}
        </span>
        <span class="name">${node.name}</span>
      </div>
    `;
    }
    _renderTree() {
      if (this._flattenedNodes.length === 0) {
        return b2`
        <div class="empty-state">
          No Laminar components found.<br />
          <span class="hint">Elements need <code>data-scala</code> attribute.</span>
        </div>
      `;
      }
      return b2`
      ${c4(
        this._flattenedNodes,
        (item) => item.node.id,
        (item, index) => this._renderTreeItem(item, index)
      )}
    `;
    }
    render() {
      if (!this.open) {
        return A;
      }
      return b2`
      <div
        class="panel ${this._isDragging ? "dragging" : ""} ${this._isResizing ? "resizing" : ""}"
        style="left: ${this._posX}px; top: ${this._posY}px; width: ${this._panelWidth}px; height: ${this._panelHeight}px;"
      >
        <div
          class="header"
          @pointerdown=${this._handleHeaderPointerDown}
        >
          <span class="title">Laminar Component Tree</span>
          <div class="actions">
            <button
              class="auto-refresh-btn ${this._autoRefresh ? "active" : ""}"
              title="Auto-refresh (5s)"
              @click=${this._toggleAutoRefresh}
            >
              <fd-icon
                name="refresh"
                class="${this._isRefreshing ? "spinning" : ""}"
                size=${14}
              ></fd-icon>
            </button>
            <fd-button size="sm" @click=${this._expandAll}>Expand All</fd-button>
            <fd-button size="sm" @click=${this._collapseAll}>Collapse All</fd-button>
            <fd-button size="sm" @click=${this._close}>✕</fd-button>
          </div>
        </div>
        <div
          class="tree-container"
          tabindex="0"
        >
          ${this._renderTree()}
        </div>
        <div class="footer">
          <span>↑↓ Navigate</span>
          <span>←→ Collapse/Expand</span>
          <span>Enter Open in IDE</span>
          <span>Esc Close</span>
        </div>
        <div class="resize-handle resize-e" @pointerdown=${this._handleResizePointerDown("e")}></div>
        <div class="resize-handle resize-s" @pointerdown=${this._handleResizePointerDown("s")}></div>
        <div class="resize-handle resize-se" @pointerdown=${this._handleResizePointerDown("se")}></div>
      </div>
    `;
    }
  };
  FdLaminarComponentTree.styles = [
    i`
      :host {
        /* No backdrop - allows interaction with page */
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        overflow: visible;

        opacity: 0.95;
      }

      :host::backdrop {
        /* Transparent backdrop */
        background: transparent;
      }

      .panel {
        position: fixed;
        background: var(--fd-bg-panel, #141414);
        border: 1px solid var(--fd-border-medium, rgba(255, 255, 255, 0.15));
        border-radius: 8px;
        box-shadow: var(--fd-shadow-panel, 0 4px 12px rgba(0, 0, 0, 0.3));
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: var(--fd-font, system-ui, -apple-system, sans-serif);
        font-size: 13px;
        color: var(--fd-text-primary, #fff);
        z-index: 2147483647;
      }

      .panel.dragging,
      .panel.resizing {
        user-select: none;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--fd-border-subtle, rgba(255, 255, 255, 0.08));
        background: var(--fd-bg-elevated, #1a1a1a);
        cursor: grab;
      }

      .header:active {
        cursor: grabbing;
      }

      .title {
        font-weight: 600;
        font-size: 14px;
        user-select: none;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .auto-refresh-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--fd-text-muted, #999);
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .auto-refresh-btn:hover {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
        color: var(--fd-text-primary, #fff);
      }

      .auto-refresh-btn.active {
        color: var(--fd-primary, rgb(142, 97, 227));
      }

      .auto-refresh-btn.active:hover {
        color: var(--fd-primary-hover, rgb(162, 117, 247));
      }

      .auto-refresh-btn fd-icon.spinning {
        animation: spin 0.5s ease-in-out;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(-360deg);
        }
      }

      .tree-container {
        overflow-y: auto;
        flex: 1;
        padding: 8px 0;
        outline: none;
      }

      .tree-container:focus-visible {
        outline: none;
      }

      .tree-item {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        padding: 2px 12px;
        cursor: pointer;
        border-left: 2px solid transparent;
        height: 28px;
        white-space: nowrap;
        /* Performance optimization: skip rendering off-screen items */
        content-visibility: auto;
        contain-intrinsic-size: auto 28px;
      }

      .tree-item:hover {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
      }

      .tree-item.focused {
        background: var(--fd-primary-15, rgba(142, 97, 227, 0.15));
        border-left-color: var(--fd-primary, rgb(142, 97, 227));
      }

      .guides {
        display: flex;
        flex-shrink: 0;
      }

      .guide-line {
        display: inline-block;
        width: 16px;
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-faint, rgba(255, 255, 255, 0.3));
        text-align: center;
        user-select: none;
      }

      .guide-line.connector {
        color: var(--fd-text-muted, #999);
      }

      .toggle {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        flex-shrink: 0;
        color: var(--fd-text-muted, #999);
      }

      .toggle.has-children {
        cursor: pointer;
        color: var(--fd-text-secondary, #e0e0e0);
      }

      .toggle.has-children:hover {
        color: var(--fd-primary, rgb(142, 97, 227));
      }

      .toggle-icon {
        width: 14px;
        height: 14px;
      }

      .toggle-placeholder {
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-faint, rgba(255, 255, 255, 0.3));
      }

      .name {
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-secondary, #e0e0e0);
        margin-left: 4px;
      }

      .tree-item.focused .name {
        color: var(--fd-primary, rgb(142, 97, 227));
      }

      .tree-item.focused .guide-line.connector {
        color: var(--fd-primary-50, rgba(142, 97, 227, 0.5));
      }

      .empty-state {
        padding: 32px 16px;
        text-align: center;
        color: var(--fd-text-muted, #999);
      }

      .empty-state .hint {
        font-size: 11px;
      }

      .empty-state code {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
        padding: 2px 4px;
        border-radius: 3px;
        font-family: var(--fd-font-mono, monospace);
        font-size: 11px;
      }

      .footer {
        padding: 8px 16px;
        border-top: 1px solid var(--fd-border-subtle, rgba(255, 255, 255, 0.08));
        font-size: 11px;
        color: var(--fd-text-muted, #999);
        display: flex;
        gap: 16px;
        user-select: none;
      }

      /* Resize handles */
      .resize-handle {
        position: absolute;
        z-index: 1;
      }

      .resize-e {
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        cursor: ew-resize;
      }

      .resize-s {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 6px;
        cursor: ns-resize;
      }

      .resize-se {
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
      }

      .resize-e:hover,
      .resize-s:hover {
        background: var(--fd-primary-15, rgba(142, 97, 227, 0.15));
      }

      .resize-se::after {
        content: '';
        position: absolute;
        bottom: 3px;
        right: 3px;
        width: 10px;
        height: 10px;
        border: 2px solid var(--fd-text-muted, #999);
        border-top: none;
        border-left: none;
        border-bottom-right-radius: 6px;
        opacity: 0.5;
      }

      .resize-se:hover::after {
        border-color: var(--fd-primary, rgb(142, 97, 227));
        opacity: 1;
      }
    `
  ];
  __decorateClass([
    n4({ type: Boolean, reflect: true })
  ], FdLaminarComponentTree.prototype, "open", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_treeData", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_focusedIndex", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_posX", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_posY", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_isDragging", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_autoRefresh", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_isRefreshing", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_panelWidth", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_panelHeight", 2);
  __decorateClass([
    r5()
  ], FdLaminarComponentTree.prototype, "_isResizing", 2);
  FdLaminarComponentTree = __decorateClass([
    t3("fd-laminar-component-tree")
  ], FdLaminarComponentTree);

  // frontend-devtools/design-tokens.ts
  var designTokens = i`
  :host {
    /* Typography */
    --fd-font: system-ui, -apple-system, sans-serif;
    --fd-font-mono: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;

    /* Primary purple color */
    --fd-primary: rgb(142, 97, 227);
    --fd-primary-hover: rgb(159, 122, 240);
    --fd-primary-50: rgba(142, 97, 227, 0.5);
    --fd-primary-40: rgba(142, 97, 227, 0.4);
    --fd-primary-20: rgba(142, 97, 227, 0.2);
    --fd-primary-15: rgba(142, 97, 227, 0.15);
    --fd-primary-10: rgba(142, 97, 227, 0.1);

    /* Backgrounds */
    --fd-bg-solid: #000;
    --fd-bg-panel: #141414;
    --fd-bg-elevated: #1a1a1a;
    --fd-bg-hover: rgba(255, 255, 255, 0.1);

    /* Borders & Shadows */
    --fd-border-subtle: rgba(255, 255, 255, 0.08);
    --fd-border-medium: rgba(255, 255, 255, 0.15);
    --fd-shadow-panel: 0 4px 12px rgba(0, 0, 0, 0.3);
    --fd-inset-border-subtle: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    --fd-inset-border-medium: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
    --fd-inset-border-primary: inset 0 0 0 1px var(--fd-primary-40);

    /* Text colors */
    --fd-text-primary: #fff;
    --fd-text-secondary: #e0e0e0;
    --fd-text-muted: #999;
    --fd-text-faint: rgba(255, 255, 255, 0.3);

    /* Focus ring */
    --fd-focus-ring: 2px solid var(--fd-primary);

    /* Switch */
    --fd-switch-off: #525252;
    --fd-switch-knob: #fff;
    --fd-switch-knob-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    /* Semantic colors */
    --fd-success: #81c784;
    --fd-info: #64b5f6;
    --fd-info-bg: rgba(100, 181, 246, 0.15);
    --fd-info-bg-hover: rgba(100, 181, 246, 0.25);

    /* Chart colors */
    --fd-chart-grid: rgba(255, 255, 255, 0.06);
    --fd-chart-grid-major: rgba(255, 255, 255, 0.15);
    --fd-chart-label: rgba(255, 255, 255, 0.4);
    --fd-chart-fill: var(--fd-primary-20);
    --fd-chart-stroke: rgba(142, 97, 227, 0.8);

    /* Radar */
    --fd-radar-stroke: rgba(255, 255, 255, 0.85);
  }
`;

  // frontend-devtools/frontend-devtools.ts
  var DEFAULT_PANEL_POSITION = "bottom-right";
  var FrontendDevtools = class extends i4 {
    constructor() {
      super();
      this.enable = "true";
      this._inspectActive = false;
      this._mutationScanActive = false;
      this._laminarTreeActive = false;
      this._activeWidgets = [];
      this._panelPosition = DEFAULT_PANEL_POSITION;
      this._mutationScanActive = persistenceStorage.getBoolean(StorageKeys.MUTATION_SCAN_ACTIVE);
      this._activeWidgets = persistenceStorage.getArray(StorageKeys.ACTIVE_WIDGETS);
      this._panelPosition = persistenceStorage.get(StorageKeys.PANEL_POSITION) || DEFAULT_PANEL_POSITION;
    }
    get _isEnabled() {
      return this.enable === "true";
    }
    connectedCallback() {
      super.connectedCallback();
      this.setAttribute("data-frontend-devtools", "root");
      if (this._isEnabled) {
        this._registerKeyboardHandlers();
        keyboardManager.start();
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unregisterKeyboardHandlers();
      this._inspectActive = false;
    }
    _registerKeyboardHandlers() {
      keyboardManager.register(
        "global:toggle-inspect",
        (e7) => {
          if (e7.ctrlKey && e7.shiftKey && e7.key.toLowerCase() === "c") {
            e7.preventDefault();
            e7.stopPropagation();
            this._inspectActive = !this._inspectActive;
            return true;
          }
          return false;
        },
        KeyboardPriority.GLOBAL
      );
    }
    _unregisterKeyboardHandlers() {
      keyboardManager.unregister("global:toggle-inspect");
    }
    _handleDomMutationChange(e7) {
      this._mutationScanActive = e7.detail.checked;
      persistenceStorage.setBoolean(StorageKeys.MUTATION_SCAN_ACTIVE, e7.detail.checked);
    }
    _handleInspectChange(e7) {
      this._inspectActive = e7.detail.active;
    }
    _handleInspectorChange(e7) {
      this._inspectActive = e7.detail.active;
    }
    _handleLaminarTreeChange(e7) {
      this._laminarTreeActive = e7.detail.active;
    }
    _handleLaminarTreeClose() {
      this._laminarTreeActive = false;
    }
    _handleLaminarTreeFocusChange(e7) {
      if (this._inspectActive && this._inspector) {
        this._inspector.highlightElement(e7.detail.element, e7.detail.name);
      }
    }
    _handleInspectorHoverChange(e7) {
      if (this._laminarTreeActive && this._laminarTree && !e7.detail.isReact) {
        this._laminarTree.focusOnElement(e7.detail.element);
      }
    }
    _toggleWidget(widget, active) {
      if (active && !this._activeWidgets.includes(widget)) {
        this._activeWidgets = [...this._activeWidgets, widget];
      } else if (!active) {
        this._activeWidgets = this._activeWidgets.filter((w2) => w2 !== widget);
      }
      persistenceStorage.setArray(StorageKeys.ACTIVE_WIDGETS, this._activeWidgets);
    }
    _handleFpsChange(e7) {
      this._toggleWidget("LAG_RADAR", e7.detail.active);
    }
    _handleDomStatsChange(e7) {
      this._toggleWidget("DOM_STATS", e7.detail.active);
    }
    _handleMemChange(e7) {
      this._toggleWidget("MEM_CHART", e7.detail.active);
    }
    _handlePositionChange(e7) {
      this._panelPosition = e7.detail.position;
      persistenceStorage.set(StorageKeys.PANEL_POSITION, e7.detail.position);
    }
    _renderWidget(widget) {
      switch (widget) {
        case "LAG_RADAR":
          return b2`<fd-lag-radar></fd-lag-radar>`;
        case "DOM_STATS":
          return b2`<fd-dom-stats></fd-dom-stats>`;
        case "MEM_CHART":
          return b2`<fd-mem-chart></fd-mem-chart>`;
      }
    }
    render() {
      if (!this._isEnabled) {
        return null;
      }
      return b2`
      <fd-panel position=${this._panelPosition} @position-change=${this._handlePositionChange}>
        <fd-toolbar>
          <fd-inspect
            .active=${this._inspectActive}
            @change=${this._handleInspectChange}
          ></fd-inspect>
          <fd-switch
            title="Highlight DOM mutations"
            .checked=${this._mutationScanActive}
            @change=${this._handleDomMutationChange}
          ></fd-switch>
          <fd-fps
            .active=${this._activeWidgets.includes("LAG_RADAR")}
            @change=${this._handleFpsChange}
          ></fd-fps>
          <fd-mem
            .active=${this._activeWidgets.includes("MEM_CHART")}
            @change=${this._handleMemChange}
          ></fd-mem>
          <fd-toggle-icon-button
            tooltip="Show DOM Stats"
            .active=${this._activeWidgets.includes("DOM_STATS")}
            @change=${this._handleDomStatsChange}
          >
            <fd-icon name="domTree"></fd-icon>
          </fd-toggle-icon-button>
          <fd-toggle-icon-button
            tooltip="Laminar Component Tree"
            .active=${this._laminarTreeActive}
            @change=${this._handleLaminarTreeChange}
          >
            <fd-icon name="laminarTree"></fd-icon>
          </fd-toggle-icon-button>
        </fd-toolbar>
        ${this._activeWidgets.map((widget) => this._renderWidget(widget))}
      </fd-panel>
      ${this._mutationScanActive ? b2`<fd-mutation-canvas .active=${true}></fd-mutation-canvas>` : null}
      <fd-component-inspector
        .active=${this._inspectActive}
        @change=${this._handleInspectorChange}
        @hover-change=${this._handleInspectorHoverChange}
      ></fd-component-inspector>
      <fd-laminar-component-tree
        .open=${this._laminarTreeActive}
        @close=${this._handleLaminarTreeClose}
        @focus-change=${this._handleLaminarTreeFocusChange}
      ></fd-laminar-component-tree>
    `;
    }
  };
  FrontendDevtools.styles = [
    designTokens,
    i`
      :host {
        /* Prevent interference with parent layout */
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
        z-index: 2147483647; /* Max z-index */

        /* CSS containment - isolates from parent */
        contain: layout style;

        opacity: 0.95;
      }

      :host * {
        pointer-events: auto;
      }
    `
  ];
  __decorateClass([
    n4({ type: String, reflect: true })
  ], FrontendDevtools.prototype, "enable", 2);
  __decorateClass([
    r5()
  ], FrontendDevtools.prototype, "_inspectActive", 2);
  __decorateClass([
    r5()
  ], FrontendDevtools.prototype, "_mutationScanActive", 2);
  __decorateClass([
    r5()
  ], FrontendDevtools.prototype, "_laminarTreeActive", 2);
  __decorateClass([
    r5()
  ], FrontendDevtools.prototype, "_activeWidgets", 2);
  __decorateClass([
    r5()
  ], FrontendDevtools.prototype, "_panelPosition", 2);
  __decorateClass([
    e5("fd-component-inspector")
  ], FrontendDevtools.prototype, "_inspector", 2);
  __decorateClass([
    e5("fd-laminar-component-tree")
  ], FrontendDevtools.prototype, "_laminarTree", 2);
  FrontendDevtools = __decorateClass([
    t3("frontend-devtools")
  ], FrontendDevtools);

  // frontend-devtools-bootstrap.ts
  function getOrCreateDevtoolsElement() {
    const existing = document.querySelector("frontend-devtools");
    if (existing) {
      return existing;
    }
    const element = document.createElement("frontend-devtools");
    return element;
  }
  function appendDevtoolsElement(element) {
    if (!element.parentNode && document.body) {
      document.body.appendChild(element);
    }
  }
  function removeDevtoolsElement() {
    const element = document.querySelector("frontend-devtools");
    if (element?.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  var DevtoolsAPI = {
    enable() {
      persistenceStorage.setBoolean(StorageKeys.DEVTOOLS_ENABLED, true);
      const element = getOrCreateDevtoolsElement();
      element.setAttribute("enable", "true");
      appendDevtoolsElement(element);
      console.log("Devtools enabled.");
    },
    disable() {
      persistenceStorage.setBoolean(StorageKeys.DEVTOOLS_ENABLED, false);
      removeDevtoolsElement();
      console.log("Devtools disabled.");
    },
    isEnabled() {
      return persistenceStorage.getBoolean(StorageKeys.DEVTOOLS_ENABLED);
    }
  };
  window.Devtools = DevtoolsAPI;
  function initializeDevtools() {
    if (DevtoolsAPI.isEnabled()) {
      const element = getOrCreateDevtoolsElement();
      element.setAttribute("enable", "true");
      appendDevtoolsElement(element);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDevtools, { once: true });
  } else {
    initializeDevtools();
  }
})();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
@lit/reactive-element/decorators/custom-element.js:
@lit/reactive-element/decorators/property.js:
@lit/reactive-element/decorators/state.js:
@lit/reactive-element/decorators/event-options.js:
@lit/reactive-element/decorators/base.js:
@lit/reactive-element/decorators/query.js:
@lit/reactive-element/decorators/query-all.js:
@lit/reactive-element/decorators/query-async.js:
@lit/reactive-element/decorators/query-assigned-nodes.js:
lit-html/directive.js:
lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
