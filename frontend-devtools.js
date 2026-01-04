var __legacyDecorateClassTS = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1;i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

// node_modules/@lit/reactive-element/development/css-tag.js
var NODE_MODE = false;
var global = globalThis;
var supportsAdoptingStyleSheets = global.ShadowRoot && (global.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var constructionToken = Symbol();
var cssTagCache = new WeakMap;

class CSSResult {
  constructor(cssText, strings, safeToken) {
    this["_$cssResult$"] = true;
    if (safeToken !== constructionToken) {
      throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    }
    this.cssText = cssText;
    this._strings = strings;
  }
  get styleSheet() {
    let styleSheet = this._styleSheet;
    const strings = this._strings;
    if (supportsAdoptingStyleSheets && styleSheet === undefined) {
      const cacheable = strings !== undefined && strings.length === 1;
      if (cacheable) {
        styleSheet = cssTagCache.get(strings);
      }
      if (styleSheet === undefined) {
        (this._styleSheet = styleSheet = new CSSStyleSheet).replaceSync(this.cssText);
        if (cacheable) {
          cssTagCache.set(strings, styleSheet);
        }
      }
    }
    return styleSheet;
  }
  toString() {
    return this.cssText;
  }
}
var textFromCSSResult = (value) => {
  if (value["_$cssResult$"] === true) {
    return value.cssText;
  } else if (typeof value === "number") {
    return value;
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ` + `${value}. Use 'unsafeCSS' to pass non-literal values, but take care ` + `to ensure page security.`);
  }
};
var unsafeCSS = (value) => new CSSResult(typeof value === "string" ? value : String(value), undefined, constructionToken);
var css = (strings, ...values) => {
  const cssText = strings.length === 1 ? strings[0] : values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, strings, constructionToken);
};
var adoptStyles = (renderRoot, styles) => {
  if (supportsAdoptingStyleSheets) {
    renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  } else {
    for (const s of styles) {
      const style = document.createElement("style");
      const nonce = global["litNonce"];
      if (nonce !== undefined) {
        style.setAttribute("nonce", nonce);
      }
      style.textContent = s.cssText;
      renderRoot.appendChild(style);
    }
  }
};
var cssResultFromStyleSheet = (sheet) => {
  let cssText = "";
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};
var getCompatibleStyle = supportsAdoptingStyleSheets || NODE_MODE && global.CSSStyleSheet === undefined ? (s) => s : (s) => s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;

// node_modules/@lit/reactive-element/development/reactive-element.js
var { is, defineProperty, getOwnPropertyDescriptor, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf } = Object;
var NODE_MODE2 = false;
var global2 = globalThis;
if (NODE_MODE2) {
  global2.customElements ??= customElements;
}
var DEV_MODE = true;
var issueWarning;
var trustedTypes = global2.trustedTypes;
var emptyStringForBooleanAttribute = trustedTypes ? trustedTypes.emptyScript : "";
var polyfillSupport = DEV_MODE ? global2.reactiveElementPolyfillSupportDevMode : global2.reactiveElementPolyfillSupport;
if (DEV_MODE) {
  global2.litIssuedWarnings ??= new Set;
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!global2.litIssuedWarnings.has(warning) && !global2.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global2.litIssuedWarnings.add(warning);
    }
  };
  queueMicrotask(() => {
    issueWarning("dev-mode", `Lit is in dev mode. Not recommended for production!`);
    if (global2.ShadyDOM?.inUse && polyfillSupport === undefined) {
      issueWarning("polyfill-support-missing", `Shadow DOM is being polyfilled via \`ShadyDOM\` but ` + `the \`polyfill-support\` module has not been loaded.`);
    }
  });
}
var debugLogEvent = DEV_MODE ? (event) => {
  const shouldEmit = global2.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global2.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : undefined;
var JSCompiler_renameProperty = (prop, _obj) => prop;
var defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        value = value ? emptyStringForBooleanAttribute : null;
        break;
      case Object:
      case Array:
        value = value == null ? value : JSON.stringify(value);
        break;
    }
    return value;
  },
  fromAttribute(value, type) {
    let fromValue = value;
    switch (type) {
      case Boolean:
        fromValue = value !== null;
        break;
      case Number:
        fromValue = value === null ? null : Number(value);
        break;
      case Object:
      case Array:
        try {
          fromValue = JSON.parse(value);
        } catch (e) {
          fromValue = null;
        }
        break;
    }
    return fromValue;
  }
};
var notEqual = (value, old) => !is(value, old);
var defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  useDefault: false,
  hasChanged: notEqual
};
Symbol.metadata ??= Symbol("metadata");
global2.litPropertyMetadata ??= new WeakMap;

