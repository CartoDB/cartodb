/*
 *  Sugar Custom 2016.08.16
 *
 *  Freely distributable and licensed under the MIT-style license.
 *  Copyright (c)  Andrew Plummer
 *  https://sugarjs.com/
 *
 * ---------------------------- */
(function() {
  'use strict';

  /***
   * @module Core
   * @description Core functionality including the ability to define methods and
   *              extend onto natives.
   *
   ***/

  // The global to export.
  var Sugar;

  // The name of Sugar in the global namespace.
  var SUGAR_GLOBAL = 'Sugar';

  // Natives available on initialization. Letting Object go first to ensure its
  // global is set by the time the rest are checking for chainable Object methods.
  var NATIVE_NAMES = 'Object Number String Array Date RegExp Function';

  // Static method flag
  var STATIC   = 0x1;

  // Instance method flag
  var INSTANCE = 0x2;

  // IE8 has a broken defineProperty but no defineProperties so this saves a try/catch.
  var PROPERTY_DESCRIPTOR_SUPPORT = !!(Object.defineProperty && Object.defineProperties);

  // The global context. Rhino uses a different "global" keyword so
  // do an extra check to be sure that it's actually the global context.
  var globalContext = typeof global !== 'undefined' && global.Object === Object ? global : this;

  // Is the environment node?
  var hasExports = typeof module !== 'undefined' && module.exports;

  // Whether object instance methods can be mapped to the prototype.
  var allowObjectPrototype = false;

  // A map from Array to SugarArray.
  var namespacesByName = {};

  // A map from [object Object] to namespace.
  var namespacesByClassString = {};

  // Defining properties.
  var defineProperty = PROPERTY_DESCRIPTOR_SUPPORT ?  Object.defineProperty : definePropertyShim;

  // A default chainable class for unknown types.
  var DefaultChainable = getNewChainableClass('Chainable');


  // Global methods

  function setupGlobal() {
    Sugar = globalContext[SUGAR_GLOBAL];
    if (Sugar) {
      // Reuse already defined Sugar global object.
      return;
    }
    Sugar = function(arg) {
      forEachProperty(Sugar, function(sugarNamespace, name) {
        // Although only the only enumerable properties on the global
        // object are Sugar namespaces, environments that can't set
        // non-enumerable properties will step through the utility methods
        // as well here, so use this check to only allow true namespaces.
        if (hasOwn(namespacesByName, name)) {
          sugarNamespace.extend(arg);
        }
      });
      return Sugar;
    };
    if (hasExports) {
      module.exports = Sugar;
    } else {
      try {
        globalContext[SUGAR_GLOBAL] = Sugar;
      } catch (e) {
        // Contexts such as QML have a read-only global context.
      }
    }
    forEachProperty(NATIVE_NAMES.split(' '), function(name) {
      createNamespace(name);
    });
    setGlobalProperties();
  }

  /***
   * @method createNamespace(<name>)
   * @returns Namespace
   * @global
   * @short Creates a new Sugar namespace.
   * @extra This method is for plugin developers who want to define methods to be
   *        used with natives that Sugar does not handle by default. The new
   *        namespace will appear on the `Sugar` global with all the methods of
   *        normal namespaces, including the ability to define new methods. When
   *        extended, any defined methods will be mapped to `name` in the global
   *        context.
   *
   * @example
   *
   *   Sugar.createNamespace('Boolean');
   *
   ***/
  function createNamespace(name) {

    // Is the current namespace Object?
    var isObject = name === 'Object';

    // A Sugar namespace is also a chainable class: Sugar.Array, etc.
    var sugarNamespace = getNewChainableClass(name, true);

    /***
     * @method extend([options])
     * @returns Sugar
     * @global
     * @namespace
     * @short Extends Sugar defined methods onto natives.
     * @extra This method can be called on individual namespaces like
     *        `Sugar.Array` or on the `Sugar` global itself, in which case
     *        [options] will be forwarded to each `extend` call. For more,
     *        see `extending`.
     *
     * @options
     *
     *   methods           An array of method names to explicitly extend.
     *
     *   except            An array of method names or global namespaces (`Array`,
     *                     `String`) to explicitly exclude. Namespaces should be the
     *                     actual global objects, not strings.
     *
     *   namespaces        An array of global namespaces (`Array`, `String`) to
     *                     explicitly extend. Namespaces should be the actual
     *                     global objects, not strings.
     *
     *   enhance           A shortcut to disallow all "enhance" flags at once
     *                     (flags listed below). For more, see `enhanced methods`.
     *                     Default is `true`.
     *
     *   enhanceString     A boolean allowing String enhancements. Default is `true`.
     *
     *   enhanceArray      A boolean allowing Array enhancements. Default is `true`.
     *
     *   objectPrototype   A boolean allowing Sugar to extend Object.prototype
     *                     with instance methods. This option is off by default
     *                     and should generally not be used except with caution.
     *                     For more, see `object methods`.
     *
     * @example
     *
     *   Sugar.Array.extend();
     *   Sugar.extend();
     *
     ***/
    var extend = function (opts) {

      var nativeClass = globalContext[name], nativeProto = nativeClass.prototype;
      var staticMethods = {}, instanceMethods = {}, methodsByName;

      function objectRestricted(name, target) {
        return isObject && target === nativeProto &&
               (!allowObjectPrototype || name === 'get' || name === 'set');
      }

      function arrayOptionExists(field, val) {
        var arr = opts[field];
        if (arr) {
          for (var i = 0, el; el = arr[i]; i++) {
            if (el === val) {
              return true;
            }
          }
        }
        return false;
      }

      function arrayOptionExcludes(field, val) {
        return opts[field] && !arrayOptionExists(field, val);
      }

      function disallowedByFlags(methodName, target, flags) {
        // Disallowing methods by flag currently only applies if methods already
        // exist to avoid enhancing native methods, as aliases should still be
        // extended (i.e. Array#all should still be extended even if Array#every
        // is being disallowed by a flag).
        if (!target[methodName] || !flags) {
          return false;
        }
        for (var i = 0; i < flags.length; i++) {
          if (opts[flags[i]] === false) {
            return true;
          }
        }
      }

      function namespaceIsExcepted() {
        return arrayOptionExists('except', nativeClass) ||
               arrayOptionExcludes('namespaces', nativeClass);
      }

      function methodIsExcepted(methodName) {
        return arrayOptionExists('except', methodName);
      }

      function canExtend(methodName, method, target) {
        return !objectRestricted(methodName, target) &&
               !disallowedByFlags(methodName, target, method.flags) &&
               !methodIsExcepted(methodName);
      }

      opts = opts || {};
      methodsByName = opts.methods;

      if (namespaceIsExcepted()) {
        return;
      } else if (isObject && typeof opts.objectPrototype === 'boolean') {
        // Store "objectPrototype" flag for future reference.
        allowObjectPrototype = opts.objectPrototype;
      }

      forEachProperty(methodsByName || sugarNamespace, function(method, methodName) {
        if (methodsByName) {
          // If we have method names passed in an array,
          // then we need to flip the key and value here
          // and find the method in the Sugar namespace.
          methodName = method;
          method = sugarNamespace[methodName];
        }
        if (hasOwn(method, 'instance') && canExtend(methodName, method, nativeProto)) {
          instanceMethods[methodName] = method.instance;
        }
        if(hasOwn(method, 'static') && canExtend(methodName, method, nativeClass)) {
          staticMethods[methodName] = method;
        }
      });

      // Accessing the extend target each time instead of holding a reference as
      // it may have been overwritten (for example Date by Sinon). Also need to
      // access through the global to allow extension of user-defined namespaces.
      extendNative(nativeClass, staticMethods);
      extendNative(nativeProto, instanceMethods);

      if (!methodsByName) {
        // If there are no method names passed, then
        // all methods in the namespace will be extended
        // to the native. This includes all future defined
        // methods, so add a flag here to check later.
        setProperty(sugarNamespace, 'active', true);
      }
      return Sugar;
    };

    function defineWithOptionCollect(methodName, instance, args) {
      setProperty(sugarNamespace, methodName, function(arg1, arg2, arg3) {
        var opts = collectDefineOptions(arg1, arg2, arg3);
        defineMethods(sugarNamespace, opts.methods, instance, args, opts.last);
        return sugarNamespace;
      });
    }

    /***
     * @method defineStatic(...)
     * @returns Namespace
     * @namespace
     * @short Defines static methods on the namespace that can later be extended
     *        onto the native globals.
     * @extra Accepts either a single object mapping names to functions, or name
     *        and function as two arguments. If `extend` was previously called
     *        with no arguments, the method will be immediately mapped to its
     *        native when defined.
     *
     * @example
     *
     *   Sugar.Number.defineStatic({
     *     isOdd: function (num) {
     *       return num % 2 === 1;
     *     }
     *   });
     *
     ***/
    defineWithOptionCollect('defineStatic', STATIC);

    /***
     * @method defineInstance(...)
     * @returns Namespace
     * @namespace
     * @short Defines methods on the namespace that can later be extended as
     *        instance methods onto the native prototype.
     * @extra Accepts either a single object mapping names to functions, or name
     *        and function as two arguments. All functions should accept the
     *        native for which they are mapped as their first argument, and should
     *        never refer to `this`. If `extend` was previously called with no
     *        arguments, the method will be immediately mapped to its native when
     *        defined.
     *
     *        Methods cannot accept more than 4 arguments in addition to the
     *        native (5 arguments total). Any additional arguments will not be
     *        mapped. If the method needs to accept unlimited arguments, use
     *        `defineInstanceWithArguments`. Otherwise if more options are
     *        required, use an options object instead.
     *
     * @example
     *
     *   Sugar.Number.defineInstance({
     *     square: function (num) {
     *       return num * num;
     *     }
     *   });
     *
     ***/
    defineWithOptionCollect('defineInstance', INSTANCE);

    /***
     * @method defineInstanceAndStatic(...)
     * @returns Namespace
     * @namespace
     * @short A shortcut to define both static and instance methods on the namespace.
     * @extra This method is intended for use with `Object` instance methods. Sugar
     *        will not map any methods to `Object.prototype` by default, so defining
     *        instance methods as static helps facilitate their proper use.
     *
     * @example
     *
     *   Sugar.Object.defineInstanceAndStatic({
     *     isAwesome: function (obj) {
     *       // check if obj is awesome!
     *     }
     *   });
     *
     ***/
    defineWithOptionCollect('defineInstanceAndStatic', INSTANCE | STATIC);


    /***
     * @method defineStaticWithArguments(...)
     * @returns Namespace
     * @namespace
     * @short Defines static methods that collect arguments.
     * @extra This method is identical to `defineStatic`, except that when defined
     *        methods are called, they will collect any arguments past `n - 1`,
     *        where `n` is the number of arguments that the method accepts.
     *        Collected arguments will be passed to the method in an array
     *        as the last argument defined on the function.
     *
     * @example
     *
     *   Sugar.Number.defineStaticWithArguments({
     *     addAll: function (num, args) {
     *       for (var i = 0; i < args.length; i++) {
     *         num += args[i];
     *       }
     *       return num;
     *     }
     *   });
     *
     ***/
    defineWithOptionCollect('defineStaticWithArguments', STATIC, true);

    /***
     * @method defineInstanceWithArguments(...)
     * @returns Namespace
     * @namespace
     * @short Defines instance methods that collect arguments.
     * @extra This method is identical to `defineInstance`, except that when
     *        defined methods are called, they will collect any arguments past
     *        `n - 1`, where `n` is the number of arguments that the method
     *        accepts. Collected arguments will be passed to the method as the
     *        last argument defined on the function.
     *
     * @example
     *
     *   Sugar.Number.defineInstanceWithArguments({
     *     addAll: function (num, args) {
     *       for (var i = 0; i < args.length; i++) {
     *         num += args[i];
     *       }
     *       return num;
     *     }
     *   });
     *
     ***/
    defineWithOptionCollect('defineInstanceWithArguments', INSTANCE, true);

    /***
     * @method defineStaticPolyfill(...)
     * @returns Namespace
     * @namespace
     * @short Defines static methods that are mapped onto the native if they do
     *        not already exist.
     * @extra Intended only for use creating polyfills that follow the ECMAScript
     *        spec. Accepts either a single object mapping names to functions, or
     *        name and function as two arguments.
     *
     * @example
     *
     *   Sugar.Object.defineStaticPolyfill({
     *     keys: function (obj) {
     *       // get keys!
     *     }
     *   });
     *
     ***/
    setProperty(sugarNamespace, 'defineStaticPolyfill', function(arg1, arg2, arg3) {
      var opts = collectDefineOptions(arg1, arg2, arg3);
      extendNative(globalContext[name], opts.methods, true, opts.last);
    });

    /***
     * @method defineInstancePolyfill(...)
     * @returns Namespace
     * @namespace
     * @short Defines instance methods that are mapped onto the native prototype
     *        if they do not already exist.
     * @extra Intended only for use creating polyfills that follow the ECMAScript
     *        spec. Accepts either a single object mapping names to functions, or
     *        name and function as two arguments. This method differs from
     *        `defineInstance` as there is no static signature (as the method
     *        is mapped as-is to the native), so it should refer to its `this`
     *        object.
     *
     * @example
     *
     *   Sugar.Array.defineInstancePolyfill({
     *     indexOf: function (arr, el) {
     *       // index finding code here!
     *     }
     *   });
     *
     ***/
    setProperty(sugarNamespace, 'defineInstancePolyfill', function(arg1, arg2, arg3) {
      var opts = collectDefineOptions(arg1, arg2, arg3);
      extendNative(globalContext[name].prototype, opts.methods, true, opts.last);
      // Map instance polyfills to chainable as well.
      forEachProperty(opts.methods, function(fn, methodName) {
        defineChainableMethod(sugarNamespace, methodName, fn);
      });
    });

    /***
     * @method alias(<toName>, <fromName>)
     * @returns Namespace
     * @namespace
     * @short Aliases one Sugar method to another.
     *
     * @example
     *
     *   Sugar.Array.alias('all', 'every');
     *
     ***/
    setProperty(sugarNamespace, 'alias', function(name, source) {
      var method = typeof source === 'string' ? sugarNamespace[source] : source;
      setMethod(sugarNamespace, name, method);
    });

    // Each namespace can extend only itself through its .extend method.
    setProperty(sugarNamespace, 'extend', extend);

    // Cache the class to namespace relationship for later use.
    namespacesByName[name] = sugarNamespace;
    namespacesByClassString['[object ' + name + ']'] = sugarNamespace;

    mapNativeToChainable(name);
    mapObjectChainablesToNamespace(sugarNamespace);


    // Export
    return Sugar[name] = sugarNamespace;
  }

  function setGlobalProperties() {
    setProperty(Sugar, 'extend', Sugar);
    setProperty(Sugar, 'toString', toString);
    setProperty(Sugar, 'createNamespace', createNamespace);

    setProperty(Sugar, 'util', {
      'hasOwn': hasOwn,
      'getOwn': getOwn,
      'setProperty': setProperty,
      'classToString': classToString,
      'defineProperty': defineProperty,
      'forEachProperty': forEachProperty,
      'mapNativeToChainable': mapNativeToChainable
    });
  }

  function toString() {
    return SUGAR_GLOBAL;
  }


  // Defining Methods

  function defineMethods(sugarNamespace, methods, type, args, flags) {
    forEachProperty(methods, function(method, methodName) {
      var instanceMethod, staticMethod = method;
      if (args) {
        staticMethod = wrapMethodWithArguments(method);
      }
      if (flags) {
        staticMethod.flags = flags;
      }

      // A method may define its own custom implementation, so
      // make sure that's not the case before creating one.
      if (type & INSTANCE && !method.instance) {
        instanceMethod = wrapInstanceMethod(method, args);
        setProperty(staticMethod, 'instance', instanceMethod);
      }

      if (type & STATIC) {
        setProperty(staticMethod, 'static', true);
      }

      setMethod(sugarNamespace, methodName, staticMethod);

      if (sugarNamespace.active) {
        // If the namespace has been activated (.extend has been called),
        // then map this method as well.
        sugarNamespace.extend(methodName);
      }
    });
  }

  function collectDefineOptions(arg1, arg2, arg3) {
    var methods, last;
    if (typeof arg1 === 'string') {
      methods = {};
      methods[arg1] = arg2;
      last = arg3;
    } else {
      methods = arg1;
      last = arg2;
    }
    return {
      last: last,
      methods: methods
    };
  }

  function wrapInstanceMethod(fn, args) {
    return args ? wrapMethodWithArguments(fn, true) : wrapInstanceMethodFixed(fn);
  }

  function wrapMethodWithArguments(fn, instance) {
    // Functions accepting enumerated arguments will always have "args" as the
    // last argument, so subtract one from the function length to get the point
    // at which to start collecting arguments. If this is an instance method on
    // a prototype, then "this" will be pushed into the arguments array so start
    // collecting 1 argument earlier.
    var startCollect = fn.length - 1 - (instance ? 1 : 0);
    return function() {
      var args = [], collectedArgs = [], len;
      if (instance) {
        args.push(this);
      }
      len = Math.max(arguments.length, startCollect);
      // Optimized: no leaking arguments
      for (var i = 0; i < len; i++) {
        if (i < startCollect) {
          args.push(arguments[i]);
        } else {
          collectedArgs.push(arguments[i]);
        }
      }
      args.push(collectedArgs);
      return fn.apply(this, args);
    };
  }

  function wrapInstanceMethodFixed(fn) {
    switch(fn.length) {
      // Wrapped instance methods will always be passed the instance
      // as the first argument, but requiring the argument to be defined
      // may cause confusion here, so return the same wrapped function regardless.
      case 0:
      case 1:
        return function() {
          return fn(this);
        };
      case 2:
        return function(a) {
          return fn(this, a);
        };
      case 3:
        return function(a, b) {
          return fn(this, a, b);
        };
      case 4:
        return function(a, b, c) {
          return fn(this, a, b, c);
        };
      case 5:
        return function(a, b, c, d) {
          return fn(this, a, b, c, d);
        };
    }
  }

  // Method helpers

  function extendNative(target, source, polyfill, override) {
    forEachProperty(source, function(method, name) {
      if (polyfill && !override && target[name]) {
        // Method exists, so bail.
        return;
      }
      setProperty(target, name, method);
    });
  }

  function setMethod(sugarNamespace, methodName, method) {
    sugarNamespace[methodName] = method;
    if (method.instance) {
      defineChainableMethod(sugarNamespace, methodName, method.instance, true);
    }
  }


  // Chainables

  function getNewChainableClass(name) {
    var fn = function SugarChainable(obj, arg) {
      if (!(this instanceof fn)) {
        return new fn(obj, arg);
      }
      if (this.constructor !== fn) {
        // Allow modules to define their own constructors.
        obj = this.constructor.apply(obj, arguments);
      }
      this.raw = obj;
    };
    setProperty(fn, 'toString', function() {
      return SUGAR_GLOBAL + name;
    });
    setProperty(fn.prototype, 'valueOf', function() {
      return this.raw;
    });
    return fn;
  }

  function defineChainableMethod(sugarNamespace, methodName, fn) {
    var wrapped = wrapWithChainableResult(fn), existing, collision, dcp;
    dcp = DefaultChainable.prototype;
    existing = dcp[methodName];

    // If the method was previously defined on the default chainable, then a
    // collision exists, so set the method to a disambiguation function that will
    // lazily evaluate the object and find it's associated chainable. An extra
    // check is required to avoid false positives from Object inherited methods.
    collision = existing && existing !== Object.prototype[methodName];

    // The disambiguation function is only required once.
    if (!existing || !existing.disambiguate) {
      dcp[methodName] = collision ? disambiguateMethod(methodName) : wrapped;
    }

    // The target chainable always receives the wrapped method. Additionally,
    // if the target chainable is Sugar.Object, then map the wrapped method
    // to all other namespaces as well if they do not define their own method
    // of the same name. This way, a Sugar.Number will have methods like
    // isEqual that can be called on any object without having to traverse up
    // the prototype chain and perform disambiguation, which costs cycles.
    // Note that the "if" block below actually does nothing on init as Object
    // goes first and no other namespaces exist yet. However it needs to be
    // here as Object instance methods defined later also need to be mapped
    // back onto existing namespaces.
    sugarNamespace.prototype[methodName] = wrapped;
    if (sugarNamespace === Sugar.Object) {
      mapObjectChainableToAllNamespaces(methodName, wrapped);
    }
  }

  function mapObjectChainablesToNamespace(sugarNamespace) {
    forEachProperty(Sugar.Object && Sugar.Object.prototype, function(val, methodName) {
      if (typeof val === 'function') {
        setObjectChainableOnNamespace(sugarNamespace, methodName, val);
      }
    });
  }

  function mapObjectChainableToAllNamespaces(methodName, fn) {
    forEachProperty(namespacesByName, function(sugarNamespace) {
      setObjectChainableOnNamespace(sugarNamespace, methodName, fn);
    });
  }

  function setObjectChainableOnNamespace(sugarNamespace, methodName, fn) {
    var proto = sugarNamespace.prototype;
    if (!hasOwn(proto, methodName)) {
      proto[methodName] = fn;
    }
  }

  function wrapWithChainableResult(fn) {
    return function() {
      return new DefaultChainable(fn.apply(this.raw, arguments));
    };
  }

  function disambiguateMethod(methodName) {
    var fn = function() {
      var raw = this.raw, sugarNamespace, fn;
      if (raw != null) {
        // Find the Sugar namespace for this unknown.
        sugarNamespace = namespacesByClassString[classToString(raw)];
      }
      if (!sugarNamespace) {
        // If no sugarNamespace can be resolved, then default
        // back to Sugar.Object so that undefined and other
        // non-supported types can still have basic object
        // methods called on them, such as type checks.
        sugarNamespace = Sugar.Object;
      }

      fn = new sugarNamespace(raw)[methodName];

      if (fn.disambiguate) {
        // If the method about to be called on this chainable is
        // itself a disambiguation method, then throw an error to
        // prevent infinite recursion.
        throw new TypeError('Cannot resolve namespace for ' + raw);
      }

      return fn.apply(this, arguments);
    };
    fn.disambiguate = true;
    return fn;
  }

  function mapNativeToChainable(name, methodNames) {
    var sugarNamespace = namespacesByName[name],
        nativeProto = globalContext[name].prototype;

    if (!methodNames && ownPropertyNames) {
      methodNames = ownPropertyNames(nativeProto);
    }

    forEachProperty(methodNames, function(methodName) {
      if (nativeMethodProhibited(methodName)) {
        // Sugar chainables have their own constructors as well as "valueOf"
        // methods, so exclude them here. The __proto__ argument should be trapped
        // by the function check below, however simply accessing this property on
        // Object.prototype causes QML to segfault, so pre-emptively excluding it.
        return;
      }
      try {
        var fn = nativeProto[methodName];
        if (typeof fn !== 'function') {
          // Bail on anything not a function.
          return;
        }
      } catch (e) {
        // Function.prototype has properties that
        // will throw errors when accessed.
        return;
      }
      defineChainableMethod(sugarNamespace, methodName, fn);
    });
  }

  function nativeMethodProhibited(methodName) {
    return methodName === 'constructor' ||
           methodName === 'valueOf' ||
           methodName === '__proto__';
  }


  // Util

  // Internal references
  var ownPropertyNames = Object.getOwnPropertyNames,
      internalToString = Object.prototype.toString,
      internalHasOwnProperty = Object.prototype.hasOwnProperty;

  // Defining this as a variable here as the ES5 module
  // overwrites it to patch DONTENUM.
  var forEachProperty = function (obj, fn) {
    for(var key in obj) {
      if (!hasOwn(obj, key)) continue;
      if (fn.call(obj, obj[key], key, obj) === false) break;
    }
  };

  function definePropertyShim(obj, prop, descriptor) {
    obj[prop] = descriptor.value;
  }

  function setProperty(target, name, value, enumerable) {
    defineProperty(target, name, {
      value: value,
      enumerable: !!enumerable,
      configurable: true,
      writable: true
    });
  }

  // PERF: Attempts to speed this method up get very Heisenbergy. Quickly
  // returning based on typeof works for primitives, but slows down object
  // types. Even === checks on null and undefined (no typeof) will end up
  // basically breaking even. This seems to be as fast as it can go.
  function classToString(obj) {
    return internalToString.call(obj);
  }

  function hasOwn(obj, prop) {
    return !!obj && internalHasOwnProperty.call(obj, prop);
  }

  function getOwn(obj, prop) {
    if (hasOwn(obj, prop)) {
      return obj[prop];
    }
  }

  setupGlobal();

  /***
   * @module Common
   * @description Internal utility and common methods.
   ***/


  // Flag allowing native methods to be enhanced
  var ENHANCEMENTS_FLAG = 'enhance';

  // For type checking, etc. Excludes object as this is more nuanced.
  var NATIVE_TYPES = 'Boolean Number String Date RegExp Function Array Error Set Map';

  // Matches 1..2 style ranges in properties
  var PROPERTY_RANGE_REG = /^(.*?)\[([-\d]*)\.\.([-\d]*)\](.*)$/;

  // WhiteSpace/LineTerminator as defined in ES5.1 plus Unicode characters in the Space, Separator category.
  var TRIM_CHARS = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF';

  // Regex for matching a formatted string
  var STRING_FORMAT_REG = /([{}])\1|\{([^}]*)\}|(%)%|(%(\w*))/g;

  // Common chars
  var HALF_WIDTH_ZERO = 0x30,
      FULL_WIDTH_ZERO = 0xff10,
      HALF_WIDTH_PERIOD   = '.',
      FULL_WIDTH_PERIOD   = '．',
      HALF_WIDTH_COMMA    = ',',
      OPEN_BRACE  = '{',
      CLOSE_BRACE = '}';

  // Namespace aliases
  var sugarObject   = Sugar.Object,
      sugarArray    = Sugar.Array,
      sugarDate     = Sugar.Date,
      sugarString   = Sugar.String,
      sugarNumber   = Sugar.Number,
      sugarFunction = Sugar.Function,
      sugarRegExp   = Sugar.RegExp;

  // Core utility aliases
  var hasOwn               = Sugar.util.hasOwn,
      getOwn               = Sugar.util.getOwn,
      setProperty          = Sugar.util.setProperty,
      classToString        = Sugar.util.classToString,
      defineProperty       = Sugar.util.defineProperty,
      forEachProperty      = Sugar.util.forEachProperty,
      mapNativeToChainable = Sugar.util.mapNativeToChainable;

  // Class checks
  var isSerializable,
      isBoolean, isNumber, isString,
      isDate, isRegExp, isFunction,
      isArray, isSet, isMap, isError;

  function buildClassChecks() {

    var knownTypes = {};

    function addCoreTypes() {

      var names = spaceSplit(NATIVE_TYPES);

      isBoolean = buildPrimitiveClassCheck(names[0]);
      isNumber  = buildPrimitiveClassCheck(names[1]);
      isString  = buildPrimitiveClassCheck(names[2]);

      isDate   = buildClassCheck(names[3]);
      isRegExp = buildClassCheck(names[4]);

      // Wanted to enhance performance here by using simply "typeof"
      // but Firefox has two major issues that make this impossible,
      // one fixed, the other not, so perform a full class check here.
      //
      // 1. Regexes can be typeof "function" in FF < 3
      //    https://bugzilla.mozilla.org/show_bug.cgi?id=61911 (fixed)
      //
      // 2. HTMLEmbedElement and HTMLObjectElement are be typeof "function"
      //    https://bugzilla.mozilla.org/show_bug.cgi?id=268945 (won't fix)
      isFunction = buildClassCheck(names[5]);


      isArray = Array.isArray || buildClassCheck(names[6]);
      isError = buildClassCheck(names[7]);

      isSet = buildClassCheck(names[8], typeof Set !== 'undefined' && Set);
      isMap = buildClassCheck(names[9], typeof Map !== 'undefined' && Map);

      // Add core types as known so that they can be checked by value below,
      // notably excluding Functions and adding Arguments and Error.
      addKnownType('Arguments');
      addKnownType(names[0]);
      addKnownType(names[1]);
      addKnownType(names[2]);
      addKnownType(names[3]);
      addKnownType(names[4]);
      addKnownType(names[6]);

    }

    function addArrayTypes() {
      var types = 'Int8 Uint8 Uint8Clamped Int16 Uint16 Int32 Uint32 Float32 Float64';
      forEach(spaceSplit(types), function(str) {
        addKnownType(str + 'Array');
      });
    }

    function addKnownType(className) {
      var str = '[object '+ className +']';
      knownTypes[str] = true;
    }

    function isKnownType(className) {
      return knownTypes[className];
    }

    function buildClassCheck(className, globalObject) {
      if (globalObject && isClass(new globalObject, 'Object')) {
        return getConstructorClassCheck(globalObject);
      } else {
        return getToStringClassCheck(className);
      }
    }

    function getConstructorClassCheck(obj) {
      var ctorStr = String(obj);
      return function(obj) {
        return String(obj.constructor) === ctorStr;
      };
    }

    function getToStringClassCheck(className) {
      return function(obj, str) {
        // perf: Returning up front on instanceof appears to be slower.
        return isClass(obj, className, str);
      };
    }

    function buildPrimitiveClassCheck(className) {
      var type = className.toLowerCase();
      return function(obj) {
        var t = typeof obj;
        return t === type || t === 'object' && isClass(obj, className);
      };
    }

    addCoreTypes();
    addArrayTypes();

    isSerializable = function(obj, className) {
      // Only known objects can be serialized. This notably excludes functions,
      // host objects, Symbols (which are matched by reference), and instances
      // of classes. The latter can arguably be matched by value, but
      // distinguishing between these and host objects -- which should never be
      // compared by value -- is very tricky so not dealing with it here.
      className = className || classToString(obj);
      return isKnownType(className) || isPlainObject(obj, className);
    };

  }

  function isClass(obj, className, str) {
    if (!str) {
      str = classToString(obj);
    }
    return str === '[object '+ className +']';
  }

  // Wrapping the core's "define" methods to
  // save a few bytes in the minified script.
  function wrapNamespace(method) {
    return function(sugarNamespace, arg1, arg2) {
      sugarNamespace[method](arg1, arg2);
    };
  }

  // Method define aliases
  var alias                       = wrapNamespace('alias'),
      defineStatic                = wrapNamespace('defineStatic'),
      defineInstance              = wrapNamespace('defineInstance'),
      defineStaticPolyfill        = wrapNamespace('defineStaticPolyfill'),
      defineInstancePolyfill      = wrapNamespace('defineInstancePolyfill'),
      defineInstanceAndStatic     = wrapNamespace('defineInstanceAndStatic'),
      defineInstanceWithArguments = wrapNamespace('defineInstanceWithArguments');

  function defineInstanceSimilar(sugarNamespace, set, fn, flags) {
    defineInstance(sugarNamespace, collectSimilarMethods(set, fn), flags);
  }

  function collectSimilarMethods(set, fn) {
    var methods = {};
    if (isString(set)) {
      set = spaceSplit(set);
    }
    forEach(set, function(el, i) {
      fn(methods, el, i);
    });
    return methods;
  }

  // This song and dance is to fix methods to a different length
  // from what they actually accept in order to stay in line with
  // spec. Additionally passing argument length, as some methods
  // throw assertion errors based on this (undefined check is not
  // enough). Fortunately for now spec is such that passing 3
  // actual arguments covers all requirements. Note that passing
  // the argument length also forces the compiler to not rewrite
  // length of the compiled function.
  function fixArgumentLength(fn) {
    var staticFn = function(a) {
      var args = arguments;
      return fn(a, args[1], args[2], args.length - 1);
    };
    staticFn.instance = function(b) {
      var args = arguments;
      return fn(this, b, args[1], args.length);
    };
    return staticFn;
  }

  function defineAccessor(namespace, name, fn) {
    setProperty(namespace, name, fn);
  }

  function assertArray(obj) {
    if (!isArray(obj)) {
      throw new TypeError('Array required');
    }
  }

  function assertWritable(obj) {
    if (isPrimitive(obj)) {
      // If strict mode is active then primitives will throw an
      // error when attempting to write properties. We can't be
      // sure if strict mode is available, so pre-emptively
      // throw an error here to ensure consistent behavior.
      throw new TypeError('Property cannot be written');
    }
  }

  // Coerces an object to a positive integer.
  // Does not allow Infinity.
  function coercePositiveInteger(n) {
    n = +n || 0;
    if (n < 0 || !isNumber(n) || !isFinite(n)) {
      throw new RangeError('Invalid number');
    }
    return trunc(n);
  }

  function isDefined(o) {
    return o !== undefined;
  }

  function isUndefined(o) {
    return o === undefined;
  }

  function deepGetProperty(obj, key, any) {
    return handleDeepProperty(obj, key, any, false);
  }

  function handleDeepProperty(obj, key, any, has, fill, fillLast, val) {
    var ns, bs, ps, cbi, set, isLast, isPush, isIndex, nextIsIndex, exists;
    ns = obj || undefined;
    if (key == null) return;

    if (isObjectType(key)) {
      // Allow array and array-like accessors
      bs = [key];
    } else {
      key = String(key);
      if (key.indexOf('..') !== -1) {
        return handleArrayIndexRange(obj, key, any, val);
      }
      bs = key.split('[');
    }

    set = isDefined(val);

    for (var i = 0, blen = bs.length; i < blen; i++) {
      ps = bs[i];

      if (isString(ps)) {
        ps = periodSplit(ps);
      }

      for (var j = 0, plen = ps.length; j < plen; j++) {
        key = ps[j];

        // Is this the last key?
        isLast = i === blen - 1 && j === plen - 1;

        // Index of the closing ]
        cbi = key.indexOf(']');

        // Is the key an array index?
        isIndex = cbi !== -1;

        // Is this array push syntax "[]"?
        isPush = set && cbi === 0;

        // If the bracket split was successful and this is the last element
        // in the dot split, then we know the next key will be an array index.
        nextIsIndex = blen > 1 && j === plen - 1;

        if (isPush) {
          // Set the index to the end of the array
          key = ns.length;
        } else if (isIndex) {
          // Remove the closing ]
          key = key.slice(0, -1);
        }

        // If the array index is less than 0, then
        // add its length to allow negative indexes.
        if (isIndex && key < 0) {
          key = +key + ns.length;
        }

        // Bracket keys may look like users[5] or just [5], so the leading
        // characters are optional. We can enter the namespace if this is the
        // 2nd part, if there is only 1 part, or if there is an explicit key.
        if (i || key || blen === 1) {

          exists = any ? key in ns : hasOwn(ns, key);

          // Non-existent namespaces are only filled if they are intermediate
          // (not at the end) or explicitly filling the last.
          if (fill && (!isLast || fillLast) && !exists) {
            // For our purposes, last only needs to be an array.
            ns = ns[key] = nextIsIndex || (fillLast && isLast) ? [] : {};
            continue;
          }

          if (has) {
            if (isLast || !exists) {
              return exists;
            }
          } else if (set && isLast) {
            assertWritable(ns);
            ns[key] = val;
          }

          ns = exists ? ns[key] : undefined;
        }

      }
    }
    return ns;
  }

  // Get object property with support for 0..1 style range notation.
  function handleArrayIndexRange(obj, key, any, val) {
    var match, start, end, leading, trailing, arr, set;
    match = key.match(PROPERTY_RANGE_REG);
    if (!match) {
      return;
    }

    set = isDefined(val);
    leading = match[1];

    if (leading) {
      arr = handleDeepProperty(obj, leading, any, false, set ? true : false, true);
    } else {
      arr = obj;
    }

    assertArray(arr);

    trailing = match[4];
    start    = match[2] ? +match[2] : 0;
    end      = match[3] ? +match[3] : arr.length;

    // A range of 0..1 is inclusive, so we need to add 1 to the end. If this
    // pushes the index from -1 to 0, then set it to the full length of the
    // array, otherwise it will return nothing.
    end = end === -1 ? arr.length : end + 1;

    if (set) {
      for (var i = start; i < end; i++) {
        handleDeepProperty(arr, i + trailing, any, false, true, false, val);
      }
    } else {
      arr = arr.slice(start, end);

      // If there are trailing properties, then they need to be mapped for each
      // element in the array.
      if (trailing) {
        if (trailing.charAt(0) === HALF_WIDTH_PERIOD) {
          // Need to chomp the period if one is trailing after the range. We
          // can't do this at the regex level because it will be required if
          // we're setting the value as it needs to be concatentated together
          // with the array index to be set.
          trailing = trailing.slice(1);
        }
        return arr.map(function(el) {
          return handleDeepProperty(el, trailing);
        });
      }
    }
    return arr;
  }

  function isObjectType(obj, type) {
    return !!obj && (type || typeof obj) === 'object';
  }

  function isPrimitive(obj, type) {
    type = type || typeof obj;
    return obj == null || type === 'string' || type === 'number' || type === 'boolean';
  }

  function isPlainObject(obj, className) {
    return isObjectType(obj) &&
           isClass(obj, 'Object', className) &&
           hasValidPlainObjectPrototype(obj) &&
           hasOwnEnumeratedProperties(obj);
  }

  function hasValidPlainObjectPrototype(obj) {
    var hasToString = 'toString' in obj;
    var hasConstructor = 'constructor' in obj;
    // An object created with Object.create(null) has no methods in the
    // prototype chain, so check if any are missing. The additional hasToString
    // check is for false positives on some host objects in old IE which have
    // toString but no constructor. If the object has an inherited constructor,
    // then check if it is Object (the "isPrototypeOf" tapdance here is a more
    // robust way of ensuring this if the global has been hijacked). Note that
    // accessing the constructor directly (without "in" or "hasOwnProperty")
    // will throw a permissions error in IE8 on cross-domain windows.
    return (!hasConstructor && !hasToString) ||
            (hasConstructor && !hasOwn(obj, 'constructor') &&
             hasOwn(obj.constructor.prototype, 'isPrototypeOf'));
  }

  function hasOwnEnumeratedProperties(obj) {
    // Plain objects are generally defined as having enumerated properties
    // all their own, however in early IE environments without defineProperty,
    // there may also be enumerated methods in the prototype chain, so check
    // for both of these cases.
    var objectProto = Object.prototype;
    for (var key in obj) {
      var val = obj[key];
      if (!hasOwn(obj, key) && val !== objectProto[key]) {
        return false;
      }
    }
    return true;
  }

  function simpleRepeat(n, fn) {
    for (var i = 0; i < n; i++) {
      fn(i);
    }
  }

  function isArrayIndex(n) {
    return n >>> 0 == n && n != 0xFFFFFFFF;
  }

  function iterateOverSparseArray(arr, fn, fromIndex, loop) {
    var indexes = getSparseArrayIndexes(arr, fromIndex, loop), index;
    for (var i = 0, len = indexes.length; i < len; i++) {
      index = indexes[i];
      fn.call(arr, arr[index], index, arr);
    }
    return arr;
  }

  // It's unclear whether or not sparse arrays qualify as "simple enumerables".
  // If they are not, however, the wrapping function will be deoptimized, so
  // isolate here (also to share between es5 and array modules).
  function getSparseArrayIndexes(arr, fromIndex, loop, fromRight) {
    var indexes = [], i;
    for (i in arr) {
      if (isArrayIndex(i) && (loop || (fromRight ? i <= fromIndex : i >= fromIndex))) {
        indexes.push(+i);
      }
    }
    indexes.sort(function(a, b) {
      var aLoop = a > fromIndex;
      var bLoop = b > fromIndex;
      if (aLoop !== bLoop) {
        return aLoop ? -1 : 1;
      }
      return a - b;
    });
    return indexes;
  }

  function getEntriesForIndexes(obj, find, loop, isString) {
    var result, length = obj.length;
    if (!isArray(find)) {
      return entryAtIndex(obj, find, length, loop, isString);
    }
    result = new Array(find.length);
    forEach(find, function(index, i) {
      result[i] = entryAtIndex(obj, index, length, loop, isString);
    });
    return result;
  }

  function getNormalizedIndex(index, length, loop) {
    if (index && loop) {
      index = index % length;
    }
    if (index < 0) index = length + index;
    return index;
  }

  function entryAtIndex(obj, index, length, loop, isString) {
    index = getNormalizedIndex(index, length, loop);
    return isString ? obj.charAt(index) : obj[index];
  }

  function spaceSplit(str) {
    return str.split(' ');
  }

  function periodSplit(str) {
    return str.split(HALF_WIDTH_PERIOD);
  }

  function forEach(arr, fn) {
    for (var i = 0, len = arr.length; i < len; i++) {
      if (!(i in arr)) {
        return iterateOverSparseArray(arr, fn, i);
      }
      fn(arr[i], i);
    }
  }

  function filter(arr, fn) {
    var result = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      var el = arr[i];
      if (i in arr && fn(el, i)) {
        result.push(el);
      }
    }
    return result;
  }

  function map(arr, fn) {
    // perf: Not using fixed array len here as it may be sparse.
    var result = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      if (i in arr) {
        result.push(fn(arr[i], i));
      }
    }
    return result;
  }

  function indexOf(arr, el) {
    for (var i = 0, len = arr.length; i < len; i++) {
      if (i in arr && arr[i] === el) return i;
    }
    return -1;
  }

  var trunc = Math.trunc || function(n) {
    if (n === 0 || !isFinite(n)) return n;
    return n < 0 ? ceil(n) : floor(n);
  };

  // Fullwidth number helpers
  var fullWidthNumberReg, fullWidthNumberMap, fullWidthNumbers;

  function buildFullWidthNumber() {
    var fwp = FULL_WIDTH_PERIOD, hwp = HALF_WIDTH_PERIOD, hwc = HALF_WIDTH_COMMA, fwn = '';
    fullWidthNumberMap = {};
    for (var i = 0, digit; i <= 9; i++) {
      digit = chr(i + FULL_WIDTH_ZERO);
      fwn += digit;
      fullWidthNumberMap[digit] = chr(i + HALF_WIDTH_ZERO);
    }
    fullWidthNumberMap[hwc] = '';
    fullWidthNumberMap[fwp] = hwp;
    // Mapping this to itself to capture it easily
    // in stringToNumber to detect decimals later.
    fullWidthNumberMap[hwp] = hwp;
    fullWidthNumberReg = allCharsReg(fwn + fwp + hwc + hwp);
    fullWidthNumbers = fwn;
  }

  // Takes into account full-width characters, commas, and decimals.
  function stringToNumber(str, base) {
    var sanitized, isDecimal;
    sanitized = str.replace(fullWidthNumberReg, function(chr) {
      var replacement = getOwn(fullWidthNumberMap, chr);
      if (replacement === HALF_WIDTH_PERIOD) {
        isDecimal = true;
      }
      return replacement;
    });
    return isDecimal ? parseFloat(sanitized) : parseInt(sanitized, base || 10);
  }

  // Math aliases
  var abs   = Math.abs,
      pow   = Math.pow,
      min   = Math.min,
      max   = Math.max,
      ceil  = Math.ceil,
      floor = Math.floor,
      round = Math.round;

  var chr = String.fromCharCode;

  function trim(str) {
    return str.trim();
  }

  function repeatString(str, num) {
    var result = '';
    str = str.toString();
    while (num > 0) {
      if (num & 1) {
        result += str;
      }
      if (num >>= 1) {
        str += str;
      }
    }
    return result;
  }

  function simpleCapitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function createFormatMatcher(bracketMatcher, percentMatcher, precheck) {

    var reg = STRING_FORMAT_REG;
    var compileMemoized = memoizeFunction(compile);

    function getToken(format, match) {
      var get, token, literal, fn;
      var bKey = match[2];
      var pLit = match[3];
      var pKey = match[5];
      if (match[4] && percentMatcher) {
        token = pKey;
        get = percentMatcher;
      } else if (bKey) {
        token = bKey;
        get = bracketMatcher;
      } else if (pLit && percentMatcher) {
        literal = pLit;
      } else {
        literal = match[1] || match[0];
      }
      if (get) {
        assertPassesPrecheck(precheck, bKey, pKey);
        fn = function(obj, opt) {
          return get(obj, token, opt);
        };
      }
      format.push(fn || getLiteral(literal));
    }

    function getSubstring(format, str, start, end) {
      if (end > start) {
        var sub = str.slice(start, end);
        assertNoUnmatched(sub, OPEN_BRACE);
        assertNoUnmatched(sub, CLOSE_BRACE);
        format.push(function() {
          return sub;
        });
      }
    }

    function getLiteral(str) {
      return function() {
        return str;
      };
    }

    function assertPassesPrecheck(precheck, bt, pt) {
      if (precheck && !precheck(bt, pt)) {
        throw new TypeError('Invalid token '+ (bt || pt) +' in format string');
      }
    }

    function assertNoUnmatched(str, chr) {
      if (str.indexOf(chr) !== -1) {
        throw new TypeError('Unmatched '+ chr +' in format string');
      }
    }

    function compile(str) {
      var format = [], lastIndex = 0, match;
      reg.lastIndex = 0;
      while(match = reg.exec(str)) {
        getSubstring(format, str, lastIndex, match.index);
        getToken(format, match);
        lastIndex = reg.lastIndex;
      }
      getSubstring(format, str, lastIndex, str.length);
      return format;
    }

    return function(str, obj, opt) {
      var format = compileMemoized(str), result = '';
      for (var i = 0; i < format.length; i++) {
        result += format[i](obj, opt);
      }
      return result;
    };
  }

  var Inflections = {};

  function getAcronym(str) {
    return Inflections.acronyms && Inflections.acronyms.find(str);
  }

  function getHumanWord(str) {
    return Inflections.human && Inflections.human.find(str);
  }

  function runHumanRules(str) {
    return Inflections.human && Inflections.human.runRules(str) || str;
  }

  function allCharsReg(src) {
    return RegExp('[' + src + ']', 'g');
  }

  function getRegExpFlags(reg, add) {
    var flags = '';
    add = add || '';
    function checkFlag(prop, flag) {
      if (prop || add.indexOf(flag) > -1) {
        flags += flag;
      }
    }
    checkFlag(reg.global, 'g');
    checkFlag(reg.ignoreCase, 'i');
    checkFlag(reg.multiline, 'm');
    checkFlag(reg.sticky, 'y');
    return flags;
  }

  function escapeRegExp(str) {
    if (!isString(str)) str = String(str);
    return str.replace(/([\\\/\'*+?|()\[\]{}.^$-])/g,'\\$1');
  }

  var INTERNAL_MEMOIZE_LIMIT = 1000;

  // Note that attemps to consolidate this with Function#memoize
  // ended up clunky as that is also serializing arguments. Separating
  // these implementations turned out to be simpler.
  function memoizeFunction(fn) {
    var memo = {}, counter = 0;

    return function(key) {
      if (hasOwn(memo, key)) {
        return memo[key];
      }
      if (counter === INTERNAL_MEMOIZE_LIMIT) {
        memo = {};
        counter = 0;
      }
      counter++;
      return memo[key] = fn(key);
    };
  }

  buildClassChecks();

  buildFullWidthNumber();

  /***
   * @module String
   * @description String manupulation, encoding, truncation, and formatting, and more.
   *
   ***/


  // Flag allowing native string methods to be enhanced
  var STRING_ENHANCEMENTS_FLAG = 'enhanceString';

  // Matches non-punctuation characters except apostrophe for capitalization.
  var CAPITALIZE_REG = /[^\u0000-\u0040\u005B-\u0060\u007B-\u007F]+('s)?/g;

  // Regex matching camelCase.
  var CAMELIZE_REG = /(^|_)([^_]+)/g;

  // Regex matching any HTML entity.
  var HTML_ENTITY_REG = /&#?(x)?([\w\d]{0,5});/gi;

  // Very basic HTML escaping regex.
  var HTML_ESCAPE_REG = /[&<>]/g;

  // Special HTML entities.
  var HTMLFromEntityMap = {
    'lt':    '<',
    'gt':    '>',
    'amp':   '&',
    'nbsp':  ' ',
    'quot':  '"',
    'apos':  "'"
  };

  var HTMLToEntityMap;

  // Words that should not be capitalized in titles
  var DOWNCASED_WORDS = [
    'and', 'or', 'nor', 'a', 'an', 'the', 'so', 'but', 'to', 'of', 'at',
    'by', 'from', 'into', 'on', 'onto', 'off', 'out', 'in', 'over',
    'with', 'for'
  ];

  // HTML tags that do not have inner content.
  var HTML_VOID_ELEMENTS = [
    'area','base','br','col','command','embed','hr','img',
    'input','keygen','link','meta','param','source','track','wbr'
  ];

  var LEFT_TRIM_REG  = RegExp('^['+ TRIM_CHARS +']+');

  var RIGHT_TRIM_REG = RegExp('['+ TRIM_CHARS +']+$');

  var TRUNC_REG      = RegExp('(?=[' + TRIM_CHARS + '])');

  // Reference to native String#includes to enhance later.
  var nativeIncludes = String.prototype.includes;

  // Base64
  var encodeBase64, decodeBase64;

  // Format matcher for String#format.
  var stringFormatMatcher = createFormatMatcher(deepGetProperty);

  function padString(num, padding) {
    return repeatString(isDefined(padding) ? padding : ' ', num);
  }

  function truncateString(str, length, from, ellipsis, split) {
    var str1, str2, len1, len2;
    if (str.length <= length) {
      return str.toString();
    }
    ellipsis = isUndefined(ellipsis) ? '...' : ellipsis;
    switch(from) {
      case 'left':
        str2 = split ? truncateOnWord(str, length, true) : str.slice(str.length - length);
        return ellipsis + str2;
      case 'middle':
        len1 = ceil(length / 2);
        len2 = floor(length / 2);
        str1 = split ? truncateOnWord(str, len1) : str.slice(0, len1);
        str2 = split ? truncateOnWord(str, len2, true) : str.slice(str.length - len2);
        return str1 + ellipsis + str2;
      default:
        str1 = split ? truncateOnWord(str, length) : str.slice(0, length);
        return str1 + ellipsis;
    }
  }

  function stringEach(str, search, fn) {
    var chunks, chunk, reg, result = [];
    if (isFunction(search)) {
      fn = search;
      reg = /[\s\S]/g;
    } else if (!search) {
      reg = /[\s\S]/g;
    } else if (isString(search)) {
      reg = RegExp(escapeRegExp(search), 'gi');
    } else if (isRegExp(search)) {
      reg = RegExp(search.source, getRegExpFlags(search, 'g'));
    }
    // Getting the entire array of chunks up front as we need to
    // pass this into the callback function as an argument.
    chunks = runGlobalMatch(str, reg);

    if (chunks) {
      for(var i = 0, len = chunks.length, r; i < len; i++) {
        chunk = chunks[i];
        result[i] = chunk;
        if (fn) {
          r = fn.call(str, chunk, i, chunks);
          if (r === false) {
            break;
          } else if (isDefined(r)) {
            result[i] = r;
          }
        }
      }
    }
    return result;
  }

  // "match" in < IE9 has enumable properties that will confuse for..in
  // loops, so ensure that the match is a normal array by manually running
  // "exec". Note that this method is also slightly more performant.
  function runGlobalMatch(str, reg) {
    var result = [], match, lastLastIndex;
    while ((match = reg.exec(str)) != null) {
      if (reg.lastIndex === lastLastIndex) {
        reg.lastIndex += 1;
      } else {
        result.push(match[0]);
      }
      lastLastIndex = reg.lastIndex;
    }
    return result;
  }

  function eachWord(str, fn) {
    return stringEach(trim(str), /\S+/g, fn);
  }

  function stringCodes(str, fn) {
    var codes = new Array(str.length), i, len;
    for(i = 0, len = str.length; i < len; i++) {
      var code = str.charCodeAt(i);
      codes[i] = code;
      if (fn) {
        fn.call(str, code, i, str);
      }
    }
    return codes;
  }

  function stringUnderscore(str) {
    var areg = Inflections.acronyms && Inflections.acronyms.reg;
    return str
      .replace(/[-\s]+/g, '_')
      .replace(areg, function(acronym, index) {
        return (index > 0 ? '_' : '') + acronym.toLowerCase();
      })
      .replace(/([A-Z\d]+)([A-Z][a-z])/g,'$1_$2')
      .replace(/([a-z\d])([A-Z])/g,'$1_$2')
      .toLowerCase();
  }

  function stringCamelize(str, upper) {
    str = stringUnderscore(str);
    return str.replace(CAMELIZE_REG, function(match, pre, word, index) {
      var cap = upper !== false || index > 0, acronym;
      acronym = getAcronym(word);
      if (acronym && cap) {
        return acronym;
      }
      return cap ? stringCapitalize(word, true) : word;
    });
  }

  function stringSpacify(str) {
    return stringUnderscore(str).replace(/_/g, ' ');
  }

  function stringCapitalize(str, downcase, all) {
    if (downcase) {
      str = str.toLowerCase();
    }
    return all ? str.replace(CAPITALIZE_REG, simpleCapitalize) : simpleCapitalize(str);
  }

  function stringTitleize(str) {
    var fullStopPunctuation = /[.:;!]$/, lastHadPunctuation;
    str = runHumanRules(str);
    str = stringSpacify(str);
    return eachWord(str, function(word, index, words) {
      word = getHumanWord(word) || word;
      word = getAcronym(word) || word;
      var hasPunctuation, isFirstOrLast;
      var first = index == 0, last = index == words.length - 1;
      hasPunctuation = fullStopPunctuation.test(word);
      isFirstOrLast = first || last || hasPunctuation || lastHadPunctuation;
      lastHadPunctuation = hasPunctuation;
      if (isFirstOrLast || indexOf(DOWNCASED_WORDS, word) === -1) {
        return stringCapitalize(word, false, true);
      } else {
        return word;
      }
    }).join(' ');
  }

  function stringParameterize(str, separator) {
    if (separator === undefined) separator = '-';
    str = str.replace(/[^a-z0-9\-_]+/gi, separator);
    if (separator) {
      var reg = RegExp('^{s}+|{s}+$|({s}){s}+'.split('{s}').join(escapeRegExp(separator)), 'g');
      str = str.replace(reg, '$1');
    }
    return encodeURI(str.toLowerCase());
  }

  function reverseString(str) {
    return str.split('').reverse().join('');
  }

  function truncateOnWord(str, limit, fromLeft) {
    if (fromLeft) {
      return reverseString(truncateOnWord(reverseString(str), limit));
    }
    var words = str.split(TRUNC_REG);
    var count = 0;
    return filter(words, function(word) {
      count += word.length;
      return count <= limit;
    }).join('');
  }

  function unescapeHTML(str) {
    return str.replace(HTML_ENTITY_REG, function(full, hex, code) {
      var special = HTMLFromEntityMap[code];
      return special || chr(hex ? parseInt(code, 16) : +code);
    });
  }

  function tagIsVoid(tag) {
    return indexOf(HTML_VOID_ELEMENTS, tag.toLowerCase()) !== -1;
  }

  function stringReplaceAll(str, f, replace) {
    var i = 0, tokens;
    if (isString(f)) {
      f = RegExp(escapeRegExp(f), 'g');
    } else if (f && !f.global) {
      f = RegExp(f.source, getRegExpFlags(f, 'g'));
    }
    if (!replace) {
      replace = '';
    } else {
      tokens = replace;
      replace = function() {
        var t = tokens[i++];
        return t != null ? t : '';
      };
    }
    return str.replace(f, replace);
  }

  function replaceTags(str, find, replacement, strip) {
    var tags = isString(find) ? [find] : find, reg, src;
    tags = map(tags || [], function(t) {
      return escapeRegExp(t);
    }).join('|');
    src = tags.replace('all', '') || '[^\\s>]+';
    src = '<(\\/)?(' + src + ')(\\s+[^<>]*?)?\\s*(\\/)?>';
    reg = RegExp(src, 'gi');
    return runTagReplacements(str.toString(), reg, strip, replacement);
  }

  function runTagReplacements(str, reg, strip, replacement, fullString) {

    var match;
    var result = '';
    var currentIndex = 0;
    var openTagName;
    var openTagAttributes;
    var openTagCount = 0;

    function processTag(index, tagName, attributes, tagLength, isVoid) {
      var content = str.slice(currentIndex, index), s = '', r = '';
      if (isString(replacement)) {
        r = replacement;
      } else if (replacement) {
        r = replacement.call(fullString, tagName, content, attributes, fullString) || '';
      }
      if (strip) {
        s = r;
      } else {
        content = r;
      }
      if (content) {
        content = runTagReplacements(content, reg, strip, replacement, fullString);
      }
      result += s + content + (isVoid ? '' : s);
      currentIndex = index + (tagLength || 0);
    }

    fullString = fullString || str;
    reg = RegExp(reg.source, 'gi');

    while(match = reg.exec(str)) {

      var tagName         = match[2];
      var attributes      = (match[3]|| '').slice(1);
      var isClosingTag    = !!match[1];
      var isSelfClosing   = !!match[4];
      var tagLength       = match[0].length;
      var isVoid          = tagIsVoid(tagName);
      var isOpeningTag    = !isClosingTag && !isSelfClosing && !isVoid;
      var isSameAsCurrent = tagName === openTagName;

      if (!openTagName) {
        result += str.slice(currentIndex, match.index);
        currentIndex = match.index;
      }

      if (isOpeningTag) {
        if (!openTagName) {
          openTagName = tagName;
          openTagAttributes = attributes;
          openTagCount++;
          currentIndex += tagLength;
        } else if (isSameAsCurrent) {
          openTagCount++;
        }
      } else if (isClosingTag && isSameAsCurrent) {
        openTagCount--;
        if (openTagCount === 0) {
          processTag(match.index, openTagName, openTagAttributes, tagLength, isVoid);
          openTagName       = null;
          openTagAttributes = null;
        }
      } else if (!openTagName) {
        processTag(match.index, tagName, attributes, tagLength, isVoid);
      }
    }
    if (openTagName) {
      processTag(str.length, openTagName, openTagAttributes);
    }
    result += str.slice(currentIndex);
    return result;
  }

  function numberOrIndex(str, n, from) {
    if (isString(n)) {
      n = str.indexOf(n);
      if (n === -1) {
        n = from ? str.length : 0;
      }
    }
    return n;
  }

  function buildBase64() {
    var encodeAscii, decodeAscii;

    function catchEncodingError(fn) {
      return function(str) {
        try {
          return fn(str);
        } catch(e) {
          return '';
        }
      };
    }

    if (typeof Buffer !== 'undefined') {
      encodeBase64 = function(str) {
        return new Buffer(str).toString('base64');
      };
      decodeBase64 = function(str) {
        return new Buffer(str, 'base64').toString('utf8');
      };
      return;
    }
    if (typeof btoa !== 'undefined') {
      encodeAscii = catchEncodingError(btoa);
      decodeAscii = catchEncodingError(atob);
    } else {
      var key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      var base64reg = /[^A-Za-z0-9\+\/\=]/g;
      encodeAscii = function(str) {
        var output = '';
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        do {
          chr1 = str.charCodeAt(i++);
          chr2 = str.charCodeAt(i++);
          chr3 = str.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output += key.charAt(enc1);
          output += key.charAt(enc2);
          output += key.charAt(enc3);
          output += key.charAt(enc4);
          chr1 = chr2 = chr3 = '';
          enc1 = enc2 = enc3 = enc4 = '';
        } while (i < str.length);
        return output;
      };
      decodeAscii = function(input) {
        var output = '';
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        if (input.match(base64reg)) {
          return '';
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
        do {
          enc1 = key.indexOf(input.charAt(i++));
          enc2 = key.indexOf(input.charAt(i++));
          enc3 = key.indexOf(input.charAt(i++));
          enc4 = key.indexOf(input.charAt(i++));
          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;
          output = output + chr(chr1);
          if (enc3 != 64) {
            output = output + chr(chr2);
          }
          if (enc4 != 64) {
            output = output + chr(chr3);
          }
          chr1 = chr2 = chr3 = '';
          enc1 = enc2 = enc3 = enc4 = '';
        } while (i < input.length);
        return output;
      };
    }
    encodeBase64 = function(str) {
      return encodeAscii(unescape(encodeURIComponent(str)));
    };
    decodeBase64 = function(str) {
      return decodeURIComponent(escape(decodeAscii(str)));
    };
  }

  function buildEntities() {
    HTMLToEntityMap = {};
    forEachProperty(HTMLFromEntityMap, function(val, key) {
      HTMLToEntityMap[val] = '&' + key + ';';
    });
  }

  function callIncludesWithRegexSupport(str, search, position) {
    if (!isRegExp(search)) {
      return nativeIncludes.call(str, search, position);
    }
    if (position) {
      str = str.slice(position);
    }
    return search.test(str);
  }

  defineInstance(sugarString, {

    // Enhancment to String#includes to allow a regex.
    'includes': fixArgumentLength(callIncludesWithRegexSupport)

  }, [ENHANCEMENTS_FLAG, STRING_ENHANCEMENTS_FLAG]);

  defineInstance(sugarString, {

    /***
     * @method at(<index>, [loop] = false)
     * @returns Mixed
     * @short Gets the character(s) at a given index.
     * @extra When [loop] is true, overshooting the end of the string will begin
     *        counting from the other end. <index> may be negative. If <index> is
     *        an array, multiple elements will be returned.
     * @example
     *
     *   'jumpy'.at(0)             -> 'j'
     *   'jumpy'.at(2)             -> 'm'
     *   'jumpy'.at(5)             -> ''
     *   'jumpy'.at(5, true)       -> 'j'
     *   'jumpy'.at(-1)            -> 'y'
     *   'lucky charms'.at([2, 4]) -> ['u','k']
     *
     ***/
    'at': function(str, index, loop) {
      return getEntriesForIndexes(str, index, loop, true);
    },

    /***
     * @method escapeURL([param] = false)
     * @returns String
     * @short Escapes characters in a string to make a valid URL.
     * @extra If [param] is true, it will also escape valid URL characters. Use
     *        this when the entire string is meant for use in a query string.
     *
     * @example
     *
     *   'a, b, and c'.escapeURL() -> 'a,%20b,%20and%20c'
     *   'http://foo.com/'.escapeURL(true) -> 'http%3A%2F%2Ffoo.com%2F'
     *
     ***/
    'escapeURL': function(str, param) {
      return param ? encodeURIComponent(str) : encodeURI(str);
    },

    /***
     * @method unescapeURL([partial] = false)
     * @returns String
     * @short Restores escaped characters in a URL escaped string.
     * @extra If [partial] is true, it will only unescape non-valid URL tokens,
     *        and is included here for completeness, but should be rarely needed.
     *
     * @example
     *
     *   'http%3A%2F%2Ffoo.com%2F'.unescapeURL()     -> 'http://foo.com/'
     *   'http%3A%2F%2Ffoo.com%2F'.unescapeURL(true) -> 'http%3A%2F%2Ffoo.com%2F'
     *
     ***/
    'unescapeURL': function(str, param) {
      return param ? decodeURI(str) : decodeURIComponent(str);
    },

    /***
     * @method escapeHTML()
     * @returns String
     * @short Converts HTML characters to their entity equivalents.
     *
     * @example
     *
     *   '<p>some text</p>'.escapeHTML() -> '&lt;p&gt;some text&lt;/p&gt;'
     *   'one & two'.escapeHTML()        -> 'one &amp; two'
     *
     ***/
    'escapeHTML': function(str) {
      return str.replace(HTML_ESCAPE_REG, function(chr) {
        return getOwn(HTMLToEntityMap, chr);
      });
    },

    /***
     * @method unescapeHTML()
     * @returns String
     * @short Restores escaped HTML characters.
     *
     * @example
     *
     *   '&lt;p&gt;some text&lt;/p&gt;'.unescapeHTML() -> '<p>some text</p>'
     *   'one &amp; two'.unescapeHTML()                -> 'one & two'
     *
     ***/
    'unescapeHTML': function(str) {
      return unescapeHTML(str);
    },

    /***
     * @method stripTags([tag] = 'all', [replace])
     * @returns String
     * @short Strips HTML tags from the string.
     * @extra [tag] may be an array of tags or 'all', in which case all tags will
     *        be stripped. [replace] will replace what was stripped, and may be a
     *        string or a function to handle replacements. If this function returns
     *        a string, then it will be used for the replacement. If it returns
     *        `undefined`, the tags will be stripped normally.
     *
     * @callback replace
     *
     *   tag     The tag name.
     *   inner   The tag content.
     *   attr    The attributes on the tag, if any, as a string.
     *   outer   The entire matched tag string.
     *
     * @example
     *
     *   '<p>just <b>some</b> text</p>'.stripTags()    -> 'just some text'
     *   '<p>just <b>some</b> text</p>'.stripTags('p') -> 'just <b>some</b> text'
     *   '<p>hi!</p>'.stripTags('p', function(all, content) {
     *     return '|';
     *   }); -> '|hi!|'
     *
     ***/
    'stripTags': function(str, tag, replace) {
      return replaceTags(str, tag, replace, true);
    },

    /***
     * @method removeTags([tag] = 'all', [replace])
     * @returns String
     * @short Removes HTML tags and their contents from the string.
     * @extra [tag] may be an array of tags or 'all', in which case all tags will
     *        be removed. [replace] will replace what was removed, and may be a
     *        string or a function to handle replacements. If this function returns
     *        a string, then it will be used for the replacement. If it returns
     *        `undefined`, the tags will be removed normally.
     *
     * @callback replace
     *
     *   tag     The tag name.
     *   inner   The tag content.
     *   attr    The attributes on the tag, if any, as a string.
     *   outer   The entire matched tag string.
     *
     * @example
     *
     *   '<p>just <b>some</b> text</p>'.removeTags()    -> ''
     *   '<p>just <b>some</b> text</p>'.removeTags('b') -> '<p>just text</p>'
     *   '<p>hi!</p>'.removeTags('p', function(all, content) {
     *     return 'bye!';
     *   }); -> 'bye!'
     *
     ***/
    'removeTags': function(str, tag, replace) {
      return replaceTags(str, tag, replace, false);
    },

    /***
     * @method encodeBase64()
     * @returns String
     * @short Encodes the string into base64 encoding.
     * @extra This method wraps native methods when available, and uses a custom
     *        implementation when not available. It can also handle Unicode
     *        string encodings.
     *
     * @example
     *
     *   'gonna get encoded!'.encodeBase64()  -> 'Z29ubmEgZ2V0IGVuY29kZWQh'
     *   'http://twitter.com/'.encodeBase64() -> 'aHR0cDovL3R3aXR0ZXIuY29tLw=='
     *
     ***/
    'encodeBase64': function(str) {
      return encodeBase64(str);
    },

    /***
     * @method decodeBase64()
     * @returns String
     * @short Decodes the string from base64 encoding.
     * @extra This method wraps native methods when available, and uses a custom
     *        implementation when not available. It can also handle Unicode string
     *        encodings.
     *
     * @example
     *
     *   'aHR0cDovL3R3aXR0ZXIuY29tLw=='.decodeBase64() -> 'http://twitter.com/'
     *   'anVzdCBnb3QgZGVjb2RlZA=='.decodeBase64()     -> 'just got decoded!'
     *
     ***/
    'decodeBase64': function(str) {
      return decodeBase64(str);
    },

    /***
     * @method forEach([search], [fn])
     * @returns Array
     * @short Runs callback [fn] against every character in the string, or every
     *        every occurence of [search] if it is provided.
     * @extra Returns an array of matches. [search] may be either a string or
     *        regex, and defaults to every character in the string. If [fn]
     *        returns false at any time it will break out of the loop.
     *
     * @callback fn
     *
     *   match  The current match.
     *   i      The current index.
     *   arr    An array of all matches.
     *
     * @example
     *
     *   'jumpy'.forEach(log)     -> ['j','u','m','p','y']
     *   'jumpy'.forEach(/[r-z]/) -> ['u','y']
     *   'jumpy'.forEach(/mp/)    -> ['mp']
     *   'jumpy'.forEach(/[r-z]/, function(m) {
     *     // Called twice: "u", "y"
     *   });
     *
     ***/
    'forEach': function(str, search, fn) {
      return stringEach(str, search, fn);
    },

    /***
     * @method chars([fn])
     * @returns Array
     * @short Runs [fn] against each character in the string, and returns an array.
     *
     * @callback fn
     *
     *   code  The current character.
     *   i     The current index.
     *   arr   An array of all characters.
     *
     * @example
     *
     *   'jumpy'.chars() -> ['j','u','m','p','y']
     *   'jumpy'.chars(function(c) {
     *     // Called 5 times: "j","u","m","p","y"
     *   });
     *
     ***/
    'chars': function(str, search, fn) {
      return stringEach(str, search, fn);
    },

    /***
     * @method words([fn])
     * @returns Array
     * @short Runs [fn] against each word in the string, and returns an array.
     * @extra A "word" is defined as any sequence of non-whitespace characters.
     *
     * @callback fn
     *
     *   word  The current word.
     *   i     The current index.
     *   arr   An array of all words.
     *
     * @example
     *
     *   'broken wear'.words() -> ['broken','wear']
     *   'broken wear'.words(function(w) {
     *     // Called twice: "broken", "wear"
     *   });
     *
     ***/
    'words': function(str, fn) {
      return stringEach(trim(str), /\S+/g, fn);
    },

    /***
     * @method lines([fn])
     * @returns Array
     * @short Runs [fn] against each line in the string, and returns an array.
     *
     * @callback fn
     *
     *   line  The current line.
     *   i     The current index.
     *   arr   An array of all lines.
     *
     * @example
     *
     *   lineText.lines() -> array of lines
     *   lineText.lines(function(l) {
     *     // Called once per line
     *   });
     *
     ***/
    'lines': function(str, fn) {
      return stringEach(trim(str), /^.*$/gm, fn);
    },

    /***
     * @method codes([fn])
     * @returns Array
     * @short Runs callback [fn] against each character code in the string.
     *        Returns an array of character codes.
     *
     * @callback fn
     *
     *   code  The current character code.
     *   i     The current index.
     *   str   The string being operated on.
     *
     * @example
     *
     *   'jumpy'.codes() -> [106,117,109,112,121]
     *   'jumpy'.codes(function(c) {
     *     // Called 5 times: 106, 117, 109, 112, 121
     *   });
     *
     ***/
    'codes': function(str, fn) {
      return stringCodes(str, fn);
    },

    /***
     * @method shift(<n>)
     * @returns Array
     * @short Shifts each character in the string <n> places in the character map.
     *
     * @example
     *
     *   'a'.shift(1)  -> 'b'
     *   'ク'.shift(1) -> 'グ'
     *
     ***/
    'shift': function(str, n) {
      var result = '';
      n = n || 0;
      stringCodes(str, function(c) {
        result += chr(c + n);
      });
      return result;
    },

    /***
     * @method isBlank()
     * @returns Boolean
     * @short Returns true if the string has length 0 or contains only whitespace.
     *
     * @example
     *
     *   ''.isBlank()      -> true
     *   '   '.isBlank()   -> true
     *   'noway'.isBlank() -> false
     *
     ***/
    'isBlank': function(str) {
      return trim(str).length === 0;
    },

    /***
     * @method isEmpty()
     * @returns Boolean
     * @short Returns true if the string has length 0.
     *
     * @example
     *
     *   ''.isEmpty()  -> true
     *   'a'.isBlank() -> false
     *   ' '.isBlank() -> false
     *
     ***/
    'isEmpty': function(str) {
      return str.length === 0;
    },

    /***
     * @method insert(<str>, [index] = length)
     * @returns String
     * @short Adds <str> at [index]. Allows negative values.
     *
     * @example
     *
     *   'dopamine'.insert('e', 3)       -> dopeamine
     *   'spelling eror'.insert('r', -3) -> spelling error
     *
     ***/
    'insert': function(str, substr, index) {
      index = isUndefined(index) ? str.length : index;
      return str.slice(0, index) + substr + str.slice(index);
    },

    /***
     * @method remove(<f>)
     * @returns String
     * @short Removes the first occurrence of <f> in the string.
     * @extra <f> can be a either case-sensitive string or a regex. In either case
     *        only the first match will be removed. To remove multiple occurrences,
     *        use `removeAll`.
     *
     * @example
     *
     *   'schfifty five'.remove('f')      -> 'schifty five'
     *   'schfifty five'.remove(/[a-f]/g) -> 'shfifty five'
     *
     ***/
    'remove': function(str, f) {
      return str.replace(f, '');
    },

    /***
     * @method removeAll(<f>)
     * @returns String
     * @short Removes any occurences of <f> in the string.
     * @extra <f> can be either a case-sensitive string or a regex. In either case
     *        all matches will be removed. To remove only a single occurence, use
     *        `remove`.
     *
     * @example
     *
     *   'schfifty five'.removeAll('f')     -> 'schity ive'
     *   'schfifty five'.removeAll(/[a-f]/) -> 'shity iv'
     *
     ***/
    'removeAll': function(str, f) {
      return stringReplaceAll(str, f);
    },

    /***
     * @method reverse()
     * @returns String
     * @short Reverses the string.
     *
     * @example
     *
     *   'jumpy'.reverse()        -> 'ypmuj'
     *   'lucky charms'.reverse() -> 'smrahc ykcul'
     *
     ***/
    'reverse': function(str) {
      return reverseString(str);
    },

    /***
     * @method compact()
     * @returns String
     * @short Compacts whitespace in the string to a single space and trims the ends.
     *
     * @example
     *
     *   'too \n much \n space'.compact() -> 'too much space'
     *   'enough \n '.compact()           -> 'enought'
     *
     ***/
    'compact': function(str) {
      return trim(str).replace(/([\r\n\s　])+/g, function(match, whitespace) {
        return whitespace === '　' ? whitespace : ' ';
      });
    },

    /***
     * @method from([index] = 0)
     * @returns String
     * @short Returns a section of the string starting from [index].
     *
     * @example
     *
     *   'lucky charms'.from()   -> 'lucky charms'
     *   'lucky charms'.from(7)  -> 'harms'
     *
     ***/
    'from': function(str, from) {
      return str.slice(numberOrIndex(str, from, true));
    },

    /***
     * @method to([index] = end)
     * @returns String
     * @short Returns a section of the string ending at [index].
     *
     * @example
     *
     *   'lucky charms'.to()   -> 'lucky charms'
     *   'lucky charms'.to(7)  -> 'lucky ch'
     *
     ***/
    'to': function(str, to) {
      if (isUndefined(to)) to = str.length;
      return str.slice(0, numberOrIndex(str, to));
    },

    /***
     * @method dasherize()
     * @returns String
     * @short Converts underscores and camel casing to hypens.
     *
     * @example
     *
     *   'a_farewell_to_arms'.dasherize() -> 'a-farewell-to-arms'
     *   'capsLock'.dasherize()           -> 'caps-lock'
     *
     ***/
    'dasherize': function(str) {
      return stringUnderscore(str).replace(/_/g, '-');
    },

    /***
     * @method underscore()
     * @returns String
     * @short Converts hyphens and camel casing to underscores.
     *
     * @example
     *
     *   'a-farewell-to-arms'.underscore() -> 'a_farewell_to_arms'
     *   'capsLock'.underscore()           -> 'caps_lock'
     *
     ***/
    'underscore': function(str) {
      return stringUnderscore(str);
    },

    /***
     * @method camelize([upper] = true)
     * @returns String
     * @short Converts underscores and hyphens to camel case.
     * @extra If [upper] is true, the string will be UpperCamelCase. If the
     *        inflections module is included, acronyms can also be defined that
     *        will be used when camelizing.
     *
     * @example
     *
     *   'caps_lock'.camelize()              -> 'CapsLock'
     *   'moz-border-radius'.camelize()      -> 'MozBorderRadius'
     *   'moz-border-radius'.camelize(false) -> 'mozBorderRadius'
     *   'http-method'.camelize()            -> 'HTTPMethod'
     *
     ***/
    'camelize': function(str, upper) {
      return stringCamelize(str, upper);
    },

    /***
     * @method spacify()
     * @returns String
     * @short Converts camelcase, underscores, and hyphens to spaces.
     *
     * @example
     *
     *   'camelCase'.spacify()                         -> 'camel case'
     *   'an-ugly-string'.spacify()                    -> 'an ugly string'
     *   'oh-no_youDid-not'.spacify().capitalize(true) -> 'something else'
     *
     ***/
    'spacify': function(str) {
      return stringSpacify(str);
    },

    /***
     * @method titleize()
     * @returns String
     * @short Creates a title version of the string.
     * @extra Capitalizes all the words and replaces some characters in the string
     *        to create a nicer looking title. String#titleize is meant for
     *        creating pretty output.
     *
     * @example
     *
     *   'man from the boondocks'.titleize() -> 'Man from the Boondocks'
     *   'x-men: apocalypse'.titleize() -> 'X Men: Apocalypse'
     *   'TheManWithoutAPast'.titleize() -> 'The Man Without a Past'
     *   'raiders_of_the_lost_ark'.titleize() -> 'Raiders of the Lost Ark'
     *
     ***/
    'titleize': function(str) {
      return stringTitleize(str);
    },

    /***
     * @method parameterize()
     * @returns String
     * @short Replaces special characters in a string so that it may be used as
     *        part of a pretty URL.
     *
     * @example
     *
     *   'hell, no!'.parameterize() -> 'hell-no'
     *
     ***/
    'parameterize': function(str, separator) {
      return stringParameterize(str, separator);
    },

    /***
     * @method truncate(<length>, [from] = 'right', [ellipsis] = '...')
     * @returns String
     * @short Truncates a string.
     * @extra [from] can be `'right'`, `'left'`, or `'middle'`. If the string is
     *        shorter than <length>, [ellipsis] will not be added.
     *
     * @example
     *
     *   'sittin on the dock'.truncate(10)           -> 'sittin on ...'
     *   'sittin on the dock'.truncate(10, 'left')   -> '...n the dock'
     *   'sittin on the dock'.truncate(10, 'middle') -> 'sitti... dock'
     *
     ***/
    'truncate': function(str, length, from, ellipsis) {
      return truncateString(str, length, from, ellipsis);
    },

    /***
     * @method truncateOnWord(<length>, [from] = 'right', [ellipsis] = '...')
     * @returns String
     * @short Truncates a string without splitting up words.
     * @extra [from] can be `'right'`, `'left'`, or `'middle'`. If the string is
     *        shorter than <length>, [ellipsis] will not be added. A "word" is
     *        defined as any sequence of non-whitespace characters.
     *
     * @example
     *
     *   'here we go'.truncateOnWord(5)         -> 'here...'
     *   'here we go'.truncateOnWord(5, 'left') -> '...we go'
     *
     ***/
    'truncateOnWord': function(str, length, from, ellipsis) {
      return truncateString(str, length, from, ellipsis, true);
    },

    /***
     * @method pad(<num> = null, [padding] = ' ')
     * @returns String
     * @short Pads the string out with [padding] to be exactly <num> characters.
     *
     * @example
     *
     *   'wasabi'.pad(8)      -> ' wasabi '
     *   'wasabi'.pad(8, '-') -> '-wasabi-'
     *
     ***/
    'pad': function(str, num, padding) {
      var half, front, back;
      num   = coercePositiveInteger(num);
      half  = max(0, num - str.length) / 2;
      front = floor(half);
      back  = ceil(half);
      return padString(front, padding) + str + padString(back, padding);
    },

    /***
     * @method padLeft(<num> = null, [padding] = ' ')
     * @returns String
     * @short Pads the string out from the left with [padding] to be exactly
     *        <num> characters.
     *
     * @example
     *
     *   'wasabi'.padLeft(8)      -> '  wasabi'
     *   'wasabi'.padLeft(8, '-') -> '--wasabi'
     *
     ***/
    'padLeft': function(str, num, padding) {
      num = coercePositiveInteger(num);
      return padString(max(0, num - str.length), padding) + str;
    },

    /***
     * @method padRight(<num> = null, [padding] = ' ')
     * @returns String
     * @short Pads the string out from the right with [padding] to be exactly
     *        <num> characters.
     *
     * @example
     *
     *   'wasabi'.padRight(8)      -> 'wasabi  '
     *   'wasabi'.padRight(8, '-') -> 'wasabi--'
     *
     ***/
    'padRight': function(str, num, padding) {
      num = coercePositiveInteger(num);
      return str + padString(max(0, num - str.length), padding);
    },

    /***
     * @method first([n] = 1)
     * @returns String
     * @short Returns the first [n] characters of the string.
     *
     * @example
     *
     *   'lucky charms'.first()  -> 'l'
     *   'lucky charms'.first(3) -> 'luc'
     *
     ***/
    'first': function(str, num) {
      if (isUndefined(num)) num = 1;
      return str.substr(0, num);
    },

    /***
     * @method last([n] = 1)
     * @returns String
     * @short Returns the last [n] characters of the string.
     *
     * @example
     *
     *   'lucky charms'.last()  -> 's'
     *   'lucky charms'.last(3) -> 'rms'
     *
     ***/
    'last': function(str, num) {
      if (isUndefined(num)) num = 1;
      var start = str.length - num < 0 ? 0 : str.length - num;
      return str.substr(start);
    },

    /***
     * @method toNumber([base] = 10)
     * @returns Number
     * @short Converts the string into a number.
     * @extra Any value with a "." fill be converted to a floating point value,
     *        otherwise an integer.
     *
     * @example
     *
     *   '153'.toNumber()    -> 153
     *   '12,000'.toNumber() -> 12000
     *   '10px'.toNumber()   -> 10
     *   'ff'.toNumber(16)   -> 255
     *
     ***/
    'toNumber': function(str, base) {
      return stringToNumber(str, base);
    },

    /***
     * @method capitalize([lower] = false, [all] = false)
     * @returns String
     * @short Capitalizes the first character of the string.
     * @extra If [lower] is true, the remainder of the string will be downcased.
     *        If [all] is true, all words in the string will be capitalized.
     *
     * @example
     *
     *   'hello'.capitalize()           -> 'Hello'
     *   'HELLO'.capitalize(true)       -> 'Hello'
     *   'hello kitty'.capitalize()     -> 'Hello kitty'
     *   'hEllO kItTy'.capitalize(true, true) -> 'Hello Kitty'
     *
     ***/
    'capitalize': function(str, lower, all) {
      return stringCapitalize(str, lower, all);
    },

    /***
     * @method trimLeft()
     * @returns String
     * @short Removes leading whitespace from the string.
     * @extra Whitespace is defined as line breaks, tabs, and any character in the
     *        "Space, Separator" Unicode category, conforming to the the ES5 `trim`
     *        spec.
     *
     * @example
     *
     *   '   wasabi   '.trimLeft()  -> 'wasabi   '
     *
     ***/
    'trimLeft': function(str) {
      return str.replace(LEFT_TRIM_REG, '');
    },

    /***
     * @method trimRight()
     * @returns String
     * @short Removes trailing whitespace from the string.
     * @extra Whitespace is defined as line breaks, tabs, and any character in the
     *        "Space, Separator" Unicode category, conforming to the the ES5 `trim`
     *        spec.
     *
     * @example
     *
     *   '   wasabi   '.trimRight() -> '   wasabi'
     *
     ***/
    'trimRight': function(str) {
      return str.replace(RIGHT_TRIM_REG, '');
    }

  });

  defineInstanceWithArguments(sugarString, {

    /***
     * @method replaceAll(<f>, [str1], [str2], ...)
     * @returns String
     * @short Replaces all occurences of <f> with arguments passed.
     * @extra This method is intended to be a quick way to perform multiple string
     *        replacements quickly when the replacement token differs depending on
     *        position. <f> can be either a case-sensitive string or a regex.
     *        In either case all matches will be replaced.
     *
     * @example
     *
     *   '-x -y -z'.replaceAll('-', 1, 2, 3)               -> '1x 2y 3z'
     *   'one and two'.replaceAll(/one|two/, '1st', '2nd') -> '1st and 2nd'
     *
     ***/
    'replaceAll': function(str, f, args) {
      return stringReplaceAll(str, f, args);
    },

    /***
     * @method format(<obj1>, <obj2>, ...)
     * @returns String
     * @short Replaces `{}` tokens in the string with arguments or properties.
     * @extra Tokens support `deep properties`. If a single object is passed, its
     *        properties can be accessed by keywords such as `{name}`. If multiple
     *        objects or a non-object are passed, they can be accessed by the
     *        argument position like `{0}`. Literal braces in the string can be
     *        escaped by repeating them.
     *
     * @example
     *
     *   'Welcome, {name}.'.format({ name: 'Bill' }) -> 'Welcome, Bill.'
     *   'You are {0} years old today.'.format(5)    -> 'You are 5 years old today.'
     *   '{0.name} and {1.name}'.format(users)       -> logs first two users' names
     *   '${currencies.usd.balance}'.format(Harry)   -> "$500"
     *   '{{Hello}}'.format('Hello')                 -> "{Hello}"
     *
     ***/
    'format': function(str, args) {
      var arg1 = args[0] && args[0].valueOf();
      // Unwrap if a single object is passed in.
      if (args.length === 1 && isObjectType(arg1)) {
        args = arg1;
      }
      return stringFormatMatcher(str, args);
    }

  });

  buildBase64();

  buildEntities();

  /***
   * @module Range
   * @description Date, Number, and String ranges that can be manipulated and compared,
   *              or enumerate over specific points within the range.
   *
   ***/


  var PrimitiveRangeConstructor = function(start, end) {
    return new Range(start, end);
  };

  function Range(start, end) {
    this.start = cloneRangeMember(start);
    this.end   = cloneRangeMember(end);
  }

  function getRangeMemberPrimitiveValue(m) {
    if (m == null) return m;
    return isDate(m) ? m.getTime() : m.valueOf();
  }

  function cloneRangeMember(m) {
    if (isDate(m)) {
      return new Date(m.getTime());
    } else {
      return getRangeMemberPrimitiveValue(m);
    }
  }

  defineStatic(sugarString, {

    /***
     * @method range([start], [end])
     * @returns Range
     * @static
     * @short Creates a new string range between [start] and [end]. See `ranges`
     *        for more.
     *
     * @example
     *
     *   String.range('a', 'z')
     *   String.range('t', 'm')
     *
     ***/
    'range': PrimitiveRangeConstructor

  });

  /***
   * @module Inflections
   * @namespace String
   * @description Pluralization and support for acronyms and humanized strings in
   *              string inflecting methods.
   *
   ***/


  var InflectionSet;

  /***
   * @method addAcronym(<str>)
   * @accessor
   * @short Adds a new acronym that will be recognized when inflecting strings.
   * @extra Acronyms are recognized by `camelize`, `underscore`, `dasherize`,
   *        `titleize`, `humanize`, and `spacify`. <str> must be passed as it
   *        will appear in a camelized string. Acronyms may contain lower case
   *        letters but must begin with an upper case letter. Note that to use
   *        acronyms in conjuction with `pluralize`, the pluralized form of the
   *        acronym must also be added.
   *
   * @example
   *
   *   Sugar.String.addAcronym('HTML');
   *   Sugar.String.addAcronym('API');
   *   Sugar.String.addAcronym('APIs');
   *
   ***
   * @method addPlural(<singular>, [plural] = singular)
   * @short Adds a new pluralization rule.
   * @accessor
   * @extra Rules are used by `pluralize` and `singularize`. If [singular] is
   *        a string, then the reciprocal will also be added for singularization.
   *        If it is a regular expression, capturing groups are allowed for
   *        [plural]. [plural] defaults to the same as [singular] to allow
   *        uncountable words.
   *
   * @example
   *
   *   Sugar.String.addPlural('hashtag', 'hashtaggies');
   *   Sugar.String.addPlural(/(tag)$/, '$1gies');
   *   Sugar.String.addPlural('advice');
   *
   ***
   * @method addHuman(<str>, <human>)
   * @short Adds a new humanization rule.
   * @accessor
   * @extra Rules are used by `humanize` and `titleize`. [str] can be either a
   *        string or a regular expression, in which case [human] can contain
   *        refences to capturing groups.
   *
   * @example
   *
   *   Sugar.String.addHuman('src', 'source');
   *   Sugar.String.addHuman(/_ref/, 'reference');
   *
   ***/
  function buildInflectionAccessors() {
    defineAccessor(sugarString, 'addAcronym', addAcronym);
    defineAccessor(sugarString, 'addPlural', addPlural);
    defineAccessor(sugarString, 'addHuman', addHuman);
  }

  function buildInflectionSet() {

    InflectionSet = function() {
      this.map = {};
      this.rules = [];
    };

    InflectionSet.prototype = {

      add: function(rule, replacement) {
        if (isString(rule)) {
          this.map[rule] = replacement;
        } else {
          this.rules.unshift({
            rule: rule,
            replacement: replacement
          });
        }
      },

      inflect: function(str) {
        var arr, idx, word;

        arr = str.split(' ');
        idx = arr.length - 1;
        word = arr[idx];

        arr[idx] = this.find(word) || this.runRules(word);
        return arr.join(' ');
      },

      find: function(str) {
        return getOwn(this.map, str);
      },

      runRules: function(str) {
        for (var i = 0, r; r = this.rules[i]; i++) {
          if (r.rule.test(str)) {
            str = str.replace(r.rule, r.replacement);
            break;
          }
        }
        return str;
      }

    };

  }

  // Global inflection runners. Allowing the build functions below to define
  // these functions so that common inflections will also be bundled together
  // when these methods are modularized.
  var inflectPlurals;

  var inflectHumans;

  function buildCommonPlurals() {

    inflectPlurals = function(type, str) {
      return Inflections[type] && Inflections[type].inflect(str) || str;
    };

    addPlural(/$/, 's');
    addPlural(/s$/i, 's');
    addPlural(/(ax|test)is$/i, '$1es');
    addPlural(/(octop|fung|foc|radi|alumn|cact)(i|us)$/i, '$1i');
    addPlural(/(census|alias|status|fetus|genius|virus)$/i, '$1es');
    addPlural(/(bu)s$/i, '$1ses');
    addPlural(/(buffal|tomat)o$/i, '$1oes');
    addPlural(/([ti])um$/i, '$1a');
    addPlural(/([ti])a$/i, '$1a');
    addPlural(/sis$/i, 'ses');
    addPlural(/f+e?$/i, 'ves');
    addPlural(/(cuff|roof)$/i, '$1s');
    addPlural(/([ht]ive)$/i, '$1s');
    addPlural(/([^aeiouy]o)$/i, '$1es');
    addPlural(/([^aeiouy]|qu)y$/i, '$1ies');
    addPlural(/(x|ch|ss|sh)$/i, '$1es');
    addPlural(/(tr|vert)(?:ix|ex)$/i, '$1ices');
    addPlural(/([ml])ouse$/i, '$1ice');
    addPlural(/([ml])ice$/i, '$1ice');
    addPlural(/^(ox)$/i, '$1en');
    addPlural(/^(oxen)$/i, '$1');
    addPlural(/(quiz)$/i, '$1zes');
    addPlural(/(phot|cant|hom|zer|pian|portic|pr|quart|kimon)o$/i, '$1os');
    addPlural(/(craft)$/i, '$1');
    addPlural(/([ft])[eo]{2}(th?)$/i, '$1ee$2');

    addSingular(/s$/i, '');
    addSingular(/([pst][aiu]s)$/i, '$1');
    addSingular(/([aeiouy])ss$/i, '$1ss');
    addSingular(/(n)ews$/i, '$1ews');
    addSingular(/([ti])a$/i, '$1um');
    addSingular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1$2sis');
    addSingular(/(^analy)ses$/i, '$1sis');
    addSingular(/(i)(f|ves)$/i, '$1fe');
    addSingular(/([aeolr]f?)(f|ves)$/i, '$1f');
    addSingular(/([ht]ive)s$/i, '$1');
    addSingular(/([^aeiouy]|qu)ies$/i, '$1y');
    addSingular(/(s)eries$/i, '$1eries');
    addSingular(/(m)ovies$/i, '$1ovie');
    addSingular(/(x|ch|ss|sh)es$/i, '$1');
    addSingular(/([ml])(ous|ic)e$/i, '$1ouse');
    addSingular(/(bus)(es)?$/i, '$1');
    addSingular(/(o)es$/i, '$1');
    addSingular(/(shoe)s?$/i, '$1');
    addSingular(/(cris|ax|test)[ie]s$/i, '$1is');
    addSingular(/(octop|fung|foc|radi|alumn|cact)(i|us)$/i, '$1us');
    addSingular(/(census|alias|status|fetus|genius|virus)(es)?$/i, '$1');
    addSingular(/^(ox)(en)?/i, '$1');
    addSingular(/(vert)(ex|ices)$/i, '$1ex');
    addSingular(/tr(ix|ices)$/i, 'trix');
    addSingular(/(quiz)(zes)?$/i, '$1');
    addSingular(/(database)s?$/i, '$1');
    addSingular(/ee(th?)$/i, 'oo$1');

    addIrregular('person', 'people');
    addIrregular('man', 'men');
    addIrregular('human', 'humans');
    addIrregular('child', 'children');
    addIrregular('sex', 'sexes');
    addIrregular('move', 'moves');
    addIrregular('save', 'saves');
    addIrregular('goose', 'geese');
    addIrregular('zombie', 'zombies');

    addUncountable('equipment information rice money species series fish deer sheep jeans');

  }

  function buildCommonHumans() {

    inflectHumans = runHumanRules;

    addHuman(/_id$/g, '');
  }

  function addPlural(singular, plural) {
    plural = plural || singular;
    addInflection('plural', singular, plural);
    if (isString(singular)) {
      addSingular(plural, singular);
    }
  }

  function addSingular(plural, singular) {
    addInflection('singular', plural, singular);
  }

  function addIrregular(singular, plural) {
    var sReg = RegExp(singular + '$', 'i');
    var pReg = RegExp(plural + '$', 'i');
    addPlural(sReg, plural);
    addPlural(pReg, plural);
    addSingular(pReg, singular);
    addSingular(sReg, singular);
  }

  function addUncountable(set) {
    forEach(spaceSplit(set), function(str) {
      addPlural(str);
    });
  }

  function addHuman(src, humanized) {
    addInflection('human', src, humanized);
  }

  function addAcronym(str) {
    addInflection('acronyms', str, str);
    addInflection('acronyms', str.toLowerCase(), str);
    buildAcronymReg();
  }

  function buildAcronymReg() {
    var tokens = [];
    forEachProperty(Inflections.acronyms.map, function(val, key) {
      if (key === val) {
        tokens.push(val);
      }
    });
    // Sort by length to ensure that tokens
    // like HTTPS take precedence over HTTP.
    tokens.sort(function(a, b) {
      return b.length - a.length;
    });
    Inflections.acronyms.reg = RegExp('\\b' + tokens.join('|') + '\\b', 'g');
  }

  function addInflection(type, rule, replacement) {
    if (!Inflections[type]) {
      Inflections[type] = new InflectionSet;
    }
    Inflections[type].add(rule, replacement);
  }

  defineInstance(sugarString, {

    /***
     * @method pluralize([num])
     * @returns String
     * @short Returns the plural form of the last word in the string.
     * @extra If [num] is passed, the word will be singularized if equal to 1.
     *        Otherwise it will be pluralized. Custom pluralization rules can be
     *        added using `addPlural`.
     *
     * @example
     *
     *   'post'.pluralize()    -> 'posts'
     *   'post'.pluralize(1)   -> 'post'
     *   'post'.pluralize(2)   -> 'posts'
     *   'octopus'.pluralize() -> 'octopi'
     *   'sheep'.pluralize()   -> 'sheep'
     *
     ***/
    'pluralize': function(str, num) {
      str = String(str);
      // Reminder that this pretty much holds true only for English.
      return num === 1 || str.length === 0 ? str : inflectPlurals('plural', str);
    },

    /***
     * @method singularize()
     * @returns String
     * @short Returns the singular form of the last word in the string.
     *
     * @example
     *
     *   'posts'.singularize()       -> 'post'
     *   'octopi'.singularize()      -> 'octopus'
     *   'sheep'.singularize()       -> 'sheep'
     *   'word'.singularize()        -> 'word'
     *   'CamelOctopi'.singularize() -> 'CamelOctopus'
     *
     ***/
    'singularize': function(str) {
      return inflectPlurals('singular', String(str));
    },

    /***
     * @method humanize()
     * @returns String
     * @short Creates a human readable string.
     * @extra Capitalizes the first word and turns underscores into spaces and
     *        strips a trailing '_id', if any. Like `titleize`, this is meant
     *        for creating pretty output. Rules for special cases can be added
     *        using `addHuman`.
     *
     * @example
     *
     *   'employee_salary'.humanize() -> 'Employee salary'
     *   'author_id'.humanize()       -> 'Author'
     *
     ***/
    'humanize': function(str) {
      str = inflectHumans(str);
      str = str.replace(/(_)?([a-z\d]*)/gi, function(match, _, word) {
        word = getHumanWord(word) || word;
        word = getAcronym(word) || word.toLowerCase();
        return (_ ? ' ' : '') + word;
      });
      return simpleCapitalize(str);
    }

  });

  buildInflectionAccessors();

  buildInflectionSet();

  buildCommonPlurals();

  buildCommonHumans();

  /***
   * @module Language
   * @namespace String
   * @description Script detection, full/half-width character as well as
   *              Hiragana-Katakana conversion.
   *
   ***/


  var FULL_WIDTH_OFFSET = 65248;

  var HANKAKU_PUNCTUATION = '｡､｢｣¥¢£';

  var ZENKAKU_PUNCTUATION = '。、「」￥￠￡';

  var HANKAKU_KATAKANA    = 'ｱｲｳｴｵｧｨｩｪｫｶｷｸｹｺｻｼｽｾｿﾀﾁﾂｯﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔｬﾕｭﾖｮﾗﾘﾙﾚﾛﾜｦﾝｰ･';

  var ZENKAKU_KATAKANA    = 'アイウエオァィゥェォカキクケコサシスセソタチツッテトナニヌネノハヒフヘホマミムメモヤャユュヨョラリルレロワヲンー・';

  var ALL_HANKAKU_REG          = /[\u0020-\u00A5]|[\uFF61-\uFF9F][ﾞﾟ]?/g;

  var ALL_ZENKAKU_REG          = /[\u2212\u3000-\u301C\u301A-\u30FC\uFF01-\uFF60\uFFE0-\uFFE6]/g;

  var VOICED_KATAKANA_REG      = /[カキクケコサシスセソタチツテトハヒフヘホ]/;

  var SEMI_VOICED_KATAKANA_REG = /[ハヒフヘホヲ]/;

  var UNICODE_SCRIPTS = [
    { name: 'Arabic',     src: '\u0600-\u06FF' },
    { name: 'Cyrillic',   src: '\u0400-\u04FF' },
    { name: 'Devanagari', src: '\u0900-\u097F' },
    { name: 'Greek',      src: '\u0370-\u03FF' },
    { name: 'Hangul',     src: '\uAC00-\uD7AF\u1100-\u11FF' },
    { name: 'Han Kanji',  src: '\u4E00-\u9FFF\uF900-\uFAFF' },
    { name: 'Hebrew',     src: '\u0590-\u05FF' },
    { name: 'Hiragana',   src: '\u3040-\u309F\u30FB-\u30FC' },
    { name: 'Kana',       src: '\u3040-\u30FF\uFF61-\uFF9F' },
    { name: 'Katakana',   src: '\u30A0-\u30FF\uFF61-\uFF9F' },
    { name: 'Latin',      src: '\u0001-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F' },
    { name: 'Thai',       src: '\u0E00-\u0E7F' }
  ];

  var WIDTH_CONVERSION_RANGES = [
    { type: 'a', start: 65,  end: 90  },
    { type: 'a', start: 97,  end: 122 },
    { type: 'n', start: 48,  end: 57  },
    { type: 'p', start: 33,  end: 47  },
    { type: 'p', start: 58,  end: 64  },
    { type: 'p', start: 91,  end: 96  },
    { type: 'p', start: 123, end: 126 }
  ];

  var widthConversionTable;

  function shiftChar(str, n) {
    return chr(str.charCodeAt(0) + n);
  }

  function zenkaku(str, mode) {
    return convertCharacterWidth(str, mode, ALL_HANKAKU_REG, 'zenkaku');
  }

  function convertCharacterWidth(str, mode, reg, type) {
    var table = widthConversionTable[type];
    mode = (mode || '').replace(/all/, '').replace(/(\w)lphabet|umbers?|atakana|paces?|unctuation/g, '$1');
    return str.replace(reg, function(c) {
      var entry = table[c], to;
      if (entry) {
        if (mode === '' && entry.all) {
          return entry.all;
        } else {
          for (var i = 0, len = mode.length; i < len; i++) {
            to = entry[mode.charAt(i)];
            if (to) {
              return to;
            }
          }
        }
      }
      return c;
    });
  }

  /***
   * @method has[Script]()
   * @returns Boolean
   * @short Returns true if the string contains any characters in that script.
   *
   * @set
   *   hasArabic
   *   hasCyrillic
   *   hasGreek
   *   hasHangul
   *   hasHan
   *   hasKanji
   *   hasHebrew
   *   hasHiragana
   *   hasKana
   *   hasKatakana
   *   hasLatin
   *   hasThai
   *   hasDevanagari
   *
   * @example
   *
   *   'أتكلم'.hasArabic()          -> true
   *   'визит'.hasCyrillic()        -> true
   *   '잘 먹겠습니다!'.hasHangul() -> true
   *   'ミックスです'.hasKatakana() -> true
   *   "l'année".hasLatin()         -> true
   *
   ***
   * @method is[Script]()
   * @returns Boolean
   * @short Returns true if the string contains only characters in that script.
   *        Whitespace is ignored.
   *
   * @set
   *   isArabic
   *   isCyrillic
   *   isGreek
   *   isHangul
   *   isHan
   *   isKanji
   *   isHebrew
   *   isHiragana
   *   isKana
   *   isKatakana
   *   isThai
   *   isDevanagari
   *
   * @example
   *
   *   'أتكلم'.isArabic()          -> true
   *   'визит'.isCyrillic()        -> true
   *   '잘 먹겠습니다'.isHangul()  -> true
   *   'ミックスです'.isKatakana() -> false
   *   "l'année".isLatin()         -> true
   *
   ***/
  function buildUnicodeScripts() {
    defineInstanceSimilar(sugarString, UNICODE_SCRIPTS, function(methods, script) {
      var is = RegExp('^['+ script.src +'\\s]+$');
      var has = RegExp('['+ script.src +']');
      forEach(spaceSplit(script.name), function(name) {
        methods['is' + name] = function(str) {
          return is.test(trim(str));
        };
        methods['has' + name] = function(str) {
          return has.test(trim(str));
        };
      });
    });
  }

  function buildWidthConversion() {
    var hankaku;

    widthConversionTable = {
      'zenkaku': {},
      'hankaku': {}
    };

    function setWidthConversion(type, half, full) {
      setConversionTableEntry('zenkaku', type, half, full);
      setConversionTableEntry('hankaku', type, full, half);
    }

    function setConversionTableEntry(width, type, from, to, all) {
      var obj = widthConversionTable[width][from] || {};
      if (all !== false) {
        obj.all = to;
      }
      obj[type]  = to;
      widthConversionTable[width][from] = obj;
    }

    function setKatakanaConversion() {
      for (var i = 0; i < ZENKAKU_KATAKANA.length; i++) {
        var c = ZENKAKU_KATAKANA.charAt(i);
        hankaku = HANKAKU_KATAKANA.charAt(i);
        setWidthConversion('k', hankaku, c);
        if (c.match(VOICED_KATAKANA_REG)) {
          setWidthConversion('k', hankaku + 'ﾞ', shiftChar(c, 1));
        }
        if (c.match(SEMI_VOICED_KATAKANA_REG)) {
          setWidthConversion('k', hankaku + 'ﾟ', shiftChar(c, 2));
        }
      }
    }

    function setPunctuationConversion() {
      for (var i = 0; i < ZENKAKU_PUNCTUATION.length; i++) {
        setWidthConversion('p', HANKAKU_PUNCTUATION.charAt(i), ZENKAKU_PUNCTUATION.charAt(i));
      }
    }

    forEach(WIDTH_CONVERSION_RANGES, function(r) {
      simpleRepeat(r.end - r.start + 1, function(n) {
        n += r.start;
        setWidthConversion(r.type, chr(n), chr(n + FULL_WIDTH_OFFSET));
      });
    });

    setKatakanaConversion();
    setPunctuationConversion();

    setWidthConversion('s', ' ', '　');
    setWidthConversion('k', 'ｳﾞ', 'ヴ');
    setWidthConversion('k', 'ｦﾞ', 'ヺ');
    setConversionTableEntry('hankaku', 'n', '−', '-');
    setConversionTableEntry('hankaku', 'n', 'ー', '-', false);
    setConversionTableEntry('zenkaku', 'n', '-', '－', false);
  }

  defineInstance(sugarString, {

    /***
     * @method hankaku([mode] = 'all')
     * @returns String
     * @short Converts full-width characters (zenkaku) to half-width (hankaku).
     * @extra [mode] accepts `all`, `alphabet`, `numbers`, `katakana`, `spaces`,
     *        `punctuation`, or any combination of `a`, `n`, `k`, `s`, `p`,
     *        respectively.
     *
     * @example
     *
     *   'タロウ　ＹＡＭＡＤＡです！'.hankaku()           -> 'ﾀﾛｳ YAMADAです!'
     *   'タロウ　ＹＡＭＡＤＡです！'.hankaku('a')        -> 'タロウ　YAMADAです！'
     *   'タロウ　ＹＡＭＡＤＡです！'.hankaku('alphabet') -> 'タロウ　YAMADAです！'
     *   'タロウです！　２５歳です！'.hankaku('katakana') -> 'ﾀﾛｳです！　２５歳です！'
     *   'タロウです！　２５歳です！'.hankaku('kn')       -> 'ﾀﾛｳです！　25歳です！'
     *   'タロウです！　２５歳です！'.hankaku('sp')       -> 'タロウです! ２５歳です!'
     *
     ***/
    'hankaku': function(str, mode) {
      return convertCharacterWidth(str, mode, ALL_ZENKAKU_REG, 'hankaku');
    },

    /***
     * @method zenkaku([mode] = 'all')
     * @returns String
     * @short Converts half-width characters (hankaku) to full-width (zenkaku).
     * @extra [mode] accepts `all`, `alphabet`, `numbers`, `katakana`, `spaces`,
     *        `punctuation`, or any combination of `a`, `n`, `k`, `s`, or `p`,
     *        respectively.
     *
     * @example
     *
     *   'ﾀﾛｳ YAMADAです!'.zenkaku()              -> 'タロウ　ＹＡＭＡＤＡです！'
     *   'ﾀﾛｳ YAMADAです!'.zenkaku('a')           -> 'ﾀﾛｳ ＹＡＭＡＤＡです!'
     *   'ﾀﾛｳ YAMADAです!'.zenkaku('alphabet')    -> 'ﾀﾛｳ ＹＡＭＡＤＡです!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('katakana') -> 'タロウです! 25歳です!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('kn')       -> 'タロウです! ２５歳です!'
     *   'ﾀﾛｳです! 25歳です!'.zenkaku('sp')       -> 'ﾀﾛｳです！　25歳です！'
     *
     ***/
    'zenkaku': function(str, args) {
      return zenkaku(str, args);
    },

    /***
     * @method hiragana([all] = true)
     * @returns String
     * @short Converts katakana into hiragana.
     * @extra If [all] is false, only full-width katakana will be converted.
     *
     * @example
     *
     *   'カタカナ'.hiragana()   -> 'かたかな'
     *   'コンニチハ'.hiragana() -> 'こんにちは'
     *   'ｶﾀｶﾅ'.hiragana()       -> 'かたかな'
     *   'ｶﾀｶﾅ'.hiragana(false)  -> 'ｶﾀｶﾅ'
     *
     ***/
    'hiragana': function(str, all) {
      if (all !== false) {
        str = zenkaku(str, 'k');
      }
      return str.replace(/[\u30A1-\u30F6]/g, function(c) {
        return shiftChar(c, -96);
      });
    },

    /***
     * @method katakana()
     * @returns String
     * @short Converts hiragana into katakana.
     *
     * @example
     *
     *   'かたかな'.katakana()   -> 'カタカナ'
     *   'こんにちは'.katakana() -> 'コンニチハ'
     *
     ***/
    'katakana': function(str) {
      return str.replace(/[\u3041-\u3096]/g, function(c) {
        return shiftChar(c, 96);
      });
    }

  });

  buildUnicodeScripts();

  buildWidthConversion();

}).call(this);