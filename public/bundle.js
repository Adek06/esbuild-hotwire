(() => {
  // node_modules/@stimulus/core/dist/event_listener.js
  var EventListener = function() {
    function EventListener2(eventTarget, eventName, eventOptions) {
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this.eventOptions = eventOptions;
      this.unorderedBindings = new Set();
    }
    EventListener2.prototype.connect = function() {
      this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    };
    EventListener2.prototype.disconnect = function() {
      this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    };
    EventListener2.prototype.bindingConnected = function(binding) {
      this.unorderedBindings.add(binding);
    };
    EventListener2.prototype.bindingDisconnected = function(binding) {
      this.unorderedBindings.delete(binding);
    };
    EventListener2.prototype.handleEvent = function(event) {
      var extendedEvent = extendEvent(event);
      for (var _i = 0, _a = this.bindings; _i < _a.length; _i++) {
        var binding = _a[_i];
        if (extendedEvent.immediatePropagationStopped) {
          break;
        } else {
          binding.handleEvent(extendedEvent);
        }
      }
    };
    Object.defineProperty(EventListener2.prototype, "bindings", {
      get: function() {
        return Array.from(this.unorderedBindings).sort(function(left, right) {
          var leftIndex = left.index, rightIndex = right.index;
          return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
        });
      },
      enumerable: false,
      configurable: true
    });
    return EventListener2;
  }();
  function extendEvent(event) {
    if ("immediatePropagationStopped" in event) {
      return event;
    } else {
      var stopImmediatePropagation_1 = event.stopImmediatePropagation;
      return Object.assign(event, {
        immediatePropagationStopped: false,
        stopImmediatePropagation: function() {
          this.immediatePropagationStopped = true;
          stopImmediatePropagation_1.call(this);
        }
      });
    }
  }

  // node_modules/@stimulus/core/dist/dispatcher.js
  var Dispatcher = function() {
    function Dispatcher2(application2) {
      this.application = application2;
      this.eventListenerMaps = new Map();
      this.started = false;
    }
    Dispatcher2.prototype.start = function() {
      if (!this.started) {
        this.started = true;
        this.eventListeners.forEach(function(eventListener) {
          return eventListener.connect();
        });
      }
    };
    Dispatcher2.prototype.stop = function() {
      if (this.started) {
        this.started = false;
        this.eventListeners.forEach(function(eventListener) {
          return eventListener.disconnect();
        });
      }
    };
    Object.defineProperty(Dispatcher2.prototype, "eventListeners", {
      get: function() {
        return Array.from(this.eventListenerMaps.values()).reduce(function(listeners, map) {
          return listeners.concat(Array.from(map.values()));
        }, []);
      },
      enumerable: false,
      configurable: true
    });
    Dispatcher2.prototype.bindingConnected = function(binding) {
      this.fetchEventListenerForBinding(binding).bindingConnected(binding);
    };
    Dispatcher2.prototype.bindingDisconnected = function(binding) {
      this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
    };
    Dispatcher2.prototype.handleError = function(error2, message, detail) {
      if (detail === void 0) {
        detail = {};
      }
      this.application.handleError(error2, "Error " + message, detail);
    };
    Dispatcher2.prototype.fetchEventListenerForBinding = function(binding) {
      var eventTarget = binding.eventTarget, eventName = binding.eventName, eventOptions = binding.eventOptions;
      return this.fetchEventListener(eventTarget, eventName, eventOptions);
    };
    Dispatcher2.prototype.fetchEventListener = function(eventTarget, eventName, eventOptions) {
      var eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      var cacheKey = this.cacheKey(eventName, eventOptions);
      var eventListener = eventListenerMap.get(cacheKey);
      if (!eventListener) {
        eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
        eventListenerMap.set(cacheKey, eventListener);
      }
      return eventListener;
    };
    Dispatcher2.prototype.createEventListener = function(eventTarget, eventName, eventOptions) {
      var eventListener = new EventListener(eventTarget, eventName, eventOptions);
      if (this.started) {
        eventListener.connect();
      }
      return eventListener;
    };
    Dispatcher2.prototype.fetchEventListenerMapForEventTarget = function(eventTarget) {
      var eventListenerMap = this.eventListenerMaps.get(eventTarget);
      if (!eventListenerMap) {
        eventListenerMap = new Map();
        this.eventListenerMaps.set(eventTarget, eventListenerMap);
      }
      return eventListenerMap;
    };
    Dispatcher2.prototype.cacheKey = function(eventName, eventOptions) {
      var parts = [eventName];
      Object.keys(eventOptions).sort().forEach(function(key) {
        parts.push("" + (eventOptions[key] ? "" : "!") + key);
      });
      return parts.join(":");
    };
    return Dispatcher2;
  }();

  // node_modules/@stimulus/core/dist/action_descriptor.js
  var descriptorPattern = /^((.+?)(@(window|document))?->)?(.+?)(#([^:]+?))(:(.+))?$/;
  function parseActionDescriptorString(descriptorString) {
    var source = descriptorString.trim();
    var matches = source.match(descriptorPattern) || [];
    return {
      eventTarget: parseEventTarget(matches[4]),
      eventName: matches[2],
      eventOptions: matches[9] ? parseEventOptions(matches[9]) : {},
      identifier: matches[5],
      methodName: matches[7]
    };
  }
  function parseEventTarget(eventTargetName) {
    if (eventTargetName == "window") {
      return window;
    } else if (eventTargetName == "document") {
      return document;
    }
  }
  function parseEventOptions(eventOptions) {
    return eventOptions.split(":").reduce(function(options, token) {
      var _a;
      return Object.assign(options, (_a = {}, _a[token.replace(/^!/, "")] = !/^!/.test(token), _a));
    }, {});
  }
  function stringifyEventTarget(eventTarget) {
    if (eventTarget == window) {
      return "window";
    } else if (eventTarget == document) {
      return "document";
    }
  }

  // node_modules/@stimulus/core/dist/action.js
  var Action = function() {
    function Action2(element, index, descriptor) {
      this.element = element;
      this.index = index;
      this.eventTarget = descriptor.eventTarget || element;
      this.eventName = descriptor.eventName || getDefaultEventNameForElement(element) || error("missing event name");
      this.eventOptions = descriptor.eventOptions || {};
      this.identifier = descriptor.identifier || error("missing identifier");
      this.methodName = descriptor.methodName || error("missing method name");
    }
    Action2.forToken = function(token) {
      return new this(token.element, token.index, parseActionDescriptorString(token.content));
    };
    Action2.prototype.toString = function() {
      var eventNameSuffix = this.eventTargetName ? "@" + this.eventTargetName : "";
      return "" + this.eventName + eventNameSuffix + "->" + this.identifier + "#" + this.methodName;
    };
    Object.defineProperty(Action2.prototype, "eventTargetName", {
      get: function() {
        return stringifyEventTarget(this.eventTarget);
      },
      enumerable: false,
      configurable: true
    });
    return Action2;
  }();
  var defaultEventNames = {
    "a": function(e) {
      return "click";
    },
    "button": function(e) {
      return "click";
    },
    "form": function(e) {
      return "submit";
    },
    "input": function(e) {
      return e.getAttribute("type") == "submit" ? "click" : "input";
    },
    "select": function(e) {
      return "change";
    },
    "textarea": function(e) {
      return "input";
    }
  };
  function getDefaultEventNameForElement(element) {
    var tagName = element.tagName.toLowerCase();
    if (tagName in defaultEventNames) {
      return defaultEventNames[tagName](element);
    }
  }
  function error(message) {
    throw new Error(message);
  }

  // node_modules/@stimulus/core/dist/binding.js
  var Binding = function() {
    function Binding2(context, action) {
      this.context = context;
      this.action = action;
    }
    Object.defineProperty(Binding2.prototype, "index", {
      get: function() {
        return this.action.index;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "eventTarget", {
      get: function() {
        return this.action.eventTarget;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "eventOptions", {
      get: function() {
        return this.action.eventOptions;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "identifier", {
      get: function() {
        return this.context.identifier;
      },
      enumerable: false,
      configurable: true
    });
    Binding2.prototype.handleEvent = function(event) {
      if (this.willBeInvokedByEvent(event)) {
        this.invokeWithEvent(event);
      }
    };
    Object.defineProperty(Binding2.prototype, "eventName", {
      get: function() {
        return this.action.eventName;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "method", {
      get: function() {
        var method = this.controller[this.methodName];
        if (typeof method == "function") {
          return method;
        }
        throw new Error('Action "' + this.action + '" references undefined method "' + this.methodName + '"');
      },
      enumerable: false,
      configurable: true
    });
    Binding2.prototype.invokeWithEvent = function(event) {
      try {
        this.method.call(this.controller, event);
      } catch (error2) {
        var _a = this, identifier = _a.identifier, controller = _a.controller, element = _a.element, index = _a.index;
        var detail = { identifier, controller, element, index, event };
        this.context.handleError(error2, 'invoking action "' + this.action + '"', detail);
      }
    };
    Binding2.prototype.willBeInvokedByEvent = function(event) {
      var eventTarget = event.target;
      if (this.element === eventTarget) {
        return true;
      } else if (eventTarget instanceof Element && this.element.contains(eventTarget)) {
        return this.scope.containsElement(eventTarget);
      } else {
        return this.scope.containsElement(this.action.element);
      }
    };
    Object.defineProperty(Binding2.prototype, "controller", {
      get: function() {
        return this.context.controller;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "methodName", {
      get: function() {
        return this.action.methodName;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "element", {
      get: function() {
        return this.scope.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Binding2.prototype, "scope", {
      get: function() {
        return this.context.scope;
      },
      enumerable: false,
      configurable: true
    });
    return Binding2;
  }();

  // node_modules/@stimulus/mutation-observers/dist/element_observer.js
  var ElementObserver = function() {
    function ElementObserver2(element, delegate) {
      var _this = this;
      this.element = element;
      this.started = false;
      this.delegate = delegate;
      this.elements = new Set();
      this.mutationObserver = new MutationObserver(function(mutations) {
        return _this.processMutations(mutations);
      });
    }
    ElementObserver2.prototype.start = function() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, { attributes: true, childList: true, subtree: true });
        this.refresh();
      }
    };
    ElementObserver2.prototype.stop = function() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    };
    ElementObserver2.prototype.refresh = function() {
      if (this.started) {
        var matches = new Set(this.matchElementsInTree());
        for (var _i = 0, _a = Array.from(this.elements); _i < _a.length; _i++) {
          var element = _a[_i];
          if (!matches.has(element)) {
            this.removeElement(element);
          }
        }
        for (var _b = 0, _c = Array.from(matches); _b < _c.length; _b++) {
          var element = _c[_b];
          this.addElement(element);
        }
      }
    };
    ElementObserver2.prototype.processMutations = function(mutations) {
      if (this.started) {
        for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
          var mutation = mutations_1[_i];
          this.processMutation(mutation);
        }
      }
    };
    ElementObserver2.prototype.processMutation = function(mutation) {
      if (mutation.type == "attributes") {
        this.processAttributeChange(mutation.target, mutation.attributeName);
      } else if (mutation.type == "childList") {
        this.processRemovedNodes(mutation.removedNodes);
        this.processAddedNodes(mutation.addedNodes);
      }
    };
    ElementObserver2.prototype.processAttributeChange = function(node, attributeName) {
      var element = node;
      if (this.elements.has(element)) {
        if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
          this.delegate.elementAttributeChanged(element, attributeName);
        } else {
          this.removeElement(element);
        }
      } else if (this.matchElement(element)) {
        this.addElement(element);
      }
    };
    ElementObserver2.prototype.processRemovedNodes = function(nodes) {
      for (var _i = 0, _a = Array.from(nodes); _i < _a.length; _i++) {
        var node = _a[_i];
        var element = this.elementFromNode(node);
        if (element) {
          this.processTree(element, this.removeElement);
        }
      }
    };
    ElementObserver2.prototype.processAddedNodes = function(nodes) {
      for (var _i = 0, _a = Array.from(nodes); _i < _a.length; _i++) {
        var node = _a[_i];
        var element = this.elementFromNode(node);
        if (element && this.elementIsActive(element)) {
          this.processTree(element, this.addElement);
        }
      }
    };
    ElementObserver2.prototype.matchElement = function(element) {
      return this.delegate.matchElement(element);
    };
    ElementObserver2.prototype.matchElementsInTree = function(tree) {
      if (tree === void 0) {
        tree = this.element;
      }
      return this.delegate.matchElementsInTree(tree);
    };
    ElementObserver2.prototype.processTree = function(tree, processor) {
      for (var _i = 0, _a = this.matchElementsInTree(tree); _i < _a.length; _i++) {
        var element = _a[_i];
        processor.call(this, element);
      }
    };
    ElementObserver2.prototype.elementFromNode = function(node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        return node;
      }
    };
    ElementObserver2.prototype.elementIsActive = function(element) {
      if (element.isConnected != this.element.isConnected) {
        return false;
      } else {
        return this.element.contains(element);
      }
    };
    ElementObserver2.prototype.addElement = function(element) {
      if (!this.elements.has(element)) {
        if (this.elementIsActive(element)) {
          this.elements.add(element);
          if (this.delegate.elementMatched) {
            this.delegate.elementMatched(element);
          }
        }
      }
    };
    ElementObserver2.prototype.removeElement = function(element) {
      if (this.elements.has(element)) {
        this.elements.delete(element);
        if (this.delegate.elementUnmatched) {
          this.delegate.elementUnmatched(element);
        }
      }
    };
    return ElementObserver2;
  }();

  // node_modules/@stimulus/mutation-observers/dist/attribute_observer.js
  var AttributeObserver = function() {
    function AttributeObserver2(element, attributeName, delegate) {
      this.attributeName = attributeName;
      this.delegate = delegate;
      this.elementObserver = new ElementObserver(element, this);
    }
    Object.defineProperty(AttributeObserver2.prototype, "element", {
      get: function() {
        return this.elementObserver.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(AttributeObserver2.prototype, "selector", {
      get: function() {
        return "[" + this.attributeName + "]";
      },
      enumerable: false,
      configurable: true
    });
    AttributeObserver2.prototype.start = function() {
      this.elementObserver.start();
    };
    AttributeObserver2.prototype.stop = function() {
      this.elementObserver.stop();
    };
    AttributeObserver2.prototype.refresh = function() {
      this.elementObserver.refresh();
    };
    Object.defineProperty(AttributeObserver2.prototype, "started", {
      get: function() {
        return this.elementObserver.started;
      },
      enumerable: false,
      configurable: true
    });
    AttributeObserver2.prototype.matchElement = function(element) {
      return element.hasAttribute(this.attributeName);
    };
    AttributeObserver2.prototype.matchElementsInTree = function(tree) {
      var match = this.matchElement(tree) ? [tree] : [];
      var matches = Array.from(tree.querySelectorAll(this.selector));
      return match.concat(matches);
    };
    AttributeObserver2.prototype.elementMatched = function(element) {
      if (this.delegate.elementMatchedAttribute) {
        this.delegate.elementMatchedAttribute(element, this.attributeName);
      }
    };
    AttributeObserver2.prototype.elementUnmatched = function(element) {
      if (this.delegate.elementUnmatchedAttribute) {
        this.delegate.elementUnmatchedAttribute(element, this.attributeName);
      }
    };
    AttributeObserver2.prototype.elementAttributeChanged = function(element, attributeName) {
      if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
        this.delegate.elementAttributeValueChanged(element, attributeName);
      }
    };
    return AttributeObserver2;
  }();

  // node_modules/@stimulus/mutation-observers/dist/string_map_observer.js
  var StringMapObserver = function() {
    function StringMapObserver2(element, delegate) {
      var _this = this;
      this.element = element;
      this.delegate = delegate;
      this.started = false;
      this.stringMap = new Map();
      this.mutationObserver = new MutationObserver(function(mutations) {
        return _this.processMutations(mutations);
      });
    }
    StringMapObserver2.prototype.start = function() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, { attributes: true });
        this.refresh();
      }
    };
    StringMapObserver2.prototype.stop = function() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    };
    StringMapObserver2.prototype.refresh = function() {
      if (this.started) {
        for (var _i = 0, _a = this.knownAttributeNames; _i < _a.length; _i++) {
          var attributeName = _a[_i];
          this.refreshAttribute(attributeName);
        }
      }
    };
    StringMapObserver2.prototype.processMutations = function(mutations) {
      if (this.started) {
        for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
          var mutation = mutations_1[_i];
          this.processMutation(mutation);
        }
      }
    };
    StringMapObserver2.prototype.processMutation = function(mutation) {
      var attributeName = mutation.attributeName;
      if (attributeName) {
        this.refreshAttribute(attributeName);
      }
    };
    StringMapObserver2.prototype.refreshAttribute = function(attributeName) {
      var key = this.delegate.getStringMapKeyForAttribute(attributeName);
      if (key != null) {
        if (!this.stringMap.has(attributeName)) {
          this.stringMapKeyAdded(key, attributeName);
        }
        var value = this.element.getAttribute(attributeName);
        if (this.stringMap.get(attributeName) != value) {
          this.stringMapValueChanged(value, key);
        }
        if (value == null) {
          this.stringMap.delete(attributeName);
          this.stringMapKeyRemoved(key, attributeName);
        } else {
          this.stringMap.set(attributeName, value);
        }
      }
    };
    StringMapObserver2.prototype.stringMapKeyAdded = function(key, attributeName) {
      if (this.delegate.stringMapKeyAdded) {
        this.delegate.stringMapKeyAdded(key, attributeName);
      }
    };
    StringMapObserver2.prototype.stringMapValueChanged = function(value, key) {
      if (this.delegate.stringMapValueChanged) {
        this.delegate.stringMapValueChanged(value, key);
      }
    };
    StringMapObserver2.prototype.stringMapKeyRemoved = function(key, attributeName) {
      if (this.delegate.stringMapKeyRemoved) {
        this.delegate.stringMapKeyRemoved(key, attributeName);
      }
    };
    Object.defineProperty(StringMapObserver2.prototype, "knownAttributeNames", {
      get: function() {
        return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)));
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(StringMapObserver2.prototype, "currentAttributeNames", {
      get: function() {
        return Array.from(this.element.attributes).map(function(attribute) {
          return attribute.name;
        });
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(StringMapObserver2.prototype, "recordedAttributeNames", {
      get: function() {
        return Array.from(this.stringMap.keys());
      },
      enumerable: false,
      configurable: true
    });
    return StringMapObserver2;
  }();

  // node_modules/@stimulus/multimap/dist/set_operations.js
  function add(map, key, value) {
    fetch(map, key).add(value);
  }
  function del(map, key, value) {
    fetch(map, key).delete(value);
    prune(map, key);
  }
  function fetch(map, key) {
    var values = map.get(key);
    if (!values) {
      values = new Set();
      map.set(key, values);
    }
    return values;
  }
  function prune(map, key) {
    var values = map.get(key);
    if (values != null && values.size == 0) {
      map.delete(key);
    }
  }

  // node_modules/@stimulus/multimap/dist/multimap.js
  var Multimap = function() {
    function Multimap2() {
      this.valuesByKey = new Map();
    }
    Object.defineProperty(Multimap2.prototype, "values", {
      get: function() {
        var sets = Array.from(this.valuesByKey.values());
        return sets.reduce(function(values, set) {
          return values.concat(Array.from(set));
        }, []);
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Multimap2.prototype, "size", {
      get: function() {
        var sets = Array.from(this.valuesByKey.values());
        return sets.reduce(function(size, set) {
          return size + set.size;
        }, 0);
      },
      enumerable: false,
      configurable: true
    });
    Multimap2.prototype.add = function(key, value) {
      add(this.valuesByKey, key, value);
    };
    Multimap2.prototype.delete = function(key, value) {
      del(this.valuesByKey, key, value);
    };
    Multimap2.prototype.has = function(key, value) {
      var values = this.valuesByKey.get(key);
      return values != null && values.has(value);
    };
    Multimap2.prototype.hasKey = function(key) {
      return this.valuesByKey.has(key);
    };
    Multimap2.prototype.hasValue = function(value) {
      var sets = Array.from(this.valuesByKey.values());
      return sets.some(function(set) {
        return set.has(value);
      });
    };
    Multimap2.prototype.getValuesForKey = function(key) {
      var values = this.valuesByKey.get(key);
      return values ? Array.from(values) : [];
    };
    Multimap2.prototype.getKeysForValue = function(value) {
      return Array.from(this.valuesByKey).filter(function(_a) {
        var key = _a[0], values = _a[1];
        return values.has(value);
      }).map(function(_a) {
        var key = _a[0], values = _a[1];
        return key;
      });
    };
    return Multimap2;
  }();

  // node_modules/@stimulus/multimap/dist/indexed_multimap.js
  var __extends = function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  var IndexedMultimap = function(_super) {
    __extends(IndexedMultimap2, _super);
    function IndexedMultimap2() {
      var _this = _super.call(this) || this;
      _this.keysByValue = new Map();
      return _this;
    }
    Object.defineProperty(IndexedMultimap2.prototype, "values", {
      get: function() {
        return Array.from(this.keysByValue.keys());
      },
      enumerable: false,
      configurable: true
    });
    IndexedMultimap2.prototype.add = function(key, value) {
      _super.prototype.add.call(this, key, value);
      add(this.keysByValue, value, key);
    };
    IndexedMultimap2.prototype.delete = function(key, value) {
      _super.prototype.delete.call(this, key, value);
      del(this.keysByValue, value, key);
    };
    IndexedMultimap2.prototype.hasValue = function(value) {
      return this.keysByValue.has(value);
    };
    IndexedMultimap2.prototype.getKeysForValue = function(value) {
      var set = this.keysByValue.get(value);
      return set ? Array.from(set) : [];
    };
    return IndexedMultimap2;
  }(Multimap);

  // node_modules/@stimulus/mutation-observers/dist/token_list_observer.js
  var TokenListObserver = function() {
    function TokenListObserver2(element, attributeName, delegate) {
      this.attributeObserver = new AttributeObserver(element, attributeName, this);
      this.delegate = delegate;
      this.tokensByElement = new Multimap();
    }
    Object.defineProperty(TokenListObserver2.prototype, "started", {
      get: function() {
        return this.attributeObserver.started;
      },
      enumerable: false,
      configurable: true
    });
    TokenListObserver2.prototype.start = function() {
      this.attributeObserver.start();
    };
    TokenListObserver2.prototype.stop = function() {
      this.attributeObserver.stop();
    };
    TokenListObserver2.prototype.refresh = function() {
      this.attributeObserver.refresh();
    };
    Object.defineProperty(TokenListObserver2.prototype, "element", {
      get: function() {
        return this.attributeObserver.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(TokenListObserver2.prototype, "attributeName", {
      get: function() {
        return this.attributeObserver.attributeName;
      },
      enumerable: false,
      configurable: true
    });
    TokenListObserver2.prototype.elementMatchedAttribute = function(element) {
      this.tokensMatched(this.readTokensForElement(element));
    };
    TokenListObserver2.prototype.elementAttributeValueChanged = function(element) {
      var _a = this.refreshTokensForElement(element), unmatchedTokens = _a[0], matchedTokens = _a[1];
      this.tokensUnmatched(unmatchedTokens);
      this.tokensMatched(matchedTokens);
    };
    TokenListObserver2.prototype.elementUnmatchedAttribute = function(element) {
      this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    };
    TokenListObserver2.prototype.tokensMatched = function(tokens) {
      var _this = this;
      tokens.forEach(function(token) {
        return _this.tokenMatched(token);
      });
    };
    TokenListObserver2.prototype.tokensUnmatched = function(tokens) {
      var _this = this;
      tokens.forEach(function(token) {
        return _this.tokenUnmatched(token);
      });
    };
    TokenListObserver2.prototype.tokenMatched = function(token) {
      this.delegate.tokenMatched(token);
      this.tokensByElement.add(token.element, token);
    };
    TokenListObserver2.prototype.tokenUnmatched = function(token) {
      this.delegate.tokenUnmatched(token);
      this.tokensByElement.delete(token.element, token);
    };
    TokenListObserver2.prototype.refreshTokensForElement = function(element) {
      var previousTokens = this.tokensByElement.getValuesForKey(element);
      var currentTokens = this.readTokensForElement(element);
      var firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(function(_a) {
        var previousToken = _a[0], currentToken = _a[1];
        return !tokensAreEqual(previousToken, currentToken);
      });
      if (firstDifferingIndex == -1) {
        return [[], []];
      } else {
        return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
      }
    };
    TokenListObserver2.prototype.readTokensForElement = function(element) {
      var attributeName = this.attributeName;
      var tokenString = element.getAttribute(attributeName) || "";
      return parseTokenString(tokenString, element, attributeName);
    };
    return TokenListObserver2;
  }();
  function parseTokenString(tokenString, element, attributeName) {
    return tokenString.trim().split(/\s+/).filter(function(content) {
      return content.length;
    }).map(function(content, index) {
      return { element, attributeName, content, index };
    });
  }
  function zip(left, right) {
    var length = Math.max(left.length, right.length);
    return Array.from({ length }, function(_, index) {
      return [left[index], right[index]];
    });
  }
  function tokensAreEqual(left, right) {
    return left && right && left.index == right.index && left.content == right.content;
  }

  // node_modules/@stimulus/mutation-observers/dist/value_list_observer.js
  var ValueListObserver = function() {
    function ValueListObserver2(element, attributeName, delegate) {
      this.tokenListObserver = new TokenListObserver(element, attributeName, this);
      this.delegate = delegate;
      this.parseResultsByToken = new WeakMap();
      this.valuesByTokenByElement = new WeakMap();
    }
    Object.defineProperty(ValueListObserver2.prototype, "started", {
      get: function() {
        return this.tokenListObserver.started;
      },
      enumerable: false,
      configurable: true
    });
    ValueListObserver2.prototype.start = function() {
      this.tokenListObserver.start();
    };
    ValueListObserver2.prototype.stop = function() {
      this.tokenListObserver.stop();
    };
    ValueListObserver2.prototype.refresh = function() {
      this.tokenListObserver.refresh();
    };
    Object.defineProperty(ValueListObserver2.prototype, "element", {
      get: function() {
        return this.tokenListObserver.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(ValueListObserver2.prototype, "attributeName", {
      get: function() {
        return this.tokenListObserver.attributeName;
      },
      enumerable: false,
      configurable: true
    });
    ValueListObserver2.prototype.tokenMatched = function(token) {
      var element = token.element;
      var value = this.fetchParseResultForToken(token).value;
      if (value) {
        this.fetchValuesByTokenForElement(element).set(token, value);
        this.delegate.elementMatchedValue(element, value);
      }
    };
    ValueListObserver2.prototype.tokenUnmatched = function(token) {
      var element = token.element;
      var value = this.fetchParseResultForToken(token).value;
      if (value) {
        this.fetchValuesByTokenForElement(element).delete(token);
        this.delegate.elementUnmatchedValue(element, value);
      }
    };
    ValueListObserver2.prototype.fetchParseResultForToken = function(token) {
      var parseResult = this.parseResultsByToken.get(token);
      if (!parseResult) {
        parseResult = this.parseToken(token);
        this.parseResultsByToken.set(token, parseResult);
      }
      return parseResult;
    };
    ValueListObserver2.prototype.fetchValuesByTokenForElement = function(element) {
      var valuesByToken = this.valuesByTokenByElement.get(element);
      if (!valuesByToken) {
        valuesByToken = new Map();
        this.valuesByTokenByElement.set(element, valuesByToken);
      }
      return valuesByToken;
    };
    ValueListObserver2.prototype.parseToken = function(token) {
      try {
        var value = this.delegate.parseValueForToken(token);
        return { value };
      } catch (error2) {
        return { error: error2 };
      }
    };
    return ValueListObserver2;
  }();

  // node_modules/@stimulus/core/dist/binding_observer.js
  var BindingObserver = function() {
    function BindingObserver2(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.bindingsByAction = new Map();
    }
    BindingObserver2.prototype.start = function() {
      if (!this.valueListObserver) {
        this.valueListObserver = new ValueListObserver(this.element, this.actionAttribute, this);
        this.valueListObserver.start();
      }
    };
    BindingObserver2.prototype.stop = function() {
      if (this.valueListObserver) {
        this.valueListObserver.stop();
        delete this.valueListObserver;
        this.disconnectAllActions();
      }
    };
    Object.defineProperty(BindingObserver2.prototype, "element", {
      get: function() {
        return this.context.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BindingObserver2.prototype, "identifier", {
      get: function() {
        return this.context.identifier;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BindingObserver2.prototype, "actionAttribute", {
      get: function() {
        return this.schema.actionAttribute;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BindingObserver2.prototype, "schema", {
      get: function() {
        return this.context.schema;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BindingObserver2.prototype, "bindings", {
      get: function() {
        return Array.from(this.bindingsByAction.values());
      },
      enumerable: false,
      configurable: true
    });
    BindingObserver2.prototype.connectAction = function(action) {
      var binding = new Binding(this.context, action);
      this.bindingsByAction.set(action, binding);
      this.delegate.bindingConnected(binding);
    };
    BindingObserver2.prototype.disconnectAction = function(action) {
      var binding = this.bindingsByAction.get(action);
      if (binding) {
        this.bindingsByAction.delete(action);
        this.delegate.bindingDisconnected(binding);
      }
    };
    BindingObserver2.prototype.disconnectAllActions = function() {
      var _this = this;
      this.bindings.forEach(function(binding) {
        return _this.delegate.bindingDisconnected(binding);
      });
      this.bindingsByAction.clear();
    };
    BindingObserver2.prototype.parseValueForToken = function(token) {
      var action = Action.forToken(token);
      if (action.identifier == this.identifier) {
        return action;
      }
    };
    BindingObserver2.prototype.elementMatchedValue = function(element, action) {
      this.connectAction(action);
    };
    BindingObserver2.prototype.elementUnmatchedValue = function(element, action) {
      this.disconnectAction(action);
    };
    return BindingObserver2;
  }();

  // node_modules/@stimulus/core/dist/value_observer.js
  var ValueObserver = function() {
    function ValueObserver2(context, receiver) {
      this.context = context;
      this.receiver = receiver;
      this.stringMapObserver = new StringMapObserver(this.element, this);
      this.valueDescriptorMap = this.controller.valueDescriptorMap;
      this.invokeChangedCallbacksForDefaultValues();
    }
    ValueObserver2.prototype.start = function() {
      this.stringMapObserver.start();
    };
    ValueObserver2.prototype.stop = function() {
      this.stringMapObserver.stop();
    };
    Object.defineProperty(ValueObserver2.prototype, "element", {
      get: function() {
        return this.context.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(ValueObserver2.prototype, "controller", {
      get: function() {
        return this.context.controller;
      },
      enumerable: false,
      configurable: true
    });
    ValueObserver2.prototype.getStringMapKeyForAttribute = function(attributeName) {
      if (attributeName in this.valueDescriptorMap) {
        return this.valueDescriptorMap[attributeName].name;
      }
    };
    ValueObserver2.prototype.stringMapValueChanged = function(attributeValue, name) {
      this.invokeChangedCallbackForValue(name);
    };
    ValueObserver2.prototype.invokeChangedCallbacksForDefaultValues = function() {
      for (var _i = 0, _a = this.valueDescriptors; _i < _a.length; _i++) {
        var _b = _a[_i], key = _b.key, name_1 = _b.name, defaultValue = _b.defaultValue;
        if (defaultValue != void 0 && !this.controller.data.has(key)) {
          this.invokeChangedCallbackForValue(name_1);
        }
      }
    };
    ValueObserver2.prototype.invokeChangedCallbackForValue = function(name) {
      var methodName = name + "Changed";
      var method = this.receiver[methodName];
      if (typeof method == "function") {
        var value = this.receiver[name];
        method.call(this.receiver, value);
      }
    };
    Object.defineProperty(ValueObserver2.prototype, "valueDescriptors", {
      get: function() {
        var valueDescriptorMap = this.valueDescriptorMap;
        return Object.keys(valueDescriptorMap).map(function(key) {
          return valueDescriptorMap[key];
        });
      },
      enumerable: false,
      configurable: true
    });
    return ValueObserver2;
  }();

  // node_modules/@stimulus/core/dist/context.js
  var Context = function() {
    function Context2(module, scope) {
      this.module = module;
      this.scope = scope;
      this.controller = new module.controllerConstructor(this);
      this.bindingObserver = new BindingObserver(this, this.dispatcher);
      this.valueObserver = new ValueObserver(this, this.controller);
      try {
        this.controller.initialize();
      } catch (error2) {
        this.handleError(error2, "initializing controller");
      }
    }
    Context2.prototype.connect = function() {
      this.bindingObserver.start();
      this.valueObserver.start();
      try {
        this.controller.connect();
      } catch (error2) {
        this.handleError(error2, "connecting controller");
      }
    };
    Context2.prototype.disconnect = function() {
      try {
        this.controller.disconnect();
      } catch (error2) {
        this.handleError(error2, "disconnecting controller");
      }
      this.valueObserver.stop();
      this.bindingObserver.stop();
    };
    Object.defineProperty(Context2.prototype, "application", {
      get: function() {
        return this.module.application;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Context2.prototype, "identifier", {
      get: function() {
        return this.module.identifier;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Context2.prototype, "schema", {
      get: function() {
        return this.application.schema;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Context2.prototype, "dispatcher", {
      get: function() {
        return this.application.dispatcher;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Context2.prototype, "element", {
      get: function() {
        return this.scope.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Context2.prototype, "parentElement", {
      get: function() {
        return this.element.parentElement;
      },
      enumerable: false,
      configurable: true
    });
    Context2.prototype.handleError = function(error2, message, detail) {
      if (detail === void 0) {
        detail = {};
      }
      var _a = this, identifier = _a.identifier, controller = _a.controller, element = _a.element;
      detail = Object.assign({ identifier, controller, element }, detail);
      this.application.handleError(error2, "Error " + message, detail);
    };
    return Context2;
  }();

  // node_modules/@stimulus/core/dist/inheritable_statics.js
  function readInheritableStaticArrayValues(constructor, propertyName) {
    var ancestors = getAncestorsForConstructor(constructor);
    return Array.from(ancestors.reduce(function(values, constructor2) {
      getOwnStaticArrayValues(constructor2, propertyName).forEach(function(name) {
        return values.add(name);
      });
      return values;
    }, new Set()));
  }
  function readInheritableStaticObjectPairs(constructor, propertyName) {
    var ancestors = getAncestorsForConstructor(constructor);
    return ancestors.reduce(function(pairs, constructor2) {
      pairs.push.apply(pairs, getOwnStaticObjectPairs(constructor2, propertyName));
      return pairs;
    }, []);
  }
  function getAncestorsForConstructor(constructor) {
    var ancestors = [];
    while (constructor) {
      ancestors.push(constructor);
      constructor = Object.getPrototypeOf(constructor);
    }
    return ancestors.reverse();
  }
  function getOwnStaticArrayValues(constructor, propertyName) {
    var definition = constructor[propertyName];
    return Array.isArray(definition) ? definition : [];
  }
  function getOwnStaticObjectPairs(constructor, propertyName) {
    var definition = constructor[propertyName];
    return definition ? Object.keys(definition).map(function(key) {
      return [key, definition[key]];
    }) : [];
  }

  // node_modules/@stimulus/core/dist/blessing.js
  var __extends2 = function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  var __spreadArrays = function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
  function bless(constructor) {
    return shadow(constructor, getBlessedProperties(constructor));
  }
  function shadow(constructor, properties) {
    var shadowConstructor = extend(constructor);
    var shadowProperties = getShadowProperties(constructor.prototype, properties);
    Object.defineProperties(shadowConstructor.prototype, shadowProperties);
    return shadowConstructor;
  }
  function getBlessedProperties(constructor) {
    var blessings = readInheritableStaticArrayValues(constructor, "blessings");
    return blessings.reduce(function(blessedProperties, blessing) {
      var properties = blessing(constructor);
      for (var key in properties) {
        var descriptor = blessedProperties[key] || {};
        blessedProperties[key] = Object.assign(descriptor, properties[key]);
      }
      return blessedProperties;
    }, {});
  }
  function getShadowProperties(prototype, properties) {
    return getOwnKeys(properties).reduce(function(shadowProperties, key) {
      var _a;
      var descriptor = getShadowedDescriptor(prototype, properties, key);
      if (descriptor) {
        Object.assign(shadowProperties, (_a = {}, _a[key] = descriptor, _a));
      }
      return shadowProperties;
    }, {});
  }
  function getShadowedDescriptor(prototype, properties, key) {
    var shadowingDescriptor = Object.getOwnPropertyDescriptor(prototype, key);
    var shadowedByValue = shadowingDescriptor && "value" in shadowingDescriptor;
    if (!shadowedByValue) {
      var descriptor = Object.getOwnPropertyDescriptor(properties, key).value;
      if (shadowingDescriptor) {
        descriptor.get = shadowingDescriptor.get || descriptor.get;
        descriptor.set = shadowingDescriptor.set || descriptor.set;
      }
      return descriptor;
    }
  }
  var getOwnKeys = function() {
    if (typeof Object.getOwnPropertySymbols == "function") {
      return function(object) {
        return __spreadArrays(Object.getOwnPropertyNames(object), Object.getOwnPropertySymbols(object));
      };
    } else {
      return Object.getOwnPropertyNames;
    }
  }();
  var extend = function() {
    function extendWithReflect(constructor) {
      function extended() {
        var _newTarget = this && this instanceof extended ? this.constructor : void 0;
        return Reflect.construct(constructor, arguments, _newTarget);
      }
      extended.prototype = Object.create(constructor.prototype, {
        constructor: { value: extended }
      });
      Reflect.setPrototypeOf(extended, constructor);
      return extended;
    }
    function testReflectExtension() {
      var a = function() {
        this.a.call(this);
      };
      var b = extendWithReflect(a);
      b.prototype.a = function() {
      };
      return new b();
    }
    try {
      testReflectExtension();
      return extendWithReflect;
    } catch (error2) {
      return function(constructor) {
        return function(_super) {
          __extends2(extended, _super);
          function extended() {
            return _super !== null && _super.apply(this, arguments) || this;
          }
          return extended;
        }(constructor);
      };
    }
  }();

  // node_modules/@stimulus/core/dist/definition.js
  function blessDefinition(definition) {
    return {
      identifier: definition.identifier,
      controllerConstructor: bless(definition.controllerConstructor)
    };
  }

  // node_modules/@stimulus/core/dist/module.js
  var Module = function() {
    function Module2(application2, definition) {
      this.application = application2;
      this.definition = blessDefinition(definition);
      this.contextsByScope = new WeakMap();
      this.connectedContexts = new Set();
    }
    Object.defineProperty(Module2.prototype, "identifier", {
      get: function() {
        return this.definition.identifier;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Module2.prototype, "controllerConstructor", {
      get: function() {
        return this.definition.controllerConstructor;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Module2.prototype, "contexts", {
      get: function() {
        return Array.from(this.connectedContexts);
      },
      enumerable: false,
      configurable: true
    });
    Module2.prototype.connectContextForScope = function(scope) {
      var context = this.fetchContextForScope(scope);
      this.connectedContexts.add(context);
      context.connect();
    };
    Module2.prototype.disconnectContextForScope = function(scope) {
      var context = this.contextsByScope.get(scope);
      if (context) {
        this.connectedContexts.delete(context);
        context.disconnect();
      }
    };
    Module2.prototype.fetchContextForScope = function(scope) {
      var context = this.contextsByScope.get(scope);
      if (!context) {
        context = new Context(this, scope);
        this.contextsByScope.set(scope, context);
      }
      return context;
    };
    return Module2;
  }();

  // node_modules/@stimulus/core/dist/class_map.js
  var ClassMap = function() {
    function ClassMap2(scope) {
      this.scope = scope;
    }
    ClassMap2.prototype.has = function(name) {
      return this.data.has(this.getDataKey(name));
    };
    ClassMap2.prototype.get = function(name) {
      return this.data.get(this.getDataKey(name));
    };
    ClassMap2.prototype.getAttributeName = function(name) {
      return this.data.getAttributeNameForKey(this.getDataKey(name));
    };
    ClassMap2.prototype.getDataKey = function(name) {
      return name + "-class";
    };
    Object.defineProperty(ClassMap2.prototype, "data", {
      get: function() {
        return this.scope.data;
      },
      enumerable: false,
      configurable: true
    });
    return ClassMap2;
  }();

  // node_modules/@stimulus/core/dist/string_helpers.js
  function camelize(value) {
    return value.replace(/(?:[_-])([a-z0-9])/g, function(_, char) {
      return char.toUpperCase();
    });
  }
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function dasherize(value) {
    return value.replace(/([A-Z])/g, function(_, char) {
      return "-" + char.toLowerCase();
    });
  }

  // node_modules/@stimulus/core/dist/data_map.js
  var DataMap = function() {
    function DataMap2(scope) {
      this.scope = scope;
    }
    Object.defineProperty(DataMap2.prototype, "element", {
      get: function() {
        return this.scope.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataMap2.prototype, "identifier", {
      get: function() {
        return this.scope.identifier;
      },
      enumerable: false,
      configurable: true
    });
    DataMap2.prototype.get = function(key) {
      var name = this.getAttributeNameForKey(key);
      return this.element.getAttribute(name);
    };
    DataMap2.prototype.set = function(key, value) {
      var name = this.getAttributeNameForKey(key);
      this.element.setAttribute(name, value);
      return this.get(key);
    };
    DataMap2.prototype.has = function(key) {
      var name = this.getAttributeNameForKey(key);
      return this.element.hasAttribute(name);
    };
    DataMap2.prototype.delete = function(key) {
      if (this.has(key)) {
        var name_1 = this.getAttributeNameForKey(key);
        this.element.removeAttribute(name_1);
        return true;
      } else {
        return false;
      }
    };
    DataMap2.prototype.getAttributeNameForKey = function(key) {
      return "data-" + this.identifier + "-" + dasherize(key);
    };
    return DataMap2;
  }();

  // node_modules/@stimulus/core/dist/guide.js
  var Guide = function() {
    function Guide2(logger) {
      this.warnedKeysByObject = new WeakMap();
      this.logger = logger;
    }
    Guide2.prototype.warn = function(object, key, message) {
      var warnedKeys = this.warnedKeysByObject.get(object);
      if (!warnedKeys) {
        warnedKeys = new Set();
        this.warnedKeysByObject.set(object, warnedKeys);
      }
      if (!warnedKeys.has(key)) {
        warnedKeys.add(key);
        this.logger.warn(message, object);
      }
    };
    return Guide2;
  }();

  // node_modules/@stimulus/core/dist/selectors.js
  function attributeValueContainsToken(attributeName, token) {
    return "[" + attributeName + '~="' + token + '"]';
  }

  // node_modules/@stimulus/core/dist/target_set.js
  var __spreadArrays2 = function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
  var TargetSet = function() {
    function TargetSet2(scope) {
      this.scope = scope;
    }
    Object.defineProperty(TargetSet2.prototype, "element", {
      get: function() {
        return this.scope.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(TargetSet2.prototype, "identifier", {
      get: function() {
        return this.scope.identifier;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(TargetSet2.prototype, "schema", {
      get: function() {
        return this.scope.schema;
      },
      enumerable: false,
      configurable: true
    });
    TargetSet2.prototype.has = function(targetName) {
      return this.find(targetName) != null;
    };
    TargetSet2.prototype.find = function() {
      var _this = this;
      var targetNames = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        targetNames[_i] = arguments[_i];
      }
      return targetNames.reduce(function(target, targetName) {
        return target || _this.findTarget(targetName) || _this.findLegacyTarget(targetName);
      }, void 0);
    };
    TargetSet2.prototype.findAll = function() {
      var _this = this;
      var targetNames = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        targetNames[_i] = arguments[_i];
      }
      return targetNames.reduce(function(targets, targetName) {
        return __spreadArrays2(targets, _this.findAllTargets(targetName), _this.findAllLegacyTargets(targetName));
      }, []);
    };
    TargetSet2.prototype.findTarget = function(targetName) {
      var selector = this.getSelectorForTargetName(targetName);
      return this.scope.findElement(selector);
    };
    TargetSet2.prototype.findAllTargets = function(targetName) {
      var selector = this.getSelectorForTargetName(targetName);
      return this.scope.findAllElements(selector);
    };
    TargetSet2.prototype.getSelectorForTargetName = function(targetName) {
      var attributeName = "data-" + this.identifier + "-target";
      return attributeValueContainsToken(attributeName, targetName);
    };
    TargetSet2.prototype.findLegacyTarget = function(targetName) {
      var selector = this.getLegacySelectorForTargetName(targetName);
      return this.deprecate(this.scope.findElement(selector), targetName);
    };
    TargetSet2.prototype.findAllLegacyTargets = function(targetName) {
      var _this = this;
      var selector = this.getLegacySelectorForTargetName(targetName);
      return this.scope.findAllElements(selector).map(function(element) {
        return _this.deprecate(element, targetName);
      });
    };
    TargetSet2.prototype.getLegacySelectorForTargetName = function(targetName) {
      var targetDescriptor = this.identifier + "." + targetName;
      return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor);
    };
    TargetSet2.prototype.deprecate = function(element, targetName) {
      if (element) {
        var identifier = this.identifier;
        var attributeName = this.schema.targetAttribute;
        this.guide.warn(element, "target:" + targetName, "Please replace " + attributeName + '="' + identifier + "." + targetName + '" with data-' + identifier + '-target="' + targetName + '". ' + ("The " + attributeName + " attribute is deprecated and will be removed in a future version of Stimulus."));
      }
      return element;
    };
    Object.defineProperty(TargetSet2.prototype, "guide", {
      get: function() {
        return this.scope.guide;
      },
      enumerable: false,
      configurable: true
    });
    return TargetSet2;
  }();

  // node_modules/@stimulus/core/dist/scope.js
  var __spreadArrays3 = function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
  var Scope = function() {
    function Scope2(schema, element, identifier, logger) {
      var _this = this;
      this.targets = new TargetSet(this);
      this.classes = new ClassMap(this);
      this.data = new DataMap(this);
      this.containsElement = function(element2) {
        return element2.closest(_this.controllerSelector) === _this.element;
      };
      this.schema = schema;
      this.element = element;
      this.identifier = identifier;
      this.guide = new Guide(logger);
    }
    Scope2.prototype.findElement = function(selector) {
      return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    };
    Scope2.prototype.findAllElements = function(selector) {
      return __spreadArrays3(this.element.matches(selector) ? [this.element] : [], this.queryElements(selector).filter(this.containsElement));
    };
    Scope2.prototype.queryElements = function(selector) {
      return Array.from(this.element.querySelectorAll(selector));
    };
    Object.defineProperty(Scope2.prototype, "controllerSelector", {
      get: function() {
        return attributeValueContainsToken(this.schema.controllerAttribute, this.identifier);
      },
      enumerable: false,
      configurable: true
    });
    return Scope2;
  }();

  // node_modules/@stimulus/core/dist/scope_observer.js
  var ScopeObserver = function() {
    function ScopeObserver2(element, schema, delegate) {
      this.element = element;
      this.schema = schema;
      this.delegate = delegate;
      this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this);
      this.scopesByIdentifierByElement = new WeakMap();
      this.scopeReferenceCounts = new WeakMap();
    }
    ScopeObserver2.prototype.start = function() {
      this.valueListObserver.start();
    };
    ScopeObserver2.prototype.stop = function() {
      this.valueListObserver.stop();
    };
    Object.defineProperty(ScopeObserver2.prototype, "controllerAttribute", {
      get: function() {
        return this.schema.controllerAttribute;
      },
      enumerable: false,
      configurable: true
    });
    ScopeObserver2.prototype.parseValueForToken = function(token) {
      var element = token.element, identifier = token.content;
      var scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
      var scope = scopesByIdentifier.get(identifier);
      if (!scope) {
        scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
        scopesByIdentifier.set(identifier, scope);
      }
      return scope;
    };
    ScopeObserver2.prototype.elementMatchedValue = function(element, value) {
      var referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
      this.scopeReferenceCounts.set(value, referenceCount);
      if (referenceCount == 1) {
        this.delegate.scopeConnected(value);
      }
    };
    ScopeObserver2.prototype.elementUnmatchedValue = function(element, value) {
      var referenceCount = this.scopeReferenceCounts.get(value);
      if (referenceCount) {
        this.scopeReferenceCounts.set(value, referenceCount - 1);
        if (referenceCount == 1) {
          this.delegate.scopeDisconnected(value);
        }
      }
    };
    ScopeObserver2.prototype.fetchScopesByIdentifierForElement = function(element) {
      var scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
      if (!scopesByIdentifier) {
        scopesByIdentifier = new Map();
        this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
      }
      return scopesByIdentifier;
    };
    return ScopeObserver2;
  }();

  // node_modules/@stimulus/core/dist/router.js
  var Router = function() {
    function Router2(application2) {
      this.application = application2;
      this.scopeObserver = new ScopeObserver(this.element, this.schema, this);
      this.scopesByIdentifier = new Multimap();
      this.modulesByIdentifier = new Map();
    }
    Object.defineProperty(Router2.prototype, "element", {
      get: function() {
        return this.application.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Router2.prototype, "schema", {
      get: function() {
        return this.application.schema;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Router2.prototype, "logger", {
      get: function() {
        return this.application.logger;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Router2.prototype, "controllerAttribute", {
      get: function() {
        return this.schema.controllerAttribute;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Router2.prototype, "modules", {
      get: function() {
        return Array.from(this.modulesByIdentifier.values());
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Router2.prototype, "contexts", {
      get: function() {
        return this.modules.reduce(function(contexts, module) {
          return contexts.concat(module.contexts);
        }, []);
      },
      enumerable: false,
      configurable: true
    });
    Router2.prototype.start = function() {
      this.scopeObserver.start();
    };
    Router2.prototype.stop = function() {
      this.scopeObserver.stop();
    };
    Router2.prototype.loadDefinition = function(definition) {
      this.unloadIdentifier(definition.identifier);
      var module = new Module(this.application, definition);
      this.connectModule(module);
    };
    Router2.prototype.unloadIdentifier = function(identifier) {
      var module = this.modulesByIdentifier.get(identifier);
      if (module) {
        this.disconnectModule(module);
      }
    };
    Router2.prototype.getContextForElementAndIdentifier = function(element, identifier) {
      var module = this.modulesByIdentifier.get(identifier);
      if (module) {
        return module.contexts.find(function(context) {
          return context.element == element;
        });
      }
    };
    Router2.prototype.handleError = function(error2, message, detail) {
      this.application.handleError(error2, message, detail);
    };
    Router2.prototype.createScopeForElementAndIdentifier = function(element, identifier) {
      return new Scope(this.schema, element, identifier, this.logger);
    };
    Router2.prototype.scopeConnected = function(scope) {
      this.scopesByIdentifier.add(scope.identifier, scope);
      var module = this.modulesByIdentifier.get(scope.identifier);
      if (module) {
        module.connectContextForScope(scope);
      }
    };
    Router2.prototype.scopeDisconnected = function(scope) {
      this.scopesByIdentifier.delete(scope.identifier, scope);
      var module = this.modulesByIdentifier.get(scope.identifier);
      if (module) {
        module.disconnectContextForScope(scope);
      }
    };
    Router2.prototype.connectModule = function(module) {
      this.modulesByIdentifier.set(module.identifier, module);
      var scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach(function(scope) {
        return module.connectContextForScope(scope);
      });
    };
    Router2.prototype.disconnectModule = function(module) {
      this.modulesByIdentifier.delete(module.identifier);
      var scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach(function(scope) {
        return module.disconnectContextForScope(scope);
      });
    };
    return Router2;
  }();

  // node_modules/@stimulus/core/dist/schema.js
  var defaultSchema = {
    controllerAttribute: "data-controller",
    actionAttribute: "data-action",
    targetAttribute: "data-target"
  };

  // node_modules/@stimulus/core/dist/application.js
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator = function(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
  var __spreadArrays4 = function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
  var Application = function() {
    function Application2(element, schema) {
      if (element === void 0) {
        element = document.documentElement;
      }
      if (schema === void 0) {
        schema = defaultSchema;
      }
      this.logger = console;
      this.element = element;
      this.schema = schema;
      this.dispatcher = new Dispatcher(this);
      this.router = new Router(this);
    }
    Application2.start = function(element, schema) {
      var application2 = new Application2(element, schema);
      application2.start();
      return application2;
    };
    Application2.prototype.start = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, domReady()];
            case 1:
              _a.sent();
              this.dispatcher.start();
              this.router.start();
              return [2];
          }
        });
      });
    };
    Application2.prototype.stop = function() {
      this.dispatcher.stop();
      this.router.stop();
    };
    Application2.prototype.register = function(identifier, controllerConstructor) {
      this.load({ identifier, controllerConstructor });
    };
    Application2.prototype.load = function(head) {
      var _this = this;
      var rest = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
      }
      var definitions = Array.isArray(head) ? head : __spreadArrays4([head], rest);
      definitions.forEach(function(definition) {
        return _this.router.loadDefinition(definition);
      });
    };
    Application2.prototype.unload = function(head) {
      var _this = this;
      var rest = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
      }
      var identifiers = Array.isArray(head) ? head : __spreadArrays4([head], rest);
      identifiers.forEach(function(identifier) {
        return _this.router.unloadIdentifier(identifier);
      });
    };
    Object.defineProperty(Application2.prototype, "controllers", {
      get: function() {
        return this.router.contexts.map(function(context) {
          return context.controller;
        });
      },
      enumerable: false,
      configurable: true
    });
    Application2.prototype.getControllerForElementAndIdentifier = function(element, identifier) {
      var context = this.router.getContextForElementAndIdentifier(element, identifier);
      return context ? context.controller : null;
    };
    Application2.prototype.handleError = function(error2, message, detail) {
      this.logger.error("%s\n\n%o\n\n%o", message, error2, detail);
    };
    return Application2;
  }();
  function domReady() {
    return new Promise(function(resolve) {
      if (document.readyState == "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    });
  }

  // node_modules/@stimulus/core/dist/class_properties.js
  function ClassPropertiesBlessing(constructor) {
    var classes = readInheritableStaticArrayValues(constructor, "classes");
    return classes.reduce(function(properties, classDefinition) {
      return Object.assign(properties, propertiesForClassDefinition(classDefinition));
    }, {});
  }
  function propertiesForClassDefinition(key) {
    var _a;
    var name = key + "Class";
    return _a = {}, _a[name] = {
      get: function() {
        var classes = this.classes;
        if (classes.has(key)) {
          return classes.get(key);
        } else {
          var attribute = classes.getAttributeName(key);
          throw new Error('Missing attribute "' + attribute + '"');
        }
      }
    }, _a["has" + capitalize(name)] = {
      get: function() {
        return this.classes.has(key);
      }
    }, _a;
  }

  // node_modules/@stimulus/core/dist/target_properties.js
  function TargetPropertiesBlessing(constructor) {
    var targets = readInheritableStaticArrayValues(constructor, "targets");
    return targets.reduce(function(properties, targetDefinition) {
      return Object.assign(properties, propertiesForTargetDefinition(targetDefinition));
    }, {});
  }
  function propertiesForTargetDefinition(name) {
    var _a;
    return _a = {}, _a[name + "Target"] = {
      get: function() {
        var target = this.targets.find(name);
        if (target) {
          return target;
        } else {
          throw new Error('Missing target element "' + this.identifier + "." + name + '"');
        }
      }
    }, _a[name + "Targets"] = {
      get: function() {
        return this.targets.findAll(name);
      }
    }, _a["has" + capitalize(name) + "Target"] = {
      get: function() {
        return this.targets.has(name);
      }
    }, _a;
  }

  // node_modules/@stimulus/core/dist/value_properties.js
  function ValuePropertiesBlessing(constructor) {
    var valueDefinitionPairs = readInheritableStaticObjectPairs(constructor, "values");
    var propertyDescriptorMap = {
      valueDescriptorMap: {
        get: function() {
          var _this = this;
          return valueDefinitionPairs.reduce(function(result, valueDefinitionPair) {
            var _a;
            var valueDescriptor = parseValueDefinitionPair(valueDefinitionPair);
            var attributeName = _this.data.getAttributeNameForKey(valueDescriptor.key);
            return Object.assign(result, (_a = {}, _a[attributeName] = valueDescriptor, _a));
          }, {});
        }
      }
    };
    return valueDefinitionPairs.reduce(function(properties, valueDefinitionPair) {
      return Object.assign(properties, propertiesForValueDefinitionPair(valueDefinitionPair));
    }, propertyDescriptorMap);
  }
  function propertiesForValueDefinitionPair(valueDefinitionPair) {
    var _a;
    var definition = parseValueDefinitionPair(valueDefinitionPair);
    var type = definition.type, key = definition.key, name = definition.name;
    var read = readers[type], write = writers[type] || writers.default;
    return _a = {}, _a[name] = {
      get: function() {
        var value = this.data.get(key);
        if (value !== null) {
          return read(value);
        } else {
          return definition.defaultValue;
        }
      },
      set: function(value) {
        if (value === void 0) {
          this.data.delete(key);
        } else {
          this.data.set(key, write(value));
        }
      }
    }, _a["has" + capitalize(name)] = {
      get: function() {
        return this.data.has(key);
      }
    }, _a;
  }
  function parseValueDefinitionPair(_a) {
    var token = _a[0], typeConstant = _a[1];
    var type = parseValueTypeConstant(typeConstant);
    return valueDescriptorForTokenAndType(token, type);
  }
  function parseValueTypeConstant(typeConstant) {
    switch (typeConstant) {
      case Array:
        return "array";
      case Boolean:
        return "boolean";
      case Number:
        return "number";
      case Object:
        return "object";
      case String:
        return "string";
    }
    throw new Error('Unknown value type constant "' + typeConstant + '"');
  }
  function valueDescriptorForTokenAndType(token, type) {
    var key = dasherize(token) + "-value";
    return {
      type,
      key,
      name: camelize(key),
      get defaultValue() {
        return defaultValuesByType[type];
      }
    };
  }
  var defaultValuesByType = {
    get array() {
      return [];
    },
    boolean: false,
    number: 0,
    get object() {
      return {};
    },
    string: ""
  };
  var readers = {
    array: function(value) {
      var array = JSON.parse(value);
      if (!Array.isArray(array)) {
        throw new TypeError("Expected array");
      }
      return array;
    },
    boolean: function(value) {
      return !(value == "0" || value == "false");
    },
    number: function(value) {
      return parseFloat(value);
    },
    object: function(value) {
      var object = JSON.parse(value);
      if (object === null || typeof object != "object" || Array.isArray(object)) {
        throw new TypeError("Expected object");
      }
      return object;
    },
    string: function(value) {
      return value;
    }
  };
  var writers = {
    default: writeString,
    array: writeJSON,
    object: writeJSON
  };
  function writeJSON(value) {
    return JSON.stringify(value);
  }
  function writeString(value) {
    return "" + value;
  }

  // node_modules/@stimulus/core/dist/controller.js
  var Controller = function() {
    function Controller2(context) {
      this.context = context;
    }
    Object.defineProperty(Controller2.prototype, "application", {
      get: function() {
        return this.context.application;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Controller2.prototype, "scope", {
      get: function() {
        return this.context.scope;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Controller2.prototype, "element", {
      get: function() {
        return this.scope.element;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Controller2.prototype, "identifier", {
      get: function() {
        return this.scope.identifier;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Controller2.prototype, "targets", {
      get: function() {
        return this.scope.targets;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Controller2.prototype, "classes", {
      get: function() {
        return this.scope.classes;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Controller2.prototype, "data", {
      get: function() {
        return this.scope.data;
      },
      enumerable: false,
      configurable: true
    });
    Controller2.prototype.initialize = function() {
    };
    Controller2.prototype.connect = function() {
    };
    Controller2.prototype.disconnect = function() {
    };
    Controller2.blessings = [ClassPropertiesBlessing, TargetPropertiesBlessing, ValuePropertiesBlessing];
    Controller2.targets = [];
    Controller2.values = {};
    return Controller2;
  }();

  // src/controllers/hello_controller.js
  var hello_controller_default = class extends Controller {
    connect() {
      this.element.textContent = "It works!";
    }
  };

  // src/application.js
  var application = Application.start();
  application.register("hello", hello_controller_default);
})();