class ReactiveElement extends HTMLElement {
  static addInitializer(initializer) {
    this.__prepare();
    (this._initializers ??= []).push(initializer);
  }
  static get observedAttributes() {
    this.finalize();
    return this.__attributeToPropertyMap && [...this.__attributeToPropertyMap.keys()];
  }
  static createProperty(name, options = defaultPropertyDeclaration) {
    if (options.state) {
      options.attribute = false;
    }
    this.__prepare();
    if (this.prototype.hasOwnProperty(name)) {
      options = Object.create(options);
      options.wrapped = true;
    }
    this.elementProperties.set(name, options);
    if (!options.noAccessor) {
      const key = DEV_MODE ? Symbol.for(`${String(name)} (@property() cache)`) : Symbol();
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== undefined) {
        defineProperty(this.prototype, name, descriptor);
      }
    }
  }
  static getPropertyDescriptor(name, key, options) {
    const { get, set } = getOwnPropertyDescriptor(this.prototype, name) ?? {
      get() {
        return this[key];
      },
      set(v) {
        this[key] = v;
      }
    };
    if (DEV_MODE && get == null) {
      if ("value" in (getOwnPropertyDescriptor(this.prototype, name) ?? {})) {
        throw new Error(`Field ${JSON.stringify(String(name))} on ` + `${this.name} was declared as a reactive property ` + `but it's actually declared as a value on the prototype. ` + `Usually this is due to using @property or @state on a method.`);
      }
      issueWarning("reactive-property-without-getter", `Field ${JSON.stringify(String(name))} on ` + `${this.name} was declared as a reactive property ` + `but it does not have a getter. This will be an error in a ` + `future version of Lit.`);
    }
    return {
      get,
      set(value) {
        const oldValue = get?.call(this);
        set?.call(this, value);
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }
  static getPropertyOptions(name) {
    return this.elementProperties.get(name) ?? defaultPropertyDeclaration;
  }
  static __prepare() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("elementProperties", this))) {
      return;
    }
    const superCtor = getPrototypeOf(this);
    superCtor.finalize();
    if (superCtor._initializers !== undefined) {
      this._initializers = [...superCtor._initializers];
    }
    this.elementProperties = new Map(superCtor.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("finalized", this))) {
      return;
    }
    this.finalized = true;
    this.__prepare();
    if (this.hasOwnProperty(JSCompiler_renameProperty("properties", this))) {
      const props = this.properties;
      const propKeys = [
        ...getOwnPropertyNames(props),
        ...getOwnPropertySymbols(props)
      ];
      for (const p of propKeys) {
        this.createProperty(p, props[p]);
      }
    }
    const metadata = this[Symbol.metadata];
    if (metadata !== null) {
      const properties = litPropertyMetadata.get(metadata);
      if (properties !== undefined) {
        for (const [p, options] of properties) {
          this.elementProperties.set(p, options);
        }
      }
    }
    this.__attributeToPropertyMap = new Map;
    for (const [p, options] of this.elementProperties) {
      const attr = this.__attributeNameForProperty(p, options);
      if (attr !== undefined) {
        this.__attributeToPropertyMap.set(attr, p);
      }
    }
    this.elementStyles = this.finalizeStyles(this.styles);
    if (DEV_MODE) {
      if (this.hasOwnProperty("createProperty")) {
        issueWarning("no-override-create-property", "Overriding ReactiveElement.createProperty() is deprecated. " + "The override will not be called with standard decorators");
      }
      if (this.hasOwnProperty("getPropertyDescriptor")) {
        issueWarning("no-override-get-property-descriptor", "Overriding ReactiveElement.getPropertyDescriptor() is deprecated. " + "The override will not be called with standard decorators");
      }
    }
  }
  static finalizeStyles(styles) {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      const set = new Set(styles.flat(Infinity).reverse());
      for (const s of set) {
        elementStyles.unshift(getCompatibleStyle(s));
      }
    } else if (styles !== undefined) {
      elementStyles.push(getCompatibleStyle(styles));
    }
    return elementStyles;
  }
  static __attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? undefined : typeof attribute === "string" ? attribute : typeof name === "string" ? name.toLowerCase() : undefined;
  }
  constructor() {
    super();
    this.__instanceProperties = undefined;
    this.isUpdatePending = false;
    this.hasUpdated = false;
    this.__reflectingProperty = null;
    this.__initialize();
  }
  __initialize() {
    this.__updatePromise = new Promise((res) => this.enableUpdating = res);
    this._$changedProperties = new Map;
    this.__saveInstanceProperties();
    this.requestUpdate();
    this.constructor._initializers?.forEach((i) => i(this));
  }
  addController(controller) {
    (this.__controllers ??= new Set).add(controller);
    if (this.renderRoot !== undefined && this.isConnected) {
      controller.hostConnected?.();
    }
  }
  removeController(controller) {
    this.__controllers?.delete(controller);
  }
  __saveInstanceProperties() {
    const instanceProperties = new Map;
    const elementProperties = this.constructor.elementProperties;
    for (const p of elementProperties.keys()) {
      if (this.hasOwnProperty(p)) {
        instanceProperties.set(p, this[p]);
        delete this[p];
      }
    }
    if (instanceProperties.size > 0) {
      this.__instanceProperties = instanceProperties;
    }
  }
  createRenderRoot() {
    const renderRoot = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    adoptStyles(renderRoot, this.constructor.elementStyles);
    return renderRoot;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot();
    this.enableUpdating(true);
    this.__controllers?.forEach((c) => c.hostConnected?.());
  }
  enableUpdating(_requestedUpdate) {}
  disconnectedCallback() {
    this.__controllers?.forEach((c) => c.hostDisconnected?.());
  }
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value);
  }
  __propertyToAttribute(name, value) {
    const elemProperties = this.constructor.elementProperties;
    const options = elemProperties.get(name);
    const attr = this.constructor.__attributeNameForProperty(name, options);
    if (attr !== undefined && options.reflect === true) {
      const converter = options.converter?.toAttribute !== undefined ? options.converter : defaultConverter;
      const attrValue = converter.toAttribute(value, options.type);
      if (DEV_MODE && this.constructor.enabledWarnings.includes("migration") && attrValue === undefined) {
        issueWarning("undefined-attribute-value", `The attribute value for the ${name} property is ` + `undefined on element ${this.localName}. The attribute will be ` + `removed, but in the previous version of \`ReactiveElement\`, ` + `the attribute would not have changed.`);
      }
      this.__reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      }
      this.__reflectingProperty = null;
    }
  }
  _$attributeToProperty(name, value) {
    const ctor = this.constructor;
    const propName = ctor.__attributeToPropertyMap.get(name);
    if (propName !== undefined && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter = typeof options.converter === "function" ? { fromAttribute: options.converter } : options.converter?.fromAttribute !== undefined ? options.converter : defaultConverter;
      this.__reflectingProperty = propName;
      const convertedValue = converter.fromAttribute(value, options.type);
      this[propName] = convertedValue ?? this.__defaultValues?.get(propName) ?? convertedValue;
      this.__reflectingProperty = null;
    }
  }
  requestUpdate(name, oldValue, options, useNewValue = false, newValue) {
    if (name !== undefined) {
      if (DEV_MODE && name instanceof Event) {
        issueWarning(``, `The requestUpdate() method was called with an Event as the property name. This is probably a mistake caused by binding this.requestUpdate as an event listener. Instead bind a function that will call it with no arguments: () => this.requestUpdate()`);
      }
      const ctor = this.constructor;
      if (useNewValue === false) {
        newValue = this[name];
      }
      options ??= ctor.getPropertyOptions(name);
      const changed = (options.hasChanged ?? notEqual)(newValue, oldValue) || options.useDefault && options.reflect && newValue === this.__defaultValues?.get(name) && !this.hasAttribute(ctor.__attributeNameForProperty(name, options));
      if (changed) {
        this._$changeProperty(name, oldValue, options);
      } else {
        return;
      }
    }
    if (this.isUpdatePending === false) {
      this.__updatePromise = this.__enqueueUpdate();
    }
  }
  _$changeProperty(name, oldValue, { useDefault, reflect, wrapped }, initializeValue) {
    if (useDefault && !(this.__defaultValues ??= new Map).has(name)) {
      this.__defaultValues.set(name, initializeValue ?? oldValue ?? this[name]);
      if (wrapped !== true || initializeValue !== undefined) {
        return;
      }
    }
    if (!this._$changedProperties.has(name)) {
      if (!this.hasUpdated && !useDefault) {
        oldValue = undefined;
      }
      this._$changedProperties.set(name, oldValue);
    }
    if (reflect === true && this.__reflectingProperty !== name) {
      (this.__reflectingProperties ??= new Set).add(name);
    }
  }
  async __enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      await this.__updatePromise;
    } catch (e) {
      Promise.reject(e);
    }
    const result = this.scheduleUpdate();
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
  }
  scheduleUpdate() {
    const result = this.performUpdate();
    if (DEV_MODE && this.constructor.enabledWarnings.includes("async-perform-update") && typeof result?.then === "function") {
      issueWarning("async-perform-update", `Element ${this.localName} returned a Promise from performUpdate(). ` + `This behavior is deprecated and will be removed in a future ` + `version of ReactiveElement.`);
    }
    return result;
  }
  performUpdate() {
    if (!this.isUpdatePending) {
      return;
    }
    debugLogEvent?.({ kind: "update" });
    if (!this.hasUpdated) {
      this.renderRoot ??= this.createRenderRoot();
      if (DEV_MODE) {
        const ctor = this.constructor;
        const shadowedProperties = [...ctor.elementProperties.keys()].filter((p) => this.hasOwnProperty(p) && (p in getPrototypeOf(this)));
        if (shadowedProperties.length) {
          throw new Error(`The following properties on element ${this.localName} will not ` + `trigger updates as expected because they are set using class ` + `fields: ${shadowedProperties.join(", ")}. ` + `Native class fields and some compiled output will overwrite ` + `accessors used for detecting changes. See ` + `https://lit.dev/msg/class-field-shadowing ` + `for more information.`);
        }
      }
      if (this.__instanceProperties) {
        for (const [p, value] of this.__instanceProperties) {
          this[p] = value;
        }
        this.__instanceProperties = undefined;
      }
      const elementProperties = this.constructor.elementProperties;
      if (elementProperties.size > 0) {
        for (const [p, options] of elementProperties) {
          const { wrapped } = options;
          const value = this[p];
          if (wrapped === true && !this._$changedProperties.has(p) && value !== undefined) {
            this._$changeProperty(p, undefined, options, value);
          }
        }
      }
    }
    let shouldUpdate = false;
    const changedProperties = this._$changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.willUpdate(changedProperties);
        this.__controllers?.forEach((c) => c.hostUpdate?.());
        this.update(changedProperties);
      } else {
        this.__markUpdated();
      }
    } catch (e) {
      shouldUpdate = false;
      this.__markUpdated();
      throw e;
    }
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }
  willUpdate(_changedProperties) {}
  _$didUpdate(changedProperties) {
    this.__controllers?.forEach((c) => c.hostUpdated?.());
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this.updated(changedProperties);
    if (DEV_MODE && this.isUpdatePending && this.constructor.enabledWarnings.includes("change-in-update")) {
      issueWarning("change-in-update", `Element ${this.localName} scheduled an update ` + `(generally because a property was set) ` + `after an update completed, causing a new update to be scheduled. ` + `This is inefficient and should be avoided unless the next update ` + `can only be scheduled as a side effect of the previous update.`);
    }
  }
  __markUpdated() {
    this._$changedProperties = new Map;
    this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this.__updatePromise;
  }
  shouldUpdate(_changedProperties) {
    return true;
  }
  update(_changedProperties) {
    this.__reflectingProperties &&= this.__reflectingProperties.forEach((p) => this.__propertyToAttribute(p, this[p]));
    this.__markUpdated();
  }
  updated(_changedProperties) {}
  firstUpdated(_changedProperties) {}
}
ReactiveElement.elementStyles = [];
ReactiveElement.shadowRootOptions = { mode: "open" };
ReactiveElement[JSCompiler_renameProperty("elementProperties", ReactiveElement)] = new Map;
ReactiveElement[JSCompiler_renameProperty("finalized", ReactiveElement)] = new Map;
polyfillSupport?.({ ReactiveElement });
if (DEV_MODE) {
  ReactiveElement.enabledWarnings = [
    "change-in-update",
    "async-perform-update"
  ];
  const ensureOwnWarnings = function(ctor) {
    if (!ctor.hasOwnProperty(JSCompiler_renameProperty("enabledWarnings", ctor))) {
      ctor.enabledWarnings = ctor.enabledWarnings.slice();
    }
  };
  ReactiveElement.enableWarning = function(warning) {
    ensureOwnWarnings(this);
    if (!this.enabledWarnings.includes(warning)) {
      this.enabledWarnings.push(warning);
    }
  };
  ReactiveElement.disableWarning = function(warning) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings.splice(i, 1);
    }
  };
}
(global2.reactiveElementVersions ??= []).push("2.1.2");
if (DEV_MODE && global2.reactiveElementVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
  });
}

// node_modules/lit-html/development/lit-html.js
var DEV_MODE2 = true;
var ENABLE_EXTRA_SECURITY_HOOKS = true;
var ENABLE_SHADYDOM_NOPATCH = true;
var NODE_MODE3 = false;
var global3 = globalThis;
var debugLogEvent2 = DEV_MODE2 ? (event) => {
  const shouldEmit = global3.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global3.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : undefined;
var debugLogRenderId = 0;
var issueWarning2;
if (DEV_MODE2) {
  global3.litIssuedWarnings ??= new Set;
  issueWarning2 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!global3.litIssuedWarnings.has(warning) && !global3.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global3.litIssuedWarnings.add(warning);
    }
  };
  queueMicrotask(() => {
    issueWarning2("dev-mode", `Lit is in dev mode. Not recommended for production!`);
  });
}
var wrap = ENABLE_SHADYDOM_NOPATCH && global3.ShadyDOM?.inUse && global3.ShadyDOM?.noPatch === true ? global3.ShadyDOM.wrap : (node) => node;
var trustedTypes2 = global3.trustedTypes;
var policy = trustedTypes2 ? trustedTypes2.createPolicy("lit-html", {
  createHTML: (s) => s
}) : undefined;
var identityFunction = (value) => value;
var noopSanitizer = (_node, _name, _type) => identityFunction;
var setSanitizer = (newSanitizer) => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return;
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(`Attempted to overwrite existing lit-html security policy.` + ` setSanitizeDOMValueFactory should be called at most once.`);
  }
  sanitizerFactoryInternal = newSanitizer;
};
var _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer;
};
var createSanitizer = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type);
};
var boundAttributeSuffix = "$lit$";
var marker = `lit$${Math.random().toFixed(9).slice(2)}$`;
var markerMatch = "?" + marker;
var nodeMarker = `<${markerMatch}>`;
var d = NODE_MODE3 && global3.document === undefined ? {
  createTreeWalker() {
    return {};
  }
} : document;
var createMarker = () => d.createComment("");
var isPrimitive = (value) => value === null || typeof value != "object" && typeof value != "function";
var isArray = Array.isArray;
var isIterable = (value) => isArray(value) || typeof value?.[Symbol.iterator] === "function";
var SPACE_CHAR = `[ 	
\f\r]`;
var ATTR_VALUE_CHAR = `[^ 	
\f\r"'\`<>=]`;
var NAME_CHAR = `[^\\s"'>=/]`;
var textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var COMMENT_START = 1;
var TAG_NAME = 2;
var DYNAMIC_TAG_NAME = 3;
var commentEndRegex = /-->/g;
var comment2EndRegex = />/g;
var tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, "g");
var ENTIRE_MATCH = 0;
var ATTRIBUTE_NAME = 1;
var SPACES_AND_EQUALS = 2;
var QUOTE_CHAR = 3;
var singleQuoteAttrEndRegex = /'/g;
var doubleQuoteAttrEndRegex = /"/g;
var rawTextElement = /^(?:script|style|textarea|title)$/i;
var HTML_RESULT = 1;
var SVG_RESULT = 2;
var MATHML_RESULT = 3;
var ATTRIBUTE_PART = 1;
var CHILD_PART = 2;
var PROPERTY_PART = 3;
var BOOLEAN_ATTRIBUTE_PART = 4;
var EVENT_PART = 5;
var ELEMENT_PART = 6;
var COMMENT_PART = 7;
var tag = (type) => (strings, ...values) => {
  if (DEV_MODE2 && strings.some((s) => s === undefined)) {
    console.warn(`Some template strings are undefined.
` + "This is probably caused by illegal octal escape sequences.");
  }
  if (DEV_MODE2) {
    if (values.some((val) => val?.["_$litStatic$"])) {
      issueWarning2("", `Static values 'literal' or 'unsafeStatic' cannot be used as values to non-static templates.
` + `Please use the static 'html' tag function. See https://lit.dev/docs/templates/expressions/#static-expressions`);
    }
  }
  return {
    ["_$litType$"]: type,
    strings,
    values
  };
};
var html = tag(HTML_RESULT);
var svg = tag(SVG_RESULT);
var mathml = tag(MATHML_RESULT);
var noChange = Symbol.for("lit-noChange");
var nothing = Symbol.for("lit-nothing");
var templateCache = new WeakMap;
var walker = d.createTreeWalker(d, 129);
var sanitizerFactoryInternal = noopSanitizer;
function trustFromTemplateString(tsa, stringFromTSA) {
  if (!isArray(tsa) || !tsa.hasOwnProperty("raw")) {
    let message = "invalid template strings array";
    if (DEV_MODE2) {
      message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `.trim().replace(/\n */g, `
`);
    }
    throw new Error(message);
  }
  return policy !== undefined ? policy.createHTML(stringFromTSA) : stringFromTSA;
}
var getTemplateHtml = (strings, type) => {
  const l = strings.length - 1;
  const attrNames = [];
  let html2 = type === SVG_RESULT ? "<svg>" : type === MATHML_RESULT ? "<math>" : "";
  let rawTextEndRegex;
  let regex = textEndRegex;
  for (let i = 0;i < l; i++) {
    const s = strings[i];
    let attrNameEndIndex = -1;
    let attrName;
    let lastIndex = 0;
    let match;
    while (lastIndex < s.length) {
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === "!--") {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== undefined) {
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== undefined) {
          if (rawTextElement.test(match[TAG_NAME])) {
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, "g");
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== undefined) {
          if (DEV_MODE2) {
            throw new Error("Bindings in tag names are not supported. Please use static templates instead. " + "See https://lit.dev/docs/templates/expressions/#static-expressions");
          }
          regex = tagEndRegex;
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === ">") {
          regex = rawTextEndRegex ?? textEndRegex;
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === undefined) {
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex = match[QUOTE_CHAR] === undefined ? tagEndRegex : match[QUOTE_CHAR] === '"' ? doubleQuoteAttrEndRegex : singleQuoteAttrEndRegex;
        }
      } else if (regex === doubleQuoteAttrEndRegex || regex === singleQuoteAttrEndRegex) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        regex = tagEndRegex;
        rawTextEndRegex = undefined;
      }
    }
    if (DEV_MODE2) {
      console.assert(attrNameEndIndex === -1 || regex === tagEndRegex || regex === singleQuoteAttrEndRegex || regex === doubleQuoteAttrEndRegex, "unexpected parse state B");
    }
    const end = regex === tagEndRegex && strings[i + 1].startsWith("/>") ? " " : "";
    html2 += regex === textEndRegex ? s + nodeMarker : attrNameEndIndex >= 0 ? (attrNames.push(attrName), s.slice(0, attrNameEndIndex) + boundAttributeSuffix + s.slice(attrNameEndIndex)) + marker + end : s + marker + (attrNameEndIndex === -2 ? i : end);
  }
  const htmlResult = html2 + (strings[l] || "<?>") + (type === SVG_RESULT ? "</svg>" : type === MATHML_RESULT ? "</math>" : "");
  return [trustFromTemplateString(strings, htmlResult), attrNames];
};

class Template {
  constructor({ strings, ["_$litType$"]: type }, options) {
    this.parts = [];
    let node;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;
    const [html2, attrNames] = getTemplateHtml(strings, type);
    this.el = Template.createElement(html2, options);
    walker.currentNode = this.el.content;
    if (type === SVG_RESULT || type === MATHML_RESULT) {
      const wrapper = this.el.content.firstChild;
      wrapper.replaceWith(...wrapper.childNodes);
    }
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (DEV_MODE2) {
          const tag2 = node.localName;
          if (/^(?:textarea|template)$/i.test(tag2) && node.innerHTML.includes(marker)) {
            const m = `Expressions are not supported inside \`${tag2}\` ` + `elements. See https://lit.dev/msg/expression-in-${tag2} for more ` + `information.`;
            if (tag2 === "template") {
              throw new Error(m);
            } else
              issueWarning2("", m);
          }
        }
        if (node.hasAttributes()) {
          for (const name of node.getAttributeNames()) {
            if (name.endsWith(boundAttributeSuffix)) {
              const realName = attrNames[attrNameIndex++];
              const value = node.getAttribute(name);
              const statics = value.split(marker);
              const m = /([.?@])?(.*)/.exec(realName);
              parts.push({
                type: ATTRIBUTE_PART,
                index: nodeIndex,
                name: m[2],
                strings: statics,
                ctor: m[1] === "." ? PropertyPart : m[1] === "?" ? BooleanAttributePart : m[1] === "@" ? EventPart : AttributePart
              });
              node.removeAttribute(name);
            } else if (name.startsWith(marker)) {
              parts.push({
                type: ELEMENT_PART,
                index: nodeIndex
              });
              node.removeAttribute(name);
            }
          }
        }
        if (rawTextElement.test(node.tagName)) {
          const strings2 = node.textContent.split(marker);
          const lastIndex = strings2.length - 1;
          if (lastIndex > 0) {
            node.textContent = trustedTypes2 ? trustedTypes2.emptyScript : "";
            for (let i = 0;i < lastIndex; i++) {
              node.append(strings2[i], createMarker());
              walker.nextNode();
              parts.push({ type: CHILD_PART, index: ++nodeIndex });
            }
            node.append(strings2[lastIndex], createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data;
        if (data === markerMatch) {
          parts.push({ type: CHILD_PART, index: nodeIndex });
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            parts.push({ type: COMMENT_PART, index: nodeIndex });
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
    if (DEV_MODE2) {
      if (attrNames.length !== attrNameIndex) {
        throw new Error(`Detected duplicate attribute bindings. This occurs if your template ` + `has duplicate attributes on an element tag. For example ` + `"<input ?disabled=\${true} ?disabled=\${false}>" contains a ` + `duplicate "disabled" attribute. The error was detected in ` + `the following template: 
` + "`" + strings.join("${...}") + "`");
      }
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "template prep",
      template: this,
      clonableTemplate: this.el,
      parts: this.parts,
      strings
    });
  }
  static createElement(html2, _options) {
    const el = d.createElement("template");
    el.innerHTML = html2;
    return el;
  }
}
function resolveDirective(part, value, parent = part, attributeIndex) {
  if (value === noChange) {
    return value;
  }
  let currentDirective = attributeIndex !== undefined ? parent.__directives?.[attributeIndex] : parent.__directive;
  const nextDirectiveConstructor = isPrimitive(value) ? undefined : value["_$litDirective$"];
  if (currentDirective?.constructor !== nextDirectiveConstructor) {
    currentDirective?.["_$notifyDirectiveConnectionChanged"]?.(false);
    if (nextDirectiveConstructor === undefined) {
      currentDirective = undefined;
    } else {
      currentDirective = new nextDirectiveConstructor(part);
      currentDirective._$initialize(part, parent, attributeIndex);
    }
    if (attributeIndex !== undefined) {
      (parent.__directives ??= [])[attributeIndex] = currentDirective;
    } else {
      parent.__directive = currentDirective;
    }
  }
  if (currentDirective !== undefined) {
    value = resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
  }
  return value;
}

class TemplateInstance {
  constructor(template, parent) {
    this._$parts = [];
    this._$disconnectableChildren = undefined;
    this._$template = template;
    this._$parent = parent;
  }
  get parentNode() {
    return this._$parent.parentNode;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _clone(options) {
    const { el: { content }, parts } = this._$template;
    const fragment = (options?.creationScope ?? d).importNode(content, true);
    walker.currentNode = fragment;
    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];
    while (templatePart !== undefined) {
      if (nodeIndex === templatePart.index) {
        let part;
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(node, node.nextSibling, this, options);
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node, this, options);
        }
        this._$parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (nodeIndex !== templatePart?.index) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    walker.currentNode = d;
    return fragment;
  }
  _update(values) {
    let i = 0;
    for (const part of this._$parts) {
      if (part !== undefined) {
        debugLogEvent2 && debugLogEvent2({
          kind: "set part",
          part,
          value: values[i],
          valueIndex: i,
          values,
          templateInstance: this
        });
        if (part.strings !== undefined) {
          part._$setValue(values, part, i);
          i += part.strings.length - 2;
        } else {
          part._$setValue(values[i]);
        }
      }
      i++;
    }
  }
}

class ChildPart {
  get _$isConnected() {
    return this._$parent?._$isConnected ?? this.__isConnected;
  }
  constructor(startNode, endNode, parent, options) {
    this.type = CHILD_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = undefined;
    this._$startNode = startNode;
    this._$endNode = endNode;
    this._$parent = parent;
    this.options = options;
    this.__isConnected = options?.isConnected ?? true;
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._textSanitizer = undefined;
    }
  }
  get parentNode() {
    let parentNode = wrap(this._$startNode).parentNode;
    const parent = this._$parent;
    if (parent !== undefined && parentNode?.nodeType === 11) {
      parentNode = parent.parentNode;
    }
    return parentNode;
  }
  get startNode() {
    return this._$startNode;
  }
  get endNode() {
    return this._$endNode;
  }
  _$setValue(value, directiveParent = this) {
    if (DEV_MODE2 && this.parentNode === null) {
      throw new Error(`This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`);
    }
    value = resolveDirective(this, value, directiveParent);
    if (isPrimitive(value)) {
      if (value === nothing || value == null || value === "") {
        if (this._$committedValue !== nothing) {
          debugLogEvent2 && debugLogEvent2({
            kind: "commit nothing to child",
            start: this._$startNode,
            end: this._$endNode,
            parent: this._$parent,
            options: this.options
          });
          this._$clear();
        }
        this._$committedValue = nothing;
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value);
      }
    } else if (value["_$litType$"] !== undefined) {
      this._commitTemplateResult(value);
    } else if (value.nodeType !== undefined) {
      if (DEV_MODE2 && this.options?.host === value) {
        this._commitText(`[probable mistake: rendered a template's host in itself ` + `(commonly caused by writing \${this} in a template]`);
        console.warn(`Attempted to render the template host`, value, `inside itself. This is almost always a mistake, and in dev mode `, `we render some warning text. In production however, we'll `, `render it, which will usually result in an error, and sometimes `, `in the element disappearing from the DOM.`);
        return;
      }
      this._commitNode(value);
    } else if (isIterable(value)) {
      this._commitIterable(value);
    } else {
      this._commitText(value);
    }
  }
  _insert(node) {
    return wrap(wrap(this._$startNode).parentNode).insertBefore(node, this._$endNode);
  }
  _commitNode(value) {
    if (this._$committedValue !== value) {
      this._$clear();
      if (ENABLE_EXTRA_SECURITY_HOOKS && sanitizerFactoryInternal !== noopSanitizer) {
        const parentNodeName = this._$startNode.parentNode?.nodeName;
        if (parentNodeName === "STYLE" || parentNodeName === "SCRIPT") {
          let message = "Forbidden";
          if (DEV_MODE2) {
            if (parentNodeName === "STYLE") {
              message = `Lit does not support binding inside style nodes. ` + `This is a security risk, as style injection attacks can ` + `exfiltrate data and spoof UIs. ` + `Consider instead using css\`...\` literals ` + `to compose styles, and do dynamic styling with ` + `css custom properties, ::parts, <slot>s, ` + `and by mutating the DOM rather than stylesheets.`;
            } else {
              message = `Lit does not support binding inside script nodes. ` + `This is a security risk, as it could allow arbitrary ` + `code execution.`;
            }
          }
          throw new Error(message);
        }
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit node",
        start: this._$startNode,
        parent: this._$parent,
        value,
        options: this.options
      });
      this._$committedValue = this._insert(value);
    }
  }
  _commitText(value) {
    if (this._$committedValue !== nothing && isPrimitive(this._$committedValue)) {
      const node = wrap(this._$startNode).nextSibling;
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(node, "data", "property");
        }
        value = this._textSanitizer(value);
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit text",
        node,
        value,
        options: this.options
      });
      node.data = value;
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = d.createTextNode("");
        this._commitNode(textNode);
        if (this._textSanitizer === undefined) {
          this._textSanitizer = createSanitizer(textNode, "data", "property");
        }
        value = this._textSanitizer(value);
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: textNode,
          value,
          options: this.options
        });
        textNode.data = value;
      } else {
        this._commitNode(d.createTextNode(value));
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: wrap(this._$startNode).nextSibling,
          value,
          options: this.options
        });
      }
    }
    this._$committedValue = value;
  }
  _commitTemplateResult(result) {
    const { values, ["_$litType$"]: type } = result;
    const template = typeof type === "number" ? this._$getTemplate(result) : (type.el === undefined && (type.el = Template.createElement(trustFromTemplateString(type.h, type.h[0]), this.options)), type);
    if (this._$committedValue?._$template === template) {
      debugLogEvent2 && debugLogEvent2({
        kind: "template updating",
        template,
        instance: this._$committedValue,
        parts: this._$committedValue._$parts,
        options: this.options,
        values
      });
      this._$committedValue._update(values);
    } else {
      const instance = new TemplateInstance(template, this);
      const fragment = instance._clone(this.options);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      instance._update(values);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated and updated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      this._commitNode(fragment);
      this._$committedValue = instance;
    }
  }
  _$getTemplate(result) {
    let template = templateCache.get(result.strings);
    if (template === undefined) {
      templateCache.set(result.strings, template = new Template(result));
    }
    return template;
  }
  _commitIterable(value) {
    if (!isArray(this._$committedValue)) {
      this._$committedValue = [];
      this._$clear();
    }
    const itemParts = this._$committedValue;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      if (partIndex === itemParts.length) {
        itemParts.push(itemPart = new ChildPart(this._insert(createMarker()), this._insert(createMarker()), this, this.options));
      } else {
        itemPart = itemParts[partIndex];
      }
      itemPart._$setValue(item);
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      this._$clear(itemPart && wrap(itemPart._$endNode).nextSibling, partIndex);
      itemParts.length = partIndex;
    }
  }
  _$clear(start = wrap(this._$startNode).nextSibling, from) {
    this._$notifyConnectionChanged?.(false, true, from);
    while (start !== this._$endNode) {
      const n = wrap(start).nextSibling;
      wrap(start).remove();
      start = n;
    }
  }
  setConnected(isConnected) {
    if (this._$parent === undefined) {
      this.__isConnected = isConnected;
      this._$notifyConnectionChanged?.(isConnected);
    } else if (DEV_MODE2) {
      throw new Error("part.setConnected() may only be called on a " + "RootPart returned from render().");
    }
  }
}

class AttributePart {
  get tagName() {
    return this.element.tagName;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  constructor(element, name, strings, parent, options) {
    this.type = ATTRIBUTE_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = undefined;
    this.element = element;
    this.name = name;
    this._$parent = parent;
    this.options = options;
    if (strings.length > 2 || strings[0] !== "" || strings[1] !== "") {
      this._$committedValue = new Array(strings.length - 1).fill(new String);
      this.strings = strings;
    } else {
      this._$committedValue = nothing;
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = undefined;
    }
  }
  _$setValue(value, directiveParent = this, valueIndex, noCommit) {
    const strings = this.strings;
    let change = false;
    if (strings === undefined) {
      value = resolveDirective(this, value, directiveParent, 0);
      change = !isPrimitive(value) || value !== this._$committedValue && value !== noChange;
      if (change) {
        this._$committedValue = value;
      }
    } else {
      const values = value;
      value = strings[0];
      let i, v;
      for (i = 0;i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
        if (v === noChange) {
          v = this._$committedValue[i];
        }
        change ||= !isPrimitive(v) || v !== this._$committedValue[i];
        if (v === nothing) {
          value = nothing;
        } else if (value !== nothing) {
          value += (v ?? "") + strings[i + 1];
        }
        this._$committedValue[i] = v;
      }
    }
    if (change && !noCommit) {
      this._commitValue(value);
    }
  }
  _commitValue(value) {
    if (value === nothing) {
      wrap(this.element).removeAttribute(this.name);
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === undefined) {
          this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "attribute");
        }
        value = this._sanitizer(value ?? "");
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit attribute",
        element: this.element,
        name: this.name,
        value,
        options: this.options
      });
      wrap(this.element).setAttribute(this.name, value ?? "");
    }
  }
}

class PropertyPart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = PROPERTY_PART;
  }
  _commitValue(value) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === undefined) {
        this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "property");
      }
      value = this._sanitizer(value);
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "commit property",
      element: this.element,
      name: this.name,
      value,
      options: this.options
    });
    this.element[this.name] = value === nothing ? undefined : value;
  }
}

class BooleanAttributePart extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = BOOLEAN_ATTRIBUTE_PART;
  }
  _commitValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit boolean attribute",
      element: this.element,
      name: this.name,
      value: !!(value && value !== nothing),
      options: this.options
    });
    wrap(this.element).toggleAttribute(this.name, !!value && value !== nothing);
  }
}

class EventPart extends AttributePart {
  constructor(element, name, strings, parent, options) {
    super(element, name, strings, parent, options);
    this.type = EVENT_PART;
    if (DEV_MODE2 && this.strings !== undefined) {
      throw new Error(`A \`<${element.localName}>\` has a \`@${name}=...\` listener with ` + "invalid content. Event listeners in templates must have exactly " + "one expression and no surrounding text.");
    }
  }
  _$setValue(newListener, directiveParent = this) {
    newListener = resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
    if (newListener === noChange) {
      return;
    }
    const oldListener = this._$committedValue;
    const shouldRemoveListener = newListener === nothing && oldListener !== nothing || newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive;
    const shouldAddListener = newListener !== nothing && (oldListener === nothing || shouldRemoveListener);
    debugLogEvent2 && debugLogEvent2({
      kind: "commit event listener",
      element: this.element,
      name: this.name,
      value: newListener,
      options: this.options,
      removeListener: shouldRemoveListener,
      addListener: shouldAddListener,
      oldListener
    });
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener);
    }
    if (shouldAddListener) {
      this.element.addEventListener(this.name, this, newListener);
    }
    this._$committedValue = newListener;
  }
  handleEvent(event) {
    if (typeof this._$committedValue === "function") {
      this._$committedValue.call(this.options?.host ?? this.element, event);
    } else {
      this._$committedValue.handleEvent(event);
    }
  }
}

class ElementPart {
  constructor(element, parent, options) {
    this.element = element;
    this.type = ELEMENT_PART;
    this._$disconnectableChildren = undefined;
    this._$parent = parent;
    this.options = options;
  }
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _$setValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit to element binding",
      element: this.element,
      value,
      options: this.options
    });
    resolveDirective(this, value);
  }
}
var polyfillSupport2 = DEV_MODE2 ? global3.litHtmlPolyfillSupportDevMode : global3.litHtmlPolyfillSupport;
polyfillSupport2?.(Template, ChildPart);
(global3.litHtmlVersions ??= []).push("3.3.2");
if (DEV_MODE2 && global3.litHtmlVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning2("multiple-versions", `Multiple versions of Lit loaded. ` + `Loading multiple versions is not recommended.`);
  });
}
var render = (value, container, options) => {
  if (DEV_MODE2 && container == null) {
    throw new TypeError(`The container to render into may not be ${container}`);
  }
  const renderId = DEV_MODE2 ? debugLogRenderId++ : 0;
  const partOwnerNode = options?.renderBefore ?? container;
  let part = partOwnerNode["_$litPart$"];
  debugLogEvent2 && debugLogEvent2({
    kind: "begin render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  if (part === undefined) {
    const endNode = options?.renderBefore ?? null;
    partOwnerNode["_$litPart$"] = part = new ChildPart(container.insertBefore(createMarker(), endNode), endNode, undefined, options ?? {});
  }
  part._$setValue(value);
  debugLogEvent2 && debugLogEvent2({
    kind: "end render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  return part;
};
if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer;
  render.createSanitizer = createSanitizer;
  if (DEV_MODE2) {
    render._testOnlyClearSanitizerFactoryDoNotCallOrElse = _testOnlyClearSanitizerFactoryDoNotCallOrElse;
  }
}

// node_modules/lit-element/development/lit-element.js
var JSCompiler_renameProperty2 = (prop, _obj) => prop;
var DEV_MODE3 = true;
var global4 = globalThis;
var issueWarning3;
if (DEV_MODE3) {
  global4.litIssuedWarnings ??= new Set;
  issueWarning3 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!global4.litIssuedWarnings.has(warning) && !global4.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global4.litIssuedWarnings.add(warning);
    }
  };
}

class LitElement extends ReactiveElement {
  constructor() {
    super(...arguments);
    this.renderOptions = { host: this };
    this.__childPart = undefined;
  }
  createRenderRoot() {
    const renderRoot = super.createRenderRoot();
    this.renderOptions.renderBefore ??= renderRoot.firstChild;
    return renderRoot;
  }
  update(changedProperties) {
    const value = this.render();
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    super.update(changedProperties);
    this.__childPart = render(value, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback();
    this.__childPart?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.__childPart?.setConnected(false);
  }
  render() {
    return noChange;
  }
}
LitElement["_$litElement$"] = true;
LitElement[JSCompiler_renameProperty2("finalized", LitElement)] = true;
global4.litElementHydrateSupport?.({ LitElement });
var polyfillSupport3 = DEV_MODE3 ? global4.litElementPolyfillSupportDevMode : global4.litElementPolyfillSupport;
polyfillSupport3?.({ LitElement });
(global4.litElementVersions ??= []).push("4.2.2");
if (DEV_MODE3 && global4.litElementVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning3("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions ` + `is not recommended.`);
  });
}
// node_modules/@lit/reactive-element/development/decorators/custom-element.js
var customElement = (tagName) => (classOrTarget, context) => {
  if (context !== undefined) {
    context.addInitializer(() => {
      customElements.define(tagName, classOrTarget);
    });
  } else {
    customElements.define(tagName, classOrTarget);
  }
};
// node_modules/@lit/reactive-element/development/decorators/property.js
var DEV_MODE4 = true;
var issueWarning4;
if (DEV_MODE4) {
  globalThis.litIssuedWarnings ??= new Set;
  issueWarning4 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!globalThis.litIssuedWarnings.has(warning) && !globalThis.litIssuedWarnings.has(code)) {
      console.warn(warning);
      globalThis.litIssuedWarnings.add(warning);
    }
  };
}
var legacyProperty = (options, proto, name) => {
  const hasOwnProperty = proto.hasOwnProperty(name);
  proto.constructor.createProperty(name, options);
  return hasOwnProperty ? Object.getOwnPropertyDescriptor(proto, name) : undefined;
};
var defaultPropertyDeclaration2 = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
var standardProperty = (options = defaultPropertyDeclaration2, target, context) => {
  const { kind, metadata } = context;
  if (DEV_MODE4 && metadata == null) {
    issueWarning4("missing-class-metadata", `The class ${target} is missing decorator metadata. This ` + `could mean that you're using a compiler that supports decorators ` + `but doesn't support decorator metadata, such as TypeScript 5.1. ` + `Please update your compiler.`);
  }
  let properties = globalThis.litPropertyMetadata.get(metadata);
  if (properties === undefined) {
    globalThis.litPropertyMetadata.set(metadata, properties = new Map);
  }
  if (kind === "setter") {
    options = Object.create(options);
    options.wrapped = true;
  }
  properties.set(context.name, options);
  if (kind === "accessor") {
    const { name } = context;
    return {
      set(v) {
        const oldValue = target.get.call(this);
        target.set.call(this, v);
        this.requestUpdate(name, oldValue, options, true, v);
      },
      init(v) {
        if (v !== undefined) {
          this._$changeProperty(name, undefined, options, v);
        }
        return v;
      }
    };
  } else if (kind === "setter") {
    const { name } = context;
    return function(value) {
      const oldValue = this[name];
      target.call(this, value);
      this.requestUpdate(name, oldValue, options, true, value);
    };
  }
  throw new Error(`Unsupported decorator location: ${kind}`);
};
function property(options) {
  return (protoOrTarget, nameOrContext) => {
    return typeof nameOrContext === "object" ? standardProperty(options, protoOrTarget, nameOrContext) : legacyProperty(options, protoOrTarget, nameOrContext);
  };
}
// node_modules/@lit/reactive-element/development/decorators/state.js
function state(options) {
  return property({
    ...options,
    state: true,
    attribute: false
  });
}
// node_modules/@lit/reactive-element/development/decorators/query.js
var DEV_MODE5 = true;
var issueWarning5;
if (DEV_MODE5) {
  globalThis.litIssuedWarnings ??= new Set;
  issueWarning5 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!globalThis.litIssuedWarnings.has(warning) && !globalThis.litIssuedWarnings.has(code)) {
      console.warn(warning);
      globalThis.litIssuedWarnings.add(warning);
    }
  };
}
// frontend-devtools/ui/fd-toggle-button.ts
class FdToggleButton extends LitElement {
  constructor() {
    super(...arguments);
    this.disabled = false;
    this.active = false;
    this.label = "";
    this.tooltip = "";
  }
  _handleClick(e) {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.active = !this.active;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { active: this.active },
      bubbles: true,
      composed: true
    }));
  }
  render() {
    const ariaLabel = this.label || this.tooltip || undefined;
    return html`
      <button
        class="toggle-button"
        aria-label=${ariaLabel ?? ""}
        title=${this.tooltip}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
  static styles = css`
    :host([active]) .toggle-button {
      color: #8e61e3;
    }

    :host([active]) .toggle-button:hover {
      color: #9f7af0;
    }

    .toggle-button {
      padding: 0;
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      box-shadow: none;
      cursor: pointer;
      color: #999;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-button:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    /* ===== Focus states ===== */
    .toggle-button:focus {
      outline: none;
    }

    .toggle-button:focus-visible {
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdToggleButton.prototype, "disabled", undefined);
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdToggleButton.prototype, "active", undefined);
__legacyDecorateClassTS([
  property({ type: String })
], FdToggleButton.prototype, "label", undefined);
__legacyDecorateClassTS([
  property({ type: String })
], FdToggleButton.prototype, "tooltip", undefined);
FdToggleButton = __legacyDecorateClassTS([
  customElement("fd-toggle-button")
], FdToggleButton);

// frontend-devtools/ui/fd-icon.ts
var ICONS = {
  inspect: svg`
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/>
    <path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h2"/>
    <path d="M14 3h1"/><path d="M3 9v1"/><path d="M21 9v2"/><path d="M3 14v1"/>
  `,
  close: svg`
    <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
  `,
  domTree: svg`
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
  `,
  settings: svg`
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  `
};

class FdIcon extends LitElement {
  constructor() {
    super(...arguments);
    this.name = "inspect";
    this.size = 16;
  }
  render() {
    const iconContent = ICONS[this.name];
    if (!iconContent) {
      return nothing;
    }
    return html`
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
  static styles = css`
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
}
__legacyDecorateClassTS([
  property({ type: String, reflect: true })
], FdIcon.prototype, "name", undefined);
__legacyDecorateClassTS([
  property({ type: Number })
], FdIcon.prototype, "size", undefined);
FdIcon = __legacyDecorateClassTS([
  customElement("fd-icon")
], FdIcon);

// frontend-devtools/ui/fd-inspect.ts
class FdInspect extends LitElement {
  constructor() {
    super(...arguments);
    this.active = false;
  }
  _handleChange(e) {
    this.active = e.detail.active;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { active: this.active },
      bubbles: true,
      composed: true
    }));
  }
  render() {
    return html`
      <fd-toggle-button
        tooltip="Inspect component"
        ?active=${this.active}
        @change=${this._handleChange}
      >
        <fd-icon name="inspect"></fd-icon>
      </fd-toggle-button>
    `;
  }
  static styles = css`
    :host {
      display: inline-flex;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdInspect.prototype, "active", undefined);
FdInspect = __legacyDecorateClassTS([
  customElement("fd-inspect")
], FdInspect);

// frontend-devtools/ui/fd-dom-stats.ts
class FdDomStats extends LitElement {
  constructor() {
    super(...arguments);
    this._tagCounts = [];
  }
  _interval = 1000;
  _updateIntervalId = null;
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
    const tagMap = new Map;
    document.querySelectorAll("*").forEach((el) => {
      const tagName = el.tagName.toLowerCase();
      tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
    });
    this._tagCounts = Array.from(tagMap.entries()).map(([tag2, count]) => ({ tag: tag2, count })).sort((a, b) => b.count - a.count);
  }
  get _maxCount() {
    return this._tagCounts[0]?.count || 1;
  }
  _getBarWidth(count) {
    return count / this._maxCount * 100;
  }
  render() {
    return html`
      <div class="dom-stats-container">
        ${this._tagCounts.map((item) => html`
            <div class="dom-stats-row">
              <div class="bar" style="width: ${this._getBarWidth(item.count)}%"></div>
              <span class="tag-name">${item.tag}</span>
              <span class="tag-count">${item.count}</span>
            </div>
          `)}
      </div>
    `;
  }
  static styles = css`
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
      background: #1a1a1a;
      
      padding: 8px;
      color: #e0e0e0;
      max-height: 100%;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
      background: rgba(100, 181, 246, 0.15);
      border-radius: 4px;
      pointer-events: none;
      transition: width 300ms ease-out;
    }

    .dom-stats-row:hover .bar {
      background: rgba(100, 181, 246, 0.25);
    }

    .tag-name {
      position: relative;
      color: #64b5f6;
      font-weight: 500;
      flex: 1;
    }

    .tag-count {
      position: relative;
      color: #81c784;
      font-weight: 600;
      min-width: 40px;
      text-align: right;
    }
  `;
}
__legacyDecorateClassTS([
  state()
], FdDomStats.prototype, "_tagCounts", undefined);
FdDomStats = __legacyDecorateClassTS([
  customElement("fd-dom-stats")
], FdDomStats);

// frontend-devtools/ui/fd-toolbar.ts
class FdToolbar extends LitElement {
  constructor() {
    super(...arguments);
    this.collapsed = false;
    this.orientation = "horizontal";
  }
  render() {
    return html`<slot></slot>`;
  }
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdToolbar.prototype, "collapsed", undefined);
__legacyDecorateClassTS([
  property({ type: String, reflect: true })
], FdToolbar.prototype, "orientation", undefined);
FdToolbar = __legacyDecorateClassTS([
  customElement("fd-toolbar")
], FdToolbar);

// frontend-devtools/core/config.ts
var DRAG_CONFIG = {
  thresholds: {
    dragStart: 5,
    snapDistance: 60,
    directionThreshold: 40
  },
  animation: {
    snapTransitionMs: 300
  },
  dimensions: {
    safeArea: 16
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
var COMPONENTS = ["FD-ICON", "FD-SWITCH", "FD-DOM-MUTATION", "FD-FPS", "FD-MEM", "FD-TOGGLE-BUTTON", "FD-INSPECT"];

class FdPanel extends LitElement {
  constructor() {
    super(...arguments);
    this.position = "top-right";
  }
  _panelSize = {
    width: 0,
    height: 0
  };
  _transformPos = { x: 0, y: 0 };
  _transitionTimeoutId = null;
  _panelResizeObserver = null;
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerdown", this._handlePointerDown);
    window.addEventListener("resize", this._handleWindowResize);
    this._panelResizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry)
        return;
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
  }
  _handleWindowResize = () => {
    this._updateTransformFromCorner();
  };
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
  _handlePointerDown(e) {
    const target = e.target;
    if (COMPONENTS.includes(target.tagName)) {
      return;
    }
    e.preventDefault();
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialX = this._transformPos.x;
    const initialY = this._transformPos.y;
    let currentX = initialX;
    let currentY = initialY;
    let lastMouseX = initialMouseX;
    let lastMouseY = initialMouseY;
    let hasMoved = false;
    let rafId = null;
    this.setPointerCapture(e.pointerId);
    const pointerId = e.pointerId;
    const handlePointerMove = (moveEvent) => {
      lastMouseX = moveEvent.clientX;
      lastMouseY = moveEvent.clientY;
      if (rafId)
        return;
      rafId = requestAnimationFrame(() => {
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
        rafId = null;
      });
    };
    const handlePointerEnd = () => {
      if (this.hasPointerCapture(pointerId)) {
        this.releasePointerCapture(pointerId);
      }
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
      document.removeEventListener("pointercancel", handlePointerEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      this.removeAttribute("dragging");
      this.dispatchEvent(new CustomEvent("drag-end", { bubbles: true, composed: true }));
      if (!hasMoved)
        return;
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
        this.dispatchEvent(new CustomEvent("position-change", {
          detail: { position: newCorner, previousPosition: oldPosition },
          bubbles: true,
          composed: true
        }));
      }
    };
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
    return html`<slot></slot>`;
  }
  static styles = css`
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
}
__legacyDecorateClassTS([
  property({ type: String, reflect: true })
], FdPanel.prototype, "position", undefined);
FdPanel = __legacyDecorateClassTS([
  customElement("fd-panel")
], FdPanel);

// frontend-devtools/ui/fd-fps.ts
class FdFps extends LitElement {
  constructor() {
    super(...arguments);
    this.active = false;
    this._displayFps = 0;
  }
  _fps = 0;
  _frameCount = 0;
  _lastTime = 0;
  _animationId = null;
  _handleClick() {
    this.active = !this.active;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { active: this.active },
      bubbles: true,
      composed: true
    }));
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
    if (now - this._lastTime >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._lastTime = now;
      this._displayFps = this._fps;
    }
    this._animationId = requestAnimationFrame(() => this._tick());
  }
  _calcHue(fps) {
    const maxHue = 120;
    const maxFps = 60;
    return Math.max(0, Math.min(fps / maxFps * maxHue, maxHue));
  }
  _getColor() {
    const hue = this._calcHue(this._displayFps);
    return `hsl(${hue}, 80%, 40%)`;
  }
  render() {
    return html`
      <button class="devtools-meter" @click=${this._handleClick}>
        <span class="devtools-meter-value" style="color: ${this._getColor()}">${this._displayFps}</span>
        <span class="devtools-meter-label">FPS</span>
      </button>
    `;
  }
  static styles = css`
    .devtools-meter {
      appearance: none;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 6px;
      white-space: nowrap;
      font-family: var(--fd-font-mono);
      background: #141414;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .devtools-meter:hover {
      background: #1a1a1a;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
    }

    .devtools-meter-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
      color: #fff;
      font-family: var(--fd-font-mono);
    }

    .devtools-meter-value.memory {
      min-width: 38px;
      text-align: center;
    }

    .devtools-meter-label {
      color: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
      white-space: nowrap;
      transition: color 0.15s ease-in-out;
    }

    :host([active]) .devtools-meter {
      box-shadow: inset 0 0 0 1px rgba(142, 97, 230, 0.4);
    }

    /* ===== Focus states ===== */
    .devtools-meter:focus {
      outline: none;
    }

    .devtools-meter:focus-visible {
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdFps.prototype, "active", undefined);
__legacyDecorateClassTS([
  state()
], FdFps.prototype, "_displayFps", undefined);
FdFps = __legacyDecorateClassTS([
  customElement("fd-fps")
], FdFps);

// frontend-devtools/core/fd-mem-observer.ts
var SAMPLE_INTERVAL = 1000;

class FdMemObserverImpl {
  _listeners = new Set;
  _intervalId = null;
  _lastInfo = { usedMB: 0, totalMB: 0, limitMB: 0 };
  static isSupported() {
    const perf = performance;
    return !!(perf.memory && typeof perf.memory.usedJSHeapSize === "number");
  }
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
  getCurrentInfo() {
    return this._lastInfo;
  }
  _startSampling() {
    if (this._intervalId !== null)
      return;
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
}
var FdMemObserver = new FdMemObserverImpl;

// frontend-devtools/ui/fd-mem.ts
class FdMem extends LitElement {
  constructor() {
    super(...arguments);
    this.active = false;
    this._memoryMB = 0;
  }
  _unsubscribe = null;
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
    this.dispatchEvent(new CustomEvent("change", {
      detail: { active: this.active },
      bubbles: true,
      composed: true
    }));
  }
  render() {
    return html`
      <button class="devtools-meter" @click=${this._handleClick}>
        <span class="devtools-meter-value memory">${this._memoryMB}</span>
        <span class="devtools-meter-label">MB</span>
      </button>
    `;
  }
  static styles = css`
    .devtools-meter {
      appearance: none;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 6px;
      white-space: nowrap;
      font-family: var(--fd-font-mono);
      background: #141414;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .devtools-meter:hover {
      background: #1a1a1a;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
    }

    .devtools-meter-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
      color: rgb(214, 132, 245);
      font-family: var(--fd-font-mono);
    }

    .devtools-meter-value.memory {
      min-width: 38px;
      text-align: center;
    }

    .devtools-meter-label {
      color: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
      white-space: nowrap;
      transition: color 0.15s ease-in-out;
    }

    :host([active]) .devtools-meter {
      box-shadow: inset 0 0 0 1px rgba(142, 97, 230, 0.4);
    }

    /* ===== Focus states ===== */
    .devtools-meter:focus {
      outline: none;
    }

    .devtools-meter:focus-visible {
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdMem.prototype, "active", undefined);
__legacyDecorateClassTS([
  state()
], FdMem.prototype, "_memoryMB", undefined);
FdMem = __legacyDecorateClassTS([
  customElement("fd-mem")
], FdMem);

// frontend-devtools/ui/fd-lag-radar.ts
class FdLagRadar extends LitElement {
  constructor() {
    super(...arguments);
    this.size = 220;
    this.frames = 50;
    this.speed = 0.0017;
    this.inset = 3;
    this.showLegend = true;
    this._running = false;
  }
  _animationId = null;
  _last = null;
  _framePtr = 0;
  _arcs = [];
  _hand = null;
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
    const svg2 = this.shadowRoot?.querySelector(".radar-sweep");
    const hand = this.shadowRoot?.querySelector(".radar-hand");
    if (!svg2 || !hand)
      return;
    this._hand = hand;
    this._arcs = [];
    for (let i = 0;i < this.frames; i++) {
      const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg2.appendChild(arc);
      this._arcs.push(arc);
    }
  }
  start() {
    if (this._running)
      return;
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
  stop() {
    this._running = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }
  _calcHue(msDelta) {
    const maxHue = 120;
    const maxMs = 1000;
    const logF = 10;
    const mult = maxHue / Math.log(maxMs / logF);
    return maxHue - Math.max(0, Math.min(mult * Math.log(msDelta / logF), maxHue));
  }
  _animate() {
    if (!this._running || !this._last)
      return;
    const PI2 = Math.PI * 2;
    const middle = this._middle;
    const radius = this._radius;
    const frames = this.frames;
    const now = Date.now();
    const rdelta = Math.min(PI2 - this.speed, this.speed * (now - this._last.now));
    const rotation = (this._last.rotation + rdelta) % PI2;
    const tx = middle + radius * Math.cos(rotation);
    const ty = middle + radius * Math.sin(rotation);
    const bigArc = rdelta < Math.PI ? "0" : "1";
    const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${this._last.tx} ${this._last.ty}L${middle} ${middle}`;
    const hue = this._calcHue(rdelta / this.speed);
    const currentArc = this._arcs[this._framePtr % frames];
    if (currentArc) {
      currentArc.setAttribute("d", path);
      currentArc.setAttribute("fill", `hsl(${hue}, 80%, 40%)`);
    }
    if (this._hand) {
      this._hand.setAttribute("d", `M${middle} ${middle}L${tx} ${ty}`);
    }
    for (let i = 0;i < frames; i++) {
      const arc = this._arcs[(frames + this._framePtr - i) % frames];
      if (arc) {
        arc.style.fillOpacity = String(1 - i / frames);
      }
    }
    this._framePtr++;
    this._last = { now, rotation, tx, ty };
    this._animationId = requestAnimationFrame(() => this._animate());
  }
  render() {
    return html`
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
        ${this.showLegend ? this._renderLegend() : null}
      </div>
    `;
  }
  _renderLegend() {
    return html`
      <div class="radar-legend">
        <div class="radar-legend-item">
          <span class="radar-legend-dot radar-legend-dot--good"></span>
          <span>50+</span>
        </div>
        <div class="radar-legend-item">
          <span class="radar-legend-dot radar-legend-dot--warning"></span>
          <span>30-50</span>
        </div>
        <div class="radar-legend-item">
          <span class="radar-legend-dot radar-legend-dot--critical"></span>
          <span>&lt;30</span>
        </div>
      </div>
    `;
  }
  static styles = css`
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
      background: #141414;
      border-radius: 6px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .radar-svg {
      display: block;
    }

    .radar-sweep > * {
      shape-rendering: crispEdges;
    }

    .radar-face {
      fill: transparent;
      stroke: rgba(255, 255, 255, 0.85);
      stroke-width: 4px;
    }

    .radar-hand {
      stroke: rgba(255, 255, 255, 0.85);
      stroke-width: 4px;
      stroke-linecap: round;
    }

    .radar-legend {
      display: flex;
      justify-content: center;
      gap: 12px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
    }

    .radar-legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .radar-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
    }

    .radar-legend-dot--good {
      background: hsl(120, 80%, 40%);
    }

    .radar-legend-dot--warning {
      background: hsl(60, 80%, 40%);
    }

    .radar-legend-dot--critical {
      background: hsl(0, 80%, 40%);
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Number })
], FdLagRadar.prototype, "size", undefined);
__legacyDecorateClassTS([
  property({ type: Number })
], FdLagRadar.prototype, "frames", undefined);
__legacyDecorateClassTS([
  property({ type: Number })
], FdLagRadar.prototype, "speed", undefined);
__legacyDecorateClassTS([
  property({ type: Number })
], FdLagRadar.prototype, "inset", undefined);
__legacyDecorateClassTS([
  property({ type: Boolean, attribute: "show-legend" })
], FdLagRadar.prototype, "showLegend", undefined);
__legacyDecorateClassTS([
  state()
], FdLagRadar.prototype, "_running", undefined);
FdLagRadar = __legacyDecorateClassTS([
  customElement("fd-lag-radar")
], FdLagRadar);

// frontend-devtools/ui/fd-mem-chart.ts
var MAX_POINTS = 120;
var Y_AXIS_WIDTH = 48;
var CHART_PADDING = 2;
var CHART_TOP_MARGIN = 10;

class FdMemChart extends LitElement {
  constructor() {
    super(...arguments);
    this.active = false;
    this.height = 184;
    this._dataPoints = [];
    this._width = 200;
  }
  _unsubscribe = null;
  _resizeObserver = null;
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
    const validPoints = this._dataPoints.filter((v) => v > 0);
    if (validPoints.length === 0)
      return { min: 0, max: 100 };
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
    if (data.length === 0)
      return "";
    const { chartWidth, chartHeight, chartLeft, chartTop } = this._getChartDimensions();
    const { min, max } = this._getMinMax();
    const range = max - min || 1;
    const points = data.map((value, index) => {
      const x = chartLeft + index / (MAX_POINTS - 1) * chartWidth;
      const y = value === 0 ? chartTop + chartHeight : chartTop + chartHeight - (value - min) / range * chartHeight;
      return { x, y };
    });
    if (points.length === 0)
      return "";
    const firstPoint = points[0];
    let path = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 1;i < points.length; i++) {
      const point = points[i];
      path += ` L ${point.x} ${point.y}`;
    }
    return path;
  }
  _getAreaPath() {
    const linePath = this._getPathData();
    if (!linePath)
      return "";
    const { chartWidth, chartHeight, chartLeft, chartTop } = this._getChartDimensions();
    const bottom = chartTop + chartHeight;
    return `${linePath} L ${chartLeft + chartWidth} ${bottom} L ${chartLeft} ${bottom} Z`;
  }
  _formatMB(value) {
    if (value >= 1e4) {
      return `${(value / 1000).toFixed(1)}G`;
    }
    return `${Math.round(value)}`;
  }
  render() {
    const { min, max } = this._getMinMax();
    const { chartLeft, chartTop, chartHeight } = this._getChartDimensions();
    const mid = (min + max) / 2;
    const bottom = chartTop + chartHeight;
    const middle = chartTop + chartHeight / 2;
    return html`
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
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #141414;
      border-radius: 6px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
      width: 100%;
      box-sizing: border-box;
    }

    .chart-svg {
      display: block;
    }

    .grid-line {
      stroke: rgba(255, 255, 255, 0.06);
      stroke-width: 1;
      stroke-dasharray: 2 2;
    }

    .axis-line {
      stroke: rgba(255, 255, 255, 0.15);
      stroke-width: 1;
    }

    .axis-label {
      font-family: var(--fd-font-mono);
      font-size: 9px;
      fill: rgba(255, 255, 255, 0.4);
    }

    .chart-area {
      fill: rgba(142, 97, 230, 0.2);
    }

    .chart-line {
      fill: none;
      stroke: rgba(142, 97, 230, 0.8);
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdMemChart.prototype, "active", undefined);
__legacyDecorateClassTS([
  property({ type: Number })
], FdMemChart.prototype, "height", undefined);
__legacyDecorateClassTS([
  state()
], FdMemChart.prototype, "_dataPoints", undefined);
__legacyDecorateClassTS([
  state()
], FdMemChart.prototype, "_width", undefined);
FdMemChart = __legacyDecorateClassTS([
  customElement("fd-mem-chart")
], FdMemChart);

// frontend-devtools/core/utilities.ts
var CONFIG = {
  colors: {
    primary: { r: 115, g: 97, b: 230 },
    inspectStroke: "rgba(142, 97, 227, 0.5)",
    inspectFill: "rgba(173, 97, 230, 0.10)",
    inspectPillBg: "rgba(37, 37, 38, 0.75)",
    inspectPillText: "white",
    inspectMarkedStroke: "rgba(79, 192, 255, 0.6)",
    inspectMarkedFill: "rgba(79, 192, 255, 0.10)",
    inspectMarkedPillBg: "rgba(20, 60, 80, 0.85)",
    inspectMarkedPillText: "#79c0ff",
    inspectReactStroke: "rgba(97, 218, 251, 0.6)",
    inspectReactFill: "rgba(97, 218, 251, 0.10)",
    inspectReactPillBg: "rgba(20, 44, 52, 0.90)",
    inspectReactPillText: "#61dafb"
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
    memoryDisplay: 1000,
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
    if (timeoutId)
      clearTimeout(timeoutId);
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
  if (!element)
    return false;
  const attr = CONFIG.attributes.devtools;
  return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null;
}
function getScalaComponent(element) {
  if (!element)
    return null;
  const attr = CONFIG.attributes.scalaComponent;
  const closest = element.closest(`[${attr}]`);
  if (!closest)
    return null;
  return {
    element: closest,
    name: closest.getAttribute(attr)
  };
}
function getScalaSource(node) {
  const element = node && node.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  if (!element)
    return null;
  const attr = CONFIG.attributes.scalaComponent;
  const value = element.getAttribute(attr);
  if (value)
    return value;
  const closest = element.closest(`[${attr}]`);
  return closest ? closest.getAttribute(attr) : null;
}
function getComponentSourceInfo(element) {
  if (!element)
    return null;
  const props = CONFIG.properties;
  const el = element;
  return {
    sourcePath: el[props.sourcePath] || null,
    sourceLine: el[props.sourceLine] !== undefined ? String(el[props.sourceLine]) : null,
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
    if (!domNode)
      return null;
    const key = Object.keys(domNode).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactContainer$"));
    return key ? domNode[key] : null;
  } catch {
    return null;
  }
}
function getComponentNameFromType(type) {
  try {
    if (type == null)
      return null;
    if (typeof type === "function") {
      return type.displayName || type.name || null;
    }
    if (typeof type === "string") {
      return type;
    }
    if (typeof type === "object") {
      const $$typeof = type.$$typeof;
      if (!$$typeof)
        return null;
      const typeStr = $$typeof.toString();
      if (typeStr === "Symbol(react.forward_ref)") {
        const displayName = type.displayName;
        if (displayName)
          return displayName;
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
    if (!fiber)
      return null;
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
    if (!fiber)
      return null;
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
    if (!element)
      return null;
    const reactInfo = getReactComponentFromNode(element);
    if (!reactInfo)
      return null;
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
    if (!reactInfo)
      return null;
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

class FdMutationCanvas extends LitElement {
  constructor() {
    super(...arguments);
    this.active = false;
  }
  _canvas = null;
  _ctx = null;
  _animationId = null;
  _highlights = new Map;
  _resizeHandler = null;
  _observer = null;
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
  highlight(element, name, options = {}) {
    if (!this._canvas || !element.isConnected)
      return;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0)
      return;
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
    if (this._canvas)
      return;
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="mutation-canvas"]`);
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
    if (!this._canvas || !this._ctx)
      return;
    const dpr = getDevicePixelRatio();
    this._canvas.style.width = `${window.innerWidth}px`;
    this._canvas.style.height = `${window.innerHeight}px`;
    this._canvas.width = window.innerWidth * dpr;
    this._canvas.height = window.innerHeight * dpr;
    this._ctx.scale(dpr, dpr);
  }
  _startAnimation() {
    if (this._animationId)
      return;
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
    if (!this._ctx || !this._canvas)
      return;
    const dpr = getDevicePixelRatio();
    this._ctx.clearRect(0, 0, this._canvas.width / dpr, this._canvas.height / dpr);
  }
  _draw() {
    if (!this._ctx || !this._canvas)
      return;
    this._clearCanvas();
    const toRemove = [];
    const labelMap = new Map;
    const { r, g, b } = CONFIG.colors.primary;
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
      const color = highlight.isReact ? reactColor : { r, g, b };
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
        if (alpha > existing.alpha)
          existing.alpha = alpha;
      }
    }
    this._ctx.font = CONFIG.fonts.mono;
    for (const [, { x, y, name, count, alpha, isReact }] of labelMap) {
      const color = isReact ? reactColor : { r, g, b };
      const displayName = isReact ? `⚛ ${name}` : name;
      const labelText = count > 1 ? `${displayName} ×${count}` : displayName;
      const textWidth = this._ctx.measureText(labelText).width;
      const textHeight = 11;
      const padding = 2;
      let labelY = y - textHeight - padding * 2;
      if (labelY < 0)
        labelY = 0;
      this._ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
      this._ctx.fillRect(x, labelY, textWidth + padding * 2, textHeight + padding * 2);
      this._ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this._ctx.fillText(labelText, x + padding, labelY + textHeight + padding - 2);
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
    if (this._observer)
      return;
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
    if (!this.active)
      return;
    for (const record of mutations) {
      const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      if (!target || isDevtoolsElement(target))
        continue;
      this._highlightElement(target);
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node)) {
          this._highlightElement(node);
        }
      }
    }
  }
  _highlightElement(element) {
    if (!this._canvas)
      return;
    if (!element.isConnected)
      return;
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
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdMutationCanvas.prototype, "active", undefined);
FdMutationCanvas = __legacyDecorateClassTS([
  customElement("fd-mutation-canvas")
], FdMutationCanvas);

// frontend-devtools/ui/fd-switch.ts
class FdSwitch extends LitElement {
  constructor() {
    super(...arguments);
    this.checked = false;
  }
  _handleChange(e) {
    const input = e.target;
    this.checked = input.checked;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { checked: this.checked },
      bubbles: true,
      composed: true
    }));
  }
  render() {
    return html`
      <label class="devtools-toggle" part="container">
        <input
          type="checkbox"
          .checked=${this.checked}
          @change=${this._handleChange}
          part="input"
        />
        <span class="devtools-toggle-track" part="track">
          <span class="devtools-toggle-thumb" part="thumb"></span>
        </span>
      </label>
    `;
  }
  static styles = css`
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
      background: #525252;
      border-radius: 9999px;
      transition: background-color 0.2s;
      flex-shrink: 0;
    }

    .devtools-toggle input:checked + .devtools-toggle-track {
      background: #7361e6;
    }

    .devtools-toggle-thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdSwitch.prototype, "checked", undefined);
FdSwitch = __legacyDecorateClassTS([
  customElement("fd-switch")
], FdSwitch);

// frontend-devtools/ui/fd-component-inspector.ts
class FdComponentInspector extends LitElement {
  constructor() {
    super(...arguments);
    this.active = false;
  }
  _canvas = null;
  _ctx = null;
  _currentRect = null;
  _animationId = null;
  _removeTimeoutId = null;
  _eventCatcher = null;
  _lastHovered = null;
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
    requestAnimationFrame(() => {
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
    this._destroyCanvas();
    this._destroyEventCatcher();
    this._dispatchChange(false);
  }
  _dispatchChange(active) {
    this.dispatchEvent(new CustomEvent("change", {
      detail: { active },
      bubbles: true,
      composed: true
    }));
  }
  _createCanvas() {
    if (this._canvas)
      return;
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="inspect-canvas"]`);
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
    if (!this._ctx || !this._canvas)
      return;
    const dpr = getDevicePixelRatio();
    this._ctx.clearRect(0, 0, this._canvas.width / dpr, this._canvas.height / dpr);
  }
  _cancelAnimation() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }
  _createEventCatcher() {
    if (this._eventCatcher)
      return;
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
    document.addEventListener("keydown", this._handleKeydown);
  }
  _removeEventListeners() {
    document.removeEventListener("pointermove", this._handlePointerMove, { capture: true });
    document.removeEventListener("click", this._handleClick, { capture: true });
    document.removeEventListener("keydown", this._handleKeydown);
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
      if (!this._currentRect)
        return;
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
    if (!this._ctx)
      return;
    this._clearCanvas();
    if (!rect)
      return;
    const isMarked = info?.isMarked || false;
    const isReact = info?.isReact || false;
    const colors = CONFIG.colors;
    let strokeColor, fillColor, pillBg, pillText;
    if (isReact) {
      strokeColor = colors.inspectReactStroke;
      fillColor = colors.inspectReactFill;
      pillBg = colors.inspectReactPillBg;
      pillText = colors.inspectReactPillText;
    } else if (isMarked) {
      strokeColor = colors.inspectMarkedStroke;
      fillColor = colors.inspectMarkedFill;
      pillBg = colors.inspectMarkedPillBg;
      pillText = colors.inspectMarkedPillText;
    } else {
      strokeColor = colors.inspectStroke;
      fillColor = colors.inspectFill;
      pillBg = colors.inspectPillBg;
      pillText = colors.inspectPillText;
    }
    this._ctx.strokeStyle = strokeColor;
    this._ctx.fillStyle = fillColor;
    this._ctx.lineWidth = 1;
    this._ctx.setLineDash([4]);
    this._ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    this._ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    if (componentName) {
      this._drawPill(rect, componentName, isReact, pillBg, pillText);
    }
  }
  _drawPill(rect, componentName, isReact, pillBg, pillText) {
    if (!this._ctx)
      return;
    const pillHeight = 24;
    const pillPadding = 8;
    const pillGap = 4;
    this._ctx.font = "12px system-ui, -apple-system, sans-serif";
    const displayName = isReact ? `⚛ ${componentName}` : componentName;
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
    let pillX = rect.left;
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
  _handlePointerMove = (e) => {
    if (!this.active)
      return;
    if (this._lastHovered && !this._lastHovered.isConnected) {
      this._lastHovered = null;
      this._clearOverlay();
    }
    if (!this._eventCatcher)
      return;
    this._eventCatcher.style.pointerEvents = "none";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    this._eventCatcher.style.pointerEvents = "auto";
    if (!element)
      return;
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
      return;
    }
    if (component.element === this._lastHovered)
      return;
    this._lastHovered = component.element;
    const rect = component.element.getBoundingClientRect();
    this._animateTo({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }, component.name ?? "Unknown", info ?? {});
  };
  _handleClick = (e) => {
    if (!this.active)
      return;
    if (isDevtoolsElement(e.target) && e.target !== this._eventCatcher)
      return;
    e.preventDefault();
    e.stopPropagation();
    if (!this._eventCatcher)
      return;
    this._eventCatcher.style.pointerEvents = "none";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    this._eventCatcher.style.pointerEvents = "auto";
    if (!element)
      return;
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
  _handleKeydown = (e) => {
    if (e.key === "Escape" && this.active) {
      this.active = false;
    }
  };
  static styles = css`
    :host {
      display: none;
    }
  `;
}
__legacyDecorateClassTS([
  property({ type: Boolean, reflect: true })
], FdComponentInspector.prototype, "active", undefined);
FdComponentInspector = __legacyDecorateClassTS([
  customElement("fd-component-inspector")
], FdComponentInspector);

// frontend-devtools/design-tokens.ts
var designTokens = css`
  :host {
    --fd-font: system-ui, -apple-system, sans-serif;
    --fd-font-mono: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
  }
`;

// frontend-devtools/core/persistence-storage.ts
class PersistenceStorage {
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
}
var persistenceStorage = new PersistenceStorage;

// frontend-devtools/frontend-devtools.ts
var DevtoolsAPI = {
  enable() {
    persistenceStorage.setBoolean("FRONTEND_DEVTOOLS_ENABLED", true);
    console.log("Devtools enabled. Refresh the page for changes to take effect.");
  },
  disable() {
    persistenceStorage.remove("FRONTEND_DEVTOOLS_ENABLED");
    console.log("Devtools disabled. Refresh the page for changes to take effect.");
  }
};
window.Devtools = DevtoolsAPI;

class FrontendDevtools extends LitElement {
  _enabled;
  constructor() {
    super();
    this._inspectActive = false;
    this._mutationScanActive = false;
    this._activeWidgets = [];
    this._enabled = persistenceStorage.getBoolean("FRONTEND_DEVTOOLS_ENABLED");
  }
  _handleDomMutationChange(e) {
    this._mutationScanActive = e.detail.checked;
  }
  _handleInspectChange(e) {
    this._inspectActive = e.detail.active;
  }
  _handleInspectorChange(e) {
    this._inspectActive = e.detail.active;
  }
  _toggleWidget(widget, active) {
    if (active && !this._activeWidgets.includes(widget)) {
      this._activeWidgets = [...this._activeWidgets, widget];
    } else if (!active) {
      this._activeWidgets = this._activeWidgets.filter((w) => w !== widget);
    }
  }
  _handleFpsChange(e) {
    this._toggleWidget("LAG_RADAR", e.detail.active);
  }
  _handleDomStatsChange(e) {
    this._toggleWidget("DOM_STATS", e.detail.active);
  }
  _handleMemChange(e) {
    this._toggleWidget("MEM_CHART", e.detail.active);
  }
  _renderWidget(widget) {
    switch (widget) {
      case "LAG_RADAR":
        return html`<fd-lag-radar></fd-lag-radar>`;
      case "DOM_STATS":
        return html`<fd-dom-stats></fd-dom-stats>`;
      case "MEM_CHART":
        return html`<fd-mem-chart></fd-mem-chart>`;
    }
  }
  render() {
    if (!this._enabled) {
      return null;
    }
    return html`
      <fd-panel position="top-right">
        <fd-toolbar>
          <fd-inspect
            .active=${this._inspectActive}
            @change=${this._handleInspectChange}
          ></fd-inspect>
          <fd-switch
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
          <fd-toggle-button
            .active=${this._activeWidgets.includes("DOM_STATS")}
            @change=${this._handleDomStatsChange}
          >
            <fd-icon name="domTree"></fd-icon>
          </fd-toggle-button>
        </fd-toolbar>
        ${this._activeWidgets.map((widget) => this._renderWidget(widget))}
      </fd-panel>
      ${this._mutationScanActive ? html`<fd-mutation-canvas .active=${true}></fd-mutation-canvas>` : null}
      <fd-component-inspector
        .active=${this._inspectActive}
        @change=${this._handleInspectorChange}
      ></fd-component-inspector>
    `;
  }
  static styles = [
    designTokens,
    css`
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
}
__legacyDecorateClassTS([
  state()
], FrontendDevtools.prototype, "_inspectActive", undefined);
__legacyDecorateClassTS([
  state()
], FrontendDevtools.prototype, "_mutationScanActive", undefined);
__legacyDecorateClassTS([
  state()
], FrontendDevtools.prototype, "_activeWidgets", undefined);
FrontendDevtools = __legacyDecorateClassTS([
  customElement("frontend-devtools")
], FrontendDevtools);

// frontend-devtools-bootstrap.ts
if (!document.querySelector("frontend-devtools")) {
  document.body.appendChild(document.createElement("frontend-devtools"));
}
