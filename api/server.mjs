var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/double-indexed-kv.js
var require_double_indexed_kv = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/double-indexed-kv.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.DoubleIndexedKV = void 0;
    var DoubleIndexedKV = (
      /** @class */
      (function() {
        function DoubleIndexedKV2() {
          this.keyToValue = /* @__PURE__ */ new Map();
          this.valueToKey = /* @__PURE__ */ new Map();
        }
        DoubleIndexedKV2.prototype.set = function(key, value) {
          this.keyToValue.set(key, value);
          this.valueToKey.set(value, key);
        };
        DoubleIndexedKV2.prototype.getByKey = function(key) {
          return this.keyToValue.get(key);
        };
        DoubleIndexedKV2.prototype.getByValue = function(value) {
          return this.valueToKey.get(value);
        };
        DoubleIndexedKV2.prototype.clear = function() {
          this.keyToValue.clear();
          this.valueToKey.clear();
        };
        return DoubleIndexedKV2;
      })()
    );
    exports.DoubleIndexedKV = DoubleIndexedKV;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/registry.js
var require_registry = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/registry.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.Registry = void 0;
    var double_indexed_kv_1 = require_double_indexed_kv();
    var Registry = (
      /** @class */
      (function() {
        function Registry2(generateIdentifier) {
          this.generateIdentifier = generateIdentifier;
          this.kv = new double_indexed_kv_1.DoubleIndexedKV();
        }
        Registry2.prototype.register = function(value, identifier) {
          if (this.kv.getByValue(value)) {
            return;
          }
          if (!identifier) {
            identifier = this.generateIdentifier(value);
          }
          this.kv.set(identifier, value);
        };
        Registry2.prototype.clear = function() {
          this.kv.clear();
        };
        Registry2.prototype.getIdentifier = function(value) {
          return this.kv.getByValue(value);
        };
        Registry2.prototype.getValue = function(identifier) {
          return this.kv.getByKey(identifier);
        };
        return Registry2;
      })()
    );
    exports.Registry = Registry;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/class-registry.js
var require_class_registry = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/class-registry.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b2) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b3) {
          d2.__proto__ = b3;
        } || function(d2, b3) {
          for (var p in b3) if (Object.prototype.hasOwnProperty.call(b3, p)) d2[p] = b3[p];
        };
        return extendStatics(d, b2);
      };
      return function(d, b2) {
        if (typeof b2 !== "function" && b2 !== null)
          throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
        extendStatics(d, b2);
        function __() {
          this.constructor = d;
        }
        d.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
      };
    })();
    exports.__esModule = true;
    exports.ClassRegistry = void 0;
    var registry_1 = require_registry();
    var ClassRegistry = (
      /** @class */
      (function(_super) {
        __extends(ClassRegistry2, _super);
        function ClassRegistry2() {
          var _this = _super.call(this, function(c) {
            return c.name;
          }) || this;
          _this.classToAllowedProps = /* @__PURE__ */ new Map();
          return _this;
        }
        ClassRegistry2.prototype.register = function(value, options) {
          if (typeof options === "object") {
            if (options.allowProps) {
              this.classToAllowedProps.set(value, options.allowProps);
            }
            _super.prototype.register.call(this, value, options.identifier);
          } else {
            _super.prototype.register.call(this, value, options);
          }
        };
        ClassRegistry2.prototype.getAllowedProps = function(value) {
          return this.classToAllowedProps.get(value);
        };
        return ClassRegistry2;
      })(registry_1.Registry)
    );
    exports.ClassRegistry = ClassRegistry;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/util.js
var require_util = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/util.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    exports.__esModule = true;
    exports.findArr = exports.includes = exports.forEach = exports.find = void 0;
    function valuesOfObj(record) {
      if ("values" in Object) {
        return Object.values(record);
      }
      var values2 = [];
      for (var key in record) {
        if (record.hasOwnProperty(key)) {
          values2.push(record[key]);
        }
      }
      return values2;
    }
    function find(record, predicate) {
      var values2 = valuesOfObj(record);
      if ("find" in values2) {
        return values2.find(predicate);
      }
      var valuesNotNever = values2;
      for (var i = 0; i < valuesNotNever.length; i++) {
        var value = valuesNotNever[i];
        if (predicate(value)) {
          return value;
        }
      }
      return void 0;
    }
    exports.find = find;
    function forEach(record, run) {
      Object.entries(record).forEach(function(_a) {
        var _b = __read(_a, 2), key = _b[0], value = _b[1];
        return run(value, key);
      });
    }
    exports.forEach = forEach;
    function includes(arr, value) {
      return arr.indexOf(value) !== -1;
    }
    exports.includes = includes;
    function findArr(record, predicate) {
      for (var i = 0; i < record.length; i++) {
        var value = record[i];
        if (predicate(value)) {
          return value;
        }
      }
      return void 0;
    }
    exports.findArr = findArr;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/custom-transformer-registry.js
var require_custom_transformer_registry = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/custom-transformer-registry.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.CustomTransformerRegistry = void 0;
    var util_1 = require_util();
    var CustomTransformerRegistry = (
      /** @class */
      (function() {
        function CustomTransformerRegistry2() {
          this.transfomers = {};
        }
        CustomTransformerRegistry2.prototype.register = function(transformer) {
          this.transfomers[transformer.name] = transformer;
        };
        CustomTransformerRegistry2.prototype.findApplicable = function(v) {
          return util_1.find(this.transfomers, function(transformer) {
            return transformer.isApplicable(v);
          });
        };
        CustomTransformerRegistry2.prototype.findByName = function(name) {
          return this.transfomers[name];
        };
        return CustomTransformerRegistry2;
      })()
    );
    exports.CustomTransformerRegistry = CustomTransformerRegistry;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/is.js
var require_is = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/is.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.isURL = exports.isTypedArray = exports.isInfinite = exports.isBigint = exports.isPrimitive = exports.isNaNValue = exports.isError = exports.isDate = exports.isSymbol = exports.isSet = exports.isMap = exports.isRegExp = exports.isBoolean = exports.isNumber = exports.isString = exports.isArray = exports.isEmptyObject = exports.isPlainObject = exports.isNull = exports.isUndefined = void 0;
    var getType = function(payload) {
      return Object.prototype.toString.call(payload).slice(8, -1);
    };
    var isUndefined = function(payload) {
      return typeof payload === "undefined";
    };
    exports.isUndefined = isUndefined;
    var isNull = function(payload) {
      return payload === null;
    };
    exports.isNull = isNull;
    var isPlainObject = function(payload) {
      if (typeof payload !== "object" || payload === null)
        return false;
      if (payload === Object.prototype)
        return false;
      if (Object.getPrototypeOf(payload) === null)
        return true;
      return Object.getPrototypeOf(payload) === Object.prototype;
    };
    exports.isPlainObject = isPlainObject;
    var isEmptyObject = function(payload) {
      return exports.isPlainObject(payload) && Object.keys(payload).length === 0;
    };
    exports.isEmptyObject = isEmptyObject;
    var isArray = function(payload) {
      return Array.isArray(payload);
    };
    exports.isArray = isArray;
    var isString = function(payload) {
      return typeof payload === "string";
    };
    exports.isString = isString;
    var isNumber = function(payload) {
      return typeof payload === "number" && !isNaN(payload);
    };
    exports.isNumber = isNumber;
    var isBoolean = function(payload) {
      return typeof payload === "boolean";
    };
    exports.isBoolean = isBoolean;
    var isRegExp = function(payload) {
      return payload instanceof RegExp;
    };
    exports.isRegExp = isRegExp;
    var isMap = function(payload) {
      return payload instanceof Map;
    };
    exports.isMap = isMap;
    var isSet = function(payload) {
      return payload instanceof Set;
    };
    exports.isSet = isSet;
    var isSymbol = function(payload) {
      return getType(payload) === "Symbol";
    };
    exports.isSymbol = isSymbol;
    var isDate = function(payload) {
      return payload instanceof Date && !isNaN(payload.valueOf());
    };
    exports.isDate = isDate;
    var isError = function(payload) {
      return payload instanceof Error;
    };
    exports.isError = isError;
    var isNaNValue = function(payload) {
      return typeof payload === "number" && isNaN(payload);
    };
    exports.isNaNValue = isNaNValue;
    var isPrimitive = function(payload) {
      return exports.isBoolean(payload) || exports.isNull(payload) || exports.isUndefined(payload) || exports.isNumber(payload) || exports.isString(payload) || exports.isSymbol(payload);
    };
    exports.isPrimitive = isPrimitive;
    var isBigint = function(payload) {
      return typeof payload === "bigint";
    };
    exports.isBigint = isBigint;
    var isInfinite = function(payload) {
      return payload === Infinity || payload === -Infinity;
    };
    exports.isInfinite = isInfinite;
    var isTypedArray = function(payload) {
      return ArrayBuffer.isView(payload) && !(payload instanceof DataView);
    };
    exports.isTypedArray = isTypedArray;
    var isURL = function(payload) {
      return payload instanceof URL;
    };
    exports.isURL = isURL;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/pathstringifier.js
var require_pathstringifier = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/pathstringifier.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.parsePath = exports.stringifyPath = exports.escapeKey = void 0;
    var escapeKey = function(key) {
      return key.replace(/\./g, "\\.");
    };
    exports.escapeKey = escapeKey;
    var stringifyPath = function(path) {
      return path.map(String).map(exports.escapeKey).join(".");
    };
    exports.stringifyPath = stringifyPath;
    var parsePath = function(string) {
      var result = [];
      var segment = "";
      for (var i = 0; i < string.length; i++) {
        var char = string.charAt(i);
        var isEscapedDot = char === "\\" && string.charAt(i + 1) === ".";
        if (isEscapedDot) {
          segment += ".";
          i++;
          continue;
        }
        var isEndOfSegment = char === ".";
        if (isEndOfSegment) {
          result.push(segment);
          segment = "";
          continue;
        }
        segment += char;
      }
      var lastSegment = segment;
      result.push(lastSegment);
      return result;
    };
    exports.parsePath = parsePath;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/transformer.js
var require_transformer = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/transformer.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t2) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t2[p] = s[p];
        }
        return t2;
      };
      return __assign.apply(this, arguments);
    };
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    exports.__esModule = true;
    exports.untransformValue = exports.transformValue = exports.isInstanceOfRegisteredClass = void 0;
    var is_1 = require_is();
    var util_1 = require_util();
    function simpleTransformation(isApplicable, annotation, transform, untransform) {
      return {
        isApplicable,
        annotation,
        transform,
        untransform
      };
    }
    var simpleRules = [
      simpleTransformation(is_1.isUndefined, "undefined", function() {
        return null;
      }, function() {
        return void 0;
      }),
      simpleTransformation(is_1.isBigint, "bigint", function(v) {
        return v.toString();
      }, function(v) {
        if (typeof BigInt !== "undefined") {
          return BigInt(v);
        }
        console.error("Please add a BigInt polyfill.");
        return v;
      }),
      simpleTransformation(is_1.isDate, "Date", function(v) {
        return v.toISOString();
      }, function(v) {
        return new Date(v);
      }),
      simpleTransformation(is_1.isError, "Error", function(v, superJson) {
        var baseError = {
          name: v.name,
          message: v.message
        };
        superJson.allowedErrorProps.forEach(function(prop) {
          baseError[prop] = v[prop];
        });
        return baseError;
      }, function(v, superJson) {
        var e = new Error(v.message);
        e.name = v.name;
        e.stack = v.stack;
        superJson.allowedErrorProps.forEach(function(prop) {
          e[prop] = v[prop];
        });
        return e;
      }),
      simpleTransformation(is_1.isRegExp, "regexp", function(v) {
        return "" + v;
      }, function(regex) {
        var body = regex.slice(1, regex.lastIndexOf("/"));
        var flags = regex.slice(regex.lastIndexOf("/") + 1);
        return new RegExp(body, flags);
      }),
      simpleTransformation(
        is_1.isSet,
        "set",
        // (sets only exist in es6+)
        // eslint-disable-next-line es5/no-es6-methods
        function(v) {
          return __spreadArray([], __read(v.values()));
        },
        function(v) {
          return new Set(v);
        }
      ),
      simpleTransformation(is_1.isMap, "map", function(v) {
        return __spreadArray([], __read(v.entries()));
      }, function(v) {
        return new Map(v);
      }),
      simpleTransformation(function(v) {
        return is_1.isNaNValue(v) || is_1.isInfinite(v);
      }, "number", function(v) {
        if (is_1.isNaNValue(v)) {
          return "NaN";
        }
        if (v > 0) {
          return "Infinity";
        } else {
          return "-Infinity";
        }
      }, Number),
      simpleTransformation(function(v) {
        return v === 0 && 1 / v === -Infinity;
      }, "number", function() {
        return "-0";
      }, Number),
      simpleTransformation(is_1.isURL, "URL", function(v) {
        return v.toString();
      }, function(v) {
        return new URL(v);
      })
    ];
    function compositeTransformation(isApplicable, annotation, transform, untransform) {
      return {
        isApplicable,
        annotation,
        transform,
        untransform
      };
    }
    var symbolRule = compositeTransformation(function(s, superJson) {
      if (is_1.isSymbol(s)) {
        var isRegistered = !!superJson.symbolRegistry.getIdentifier(s);
        return isRegistered;
      }
      return false;
    }, function(s, superJson) {
      var identifier = superJson.symbolRegistry.getIdentifier(s);
      return ["symbol", identifier];
    }, function(v) {
      return v.description;
    }, function(_, a, superJson) {
      var value = superJson.symbolRegistry.getValue(a[1]);
      if (!value) {
        throw new Error("Trying to deserialize unknown symbol");
      }
      return value;
    });
    var constructorToName = [
      Int8Array,
      Uint8Array,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      Float32Array,
      Float64Array,
      Uint8ClampedArray
    ].reduce(function(obj, ctor) {
      obj[ctor.name] = ctor;
      return obj;
    }, {});
    var typedArrayRule = compositeTransformation(is_1.isTypedArray, function(v) {
      return ["typed-array", v.constructor.name];
    }, function(v) {
      return __spreadArray([], __read(v));
    }, function(v, a) {
      var ctor = constructorToName[a[1]];
      if (!ctor) {
        throw new Error("Trying to deserialize unknown typed array");
      }
      return new ctor(v);
    });
    function isInstanceOfRegisteredClass(potentialClass, superJson) {
      if (potentialClass === null || potentialClass === void 0 ? void 0 : potentialClass.constructor) {
        var isRegistered = !!superJson.classRegistry.getIdentifier(potentialClass.constructor);
        return isRegistered;
      }
      return false;
    }
    exports.isInstanceOfRegisteredClass = isInstanceOfRegisteredClass;
    var classRule = compositeTransformation(isInstanceOfRegisteredClass, function(clazz, superJson) {
      var identifier = superJson.classRegistry.getIdentifier(clazz.constructor);
      return ["class", identifier];
    }, function(clazz, superJson) {
      var allowedProps = superJson.classRegistry.getAllowedProps(clazz.constructor);
      if (!allowedProps) {
        return __assign({}, clazz);
      }
      var result = {};
      allowedProps.forEach(function(prop) {
        result[prop] = clazz[prop];
      });
      return result;
    }, function(v, a, superJson) {
      var clazz = superJson.classRegistry.getValue(a[1]);
      if (!clazz) {
        throw new Error("Trying to deserialize unknown class - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564");
      }
      return Object.assign(Object.create(clazz.prototype), v);
    });
    var customRule = compositeTransformation(function(value, superJson) {
      return !!superJson.customTransformerRegistry.findApplicable(value);
    }, function(value, superJson) {
      var transformer = superJson.customTransformerRegistry.findApplicable(value);
      return ["custom", transformer.name];
    }, function(value, superJson) {
      var transformer = superJson.customTransformerRegistry.findApplicable(value);
      return transformer.serialize(value);
    }, function(v, a, superJson) {
      var transformer = superJson.customTransformerRegistry.findByName(a[1]);
      if (!transformer) {
        throw new Error("Trying to deserialize unknown custom value");
      }
      return transformer.deserialize(v);
    });
    var compositeRules = [classRule, symbolRule, customRule, typedArrayRule];
    var transformValue = function(value, superJson) {
      var applicableCompositeRule = util_1.findArr(compositeRules, function(rule) {
        return rule.isApplicable(value, superJson);
      });
      if (applicableCompositeRule) {
        return {
          value: applicableCompositeRule.transform(value, superJson),
          type: applicableCompositeRule.annotation(value, superJson)
        };
      }
      var applicableSimpleRule = util_1.findArr(simpleRules, function(rule) {
        return rule.isApplicable(value, superJson);
      });
      if (applicableSimpleRule) {
        return {
          value: applicableSimpleRule.transform(value, superJson),
          type: applicableSimpleRule.annotation
        };
      }
      return void 0;
    };
    exports.transformValue = transformValue;
    var simpleRulesByAnnotation = {};
    simpleRules.forEach(function(rule) {
      simpleRulesByAnnotation[rule.annotation] = rule;
    });
    var untransformValue = function(json, type, superJson) {
      if (is_1.isArray(type)) {
        switch (type[0]) {
          case "symbol":
            return symbolRule.untransform(json, type, superJson);
          case "class":
            return classRule.untransform(json, type, superJson);
          case "custom":
            return customRule.untransform(json, type, superJson);
          case "typed-array":
            return typedArrayRule.untransform(json, type, superJson);
          default:
            throw new Error("Unknown transformation: " + type);
        }
      } else {
        var transformation = simpleRulesByAnnotation[type];
        if (!transformation) {
          throw new Error("Unknown transformation: " + type);
        }
        return transformation.untransform(json, superJson);
      }
    };
    exports.untransformValue = untransformValue;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/accessDeep.js
var require_accessDeep = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/accessDeep.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.setDeep = exports.getDeep = void 0;
    var is_1 = require_is();
    var util_1 = require_util();
    var getNthKey = function(value, n) {
      var keys = value.keys();
      while (n > 0) {
        keys.next();
        n--;
      }
      return keys.next().value;
    };
    function validatePath(path) {
      if (util_1.includes(path, "__proto__")) {
        throw new Error("__proto__ is not allowed as a property");
      }
      if (util_1.includes(path, "prototype")) {
        throw new Error("prototype is not allowed as a property");
      }
      if (util_1.includes(path, "constructor")) {
        throw new Error("constructor is not allowed as a property");
      }
    }
    var getDeep = function(object, path) {
      validatePath(path);
      for (var i = 0; i < path.length; i++) {
        var key = path[i];
        if (is_1.isSet(object)) {
          object = getNthKey(object, +key);
        } else if (is_1.isMap(object)) {
          var row = +key;
          var type = +path[++i] === 0 ? "key" : "value";
          var keyOfRow = getNthKey(object, row);
          switch (type) {
            case "key":
              object = keyOfRow;
              break;
            case "value":
              object = object.get(keyOfRow);
              break;
          }
        } else {
          object = object[key];
        }
      }
      return object;
    };
    exports.getDeep = getDeep;
    var setDeep = function(object, path, mapper) {
      validatePath(path);
      if (path.length === 0) {
        return mapper(object);
      }
      var parent = object;
      for (var i = 0; i < path.length - 1; i++) {
        var key = path[i];
        if (is_1.isArray(parent)) {
          var index = +key;
          parent = parent[index];
        } else if (is_1.isPlainObject(parent)) {
          parent = parent[key];
        } else if (is_1.isSet(parent)) {
          var row = +key;
          parent = getNthKey(parent, row);
        } else if (is_1.isMap(parent)) {
          var isEnd = i === path.length - 2;
          if (isEnd) {
            break;
          }
          var row = +key;
          var type = +path[++i] === 0 ? "key" : "value";
          var keyOfRow = getNthKey(parent, row);
          switch (type) {
            case "key":
              parent = keyOfRow;
              break;
            case "value":
              parent = parent.get(keyOfRow);
              break;
          }
        }
      }
      var lastKey = path[path.length - 1];
      if (is_1.isArray(parent)) {
        parent[+lastKey] = mapper(parent[+lastKey]);
      } else if (is_1.isPlainObject(parent)) {
        parent[lastKey] = mapper(parent[lastKey]);
      }
      if (is_1.isSet(parent)) {
        var oldValue = getNthKey(parent, +lastKey);
        var newValue = mapper(oldValue);
        if (oldValue !== newValue) {
          parent["delete"](oldValue);
          parent.add(newValue);
        }
      }
      if (is_1.isMap(parent)) {
        var row = +path[path.length - 2];
        var keyToRow = getNthKey(parent, row);
        var type = +lastKey === 0 ? "key" : "value";
        switch (type) {
          case "key": {
            var newKey = mapper(keyToRow);
            parent.set(newKey, parent.get(keyToRow));
            if (newKey !== keyToRow) {
              parent["delete"](keyToRow);
            }
            break;
          }
          case "value": {
            parent.set(keyToRow, mapper(parent.get(keyToRow)));
            break;
          }
        }
      }
      return object;
    };
    exports.setDeep = setDeep;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/plainer.js
var require_plainer = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/plainer.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    exports.__esModule = true;
    exports.walker = exports.generateReferentialEqualityAnnotations = exports.applyReferentialEqualityAnnotations = exports.applyValueAnnotations = void 0;
    var is_1 = require_is();
    var pathstringifier_1 = require_pathstringifier();
    var transformer_1 = require_transformer();
    var util_1 = require_util();
    var pathstringifier_2 = require_pathstringifier();
    var accessDeep_1 = require_accessDeep();
    function traverse(tree, walker2, origin) {
      if (origin === void 0) {
        origin = [];
      }
      if (!tree) {
        return;
      }
      if (!is_1.isArray(tree)) {
        util_1.forEach(tree, function(subtree, key) {
          return traverse(subtree, walker2, __spreadArray(__spreadArray([], __read(origin)), __read(pathstringifier_2.parsePath(key))));
        });
        return;
      }
      var _a = __read(tree, 2), nodeValue = _a[0], children = _a[1];
      if (children) {
        util_1.forEach(children, function(child, key) {
          traverse(child, walker2, __spreadArray(__spreadArray([], __read(origin)), __read(pathstringifier_2.parsePath(key))));
        });
      }
      walker2(nodeValue, origin);
    }
    function applyValueAnnotations(plain, annotations, superJson) {
      traverse(annotations, function(type, path) {
        plain = accessDeep_1.setDeep(plain, path, function(v) {
          return transformer_1.untransformValue(v, type, superJson);
        });
      });
      return plain;
    }
    exports.applyValueAnnotations = applyValueAnnotations;
    function applyReferentialEqualityAnnotations(plain, annotations) {
      function apply(identicalPaths, path) {
        var object = accessDeep_1.getDeep(plain, pathstringifier_2.parsePath(path));
        identicalPaths.map(pathstringifier_2.parsePath).forEach(function(identicalObjectPath) {
          plain = accessDeep_1.setDeep(plain, identicalObjectPath, function() {
            return object;
          });
        });
      }
      if (is_1.isArray(annotations)) {
        var _a = __read(annotations, 2), root = _a[0], other = _a[1];
        root.forEach(function(identicalPath) {
          plain = accessDeep_1.setDeep(plain, pathstringifier_2.parsePath(identicalPath), function() {
            return plain;
          });
        });
        if (other) {
          util_1.forEach(other, apply);
        }
      } else {
        util_1.forEach(annotations, apply);
      }
      return plain;
    }
    exports.applyReferentialEqualityAnnotations = applyReferentialEqualityAnnotations;
    var isDeep = function(object, superJson) {
      return is_1.isPlainObject(object) || is_1.isArray(object) || is_1.isMap(object) || is_1.isSet(object) || transformer_1.isInstanceOfRegisteredClass(object, superJson);
    };
    function addIdentity(object, path, identities) {
      var existingSet = identities.get(object);
      if (existingSet) {
        existingSet.push(path);
      } else {
        identities.set(object, [path]);
      }
    }
    function generateReferentialEqualityAnnotations(identitites, dedupe) {
      var result = {};
      var rootEqualityPaths = void 0;
      identitites.forEach(function(paths) {
        if (paths.length <= 1) {
          return;
        }
        if (!dedupe) {
          paths = paths.map(function(path) {
            return path.map(String);
          }).sort(function(a, b2) {
            return a.length - b2.length;
          });
        }
        var _a = __read(paths), representativePath = _a[0], identicalPaths = _a.slice(1);
        if (representativePath.length === 0) {
          rootEqualityPaths = identicalPaths.map(pathstringifier_1.stringifyPath);
        } else {
          result[pathstringifier_1.stringifyPath(representativePath)] = identicalPaths.map(pathstringifier_1.stringifyPath);
        }
      });
      if (rootEqualityPaths) {
        if (is_1.isEmptyObject(result)) {
          return [rootEqualityPaths];
        } else {
          return [rootEqualityPaths, result];
        }
      } else {
        return is_1.isEmptyObject(result) ? void 0 : result;
      }
    }
    exports.generateReferentialEqualityAnnotations = generateReferentialEqualityAnnotations;
    var walker = function(object, identities, superJson, dedupe, path, objectsInThisPath, seenObjects) {
      var _a;
      if (path === void 0) {
        path = [];
      }
      if (objectsInThisPath === void 0) {
        objectsInThisPath = [];
      }
      if (seenObjects === void 0) {
        seenObjects = /* @__PURE__ */ new Map();
      }
      var primitive = is_1.isPrimitive(object);
      if (!primitive) {
        addIdentity(object, path, identities);
        var seen = seenObjects.get(object);
        if (seen) {
          return dedupe ? {
            transformedValue: null
          } : seen;
        }
      }
      if (!isDeep(object, superJson)) {
        var transformed_1 = transformer_1.transformValue(object, superJson);
        var result_1 = transformed_1 ? {
          transformedValue: transformed_1.value,
          annotations: [transformed_1.type]
        } : {
          transformedValue: object
        };
        if (!primitive) {
          seenObjects.set(object, result_1);
        }
        return result_1;
      }
      if (util_1.includes(objectsInThisPath, object)) {
        return {
          transformedValue: null
        };
      }
      var transformationResult = transformer_1.transformValue(object, superJson);
      var transformed = (_a = transformationResult === null || transformationResult === void 0 ? void 0 : transformationResult.value) !== null && _a !== void 0 ? _a : object;
      var transformedValue = is_1.isArray(transformed) ? [] : {};
      var innerAnnotations = {};
      util_1.forEach(transformed, function(value, index) {
        var recursiveResult = exports.walker(value, identities, superJson, dedupe, __spreadArray(__spreadArray([], __read(path)), [index]), __spreadArray(__spreadArray([], __read(objectsInThisPath)), [object]), seenObjects);
        transformedValue[index] = recursiveResult.transformedValue;
        if (is_1.isArray(recursiveResult.annotations)) {
          innerAnnotations[index] = recursiveResult.annotations;
        } else if (is_1.isPlainObject(recursiveResult.annotations)) {
          util_1.forEach(recursiveResult.annotations, function(tree, key) {
            innerAnnotations[pathstringifier_1.escapeKey(index) + "." + key] = tree;
          });
        }
      });
      var result = is_1.isEmptyObject(innerAnnotations) ? {
        transformedValue,
        annotations: !!transformationResult ? [transformationResult.type] : void 0
      } : {
        transformedValue,
        annotations: !!transformationResult ? [transformationResult.type, innerAnnotations] : innerAnnotations
      };
      if (!primitive) {
        seenObjects.set(object, result);
      }
      return result;
    };
    exports.walker = walker;
  }
});

// node_modules/.pnpm/is-what@4.1.16/node_modules/is-what/dist/cjs/index.cjs
var require_cjs = __commonJS({
  "node_modules/.pnpm/is-what@4.1.16/node_modules/is-what/dist/cjs/index.cjs"(exports) {
    "use strict";
    function getType(payload) {
      return Object.prototype.toString.call(payload).slice(8, -1);
    }
    function isAnyObject(payload) {
      return getType(payload) === "Object";
    }
    function isArray(payload) {
      return getType(payload) === "Array";
    }
    function isBlob(payload) {
      return getType(payload) === "Blob";
    }
    function isBoolean(payload) {
      return getType(payload) === "Boolean";
    }
    function isDate(payload) {
      return getType(payload) === "Date" && !isNaN(payload);
    }
    function isEmptyArray(payload) {
      return isArray(payload) && payload.length === 0;
    }
    function isPlainObject(payload) {
      if (getType(payload) !== "Object")
        return false;
      const prototype = Object.getPrototypeOf(payload);
      return !!prototype && prototype.constructor === Object && prototype === Object.prototype;
    }
    function isEmptyObject(payload) {
      return isPlainObject(payload) && Object.keys(payload).length === 0;
    }
    function isEmptyString(payload) {
      return payload === "";
    }
    function isError(payload) {
      return getType(payload) === "Error" || payload instanceof Error;
    }
    function isFile(payload) {
      return getType(payload) === "File";
    }
    function isFullArray(payload) {
      return isArray(payload) && payload.length > 0;
    }
    function isFullObject(payload) {
      return isPlainObject(payload) && Object.keys(payload).length > 0;
    }
    function isString(payload) {
      return getType(payload) === "String";
    }
    function isFullString(payload) {
      return isString(payload) && payload !== "";
    }
    function isFunction2(payload) {
      return typeof payload === "function";
    }
    function isType(payload, type) {
      if (!(type instanceof Function)) {
        throw new TypeError("Type must be a function");
      }
      if (!Object.prototype.hasOwnProperty.call(type, "prototype")) {
        throw new TypeError("Type is not a class");
      }
      const name = type.name;
      return getType(payload) === name || Boolean(payload && payload.constructor === type);
    }
    function isInstanceOf(value, classOrClassName) {
      if (typeof classOrClassName === "function") {
        for (let p = value; p; p = Object.getPrototypeOf(p)) {
          if (isType(p, classOrClassName)) {
            return true;
          }
        }
        return false;
      } else {
        for (let p = value; p; p = Object.getPrototypeOf(p)) {
          if (getType(p) === classOrClassName) {
            return true;
          }
        }
        return false;
      }
    }
    function isMap(payload) {
      return getType(payload) === "Map";
    }
    function isNaNValue(payload) {
      return getType(payload) === "Number" && isNaN(payload);
    }
    function isNumber(payload) {
      return getType(payload) === "Number" && !isNaN(payload);
    }
    function isNegativeNumber(payload) {
      return isNumber(payload) && payload < 0;
    }
    function isNull(payload) {
      return getType(payload) === "Null";
    }
    function isOneOf(a, b2, c, d, e) {
      return (value) => a(value) || b2(value) || !!c && c(value) || !!d && d(value) || !!e && e(value);
    }
    function isUndefined(payload) {
      return getType(payload) === "Undefined";
    }
    var isNullOrUndefined = isOneOf(isNull, isUndefined);
    function isObject2(payload) {
      return isPlainObject(payload);
    }
    function isObjectLike(payload) {
      return isAnyObject(payload);
    }
    function isPositiveNumber(payload) {
      return isNumber(payload) && payload > 0;
    }
    function isSymbol(payload) {
      return getType(payload) === "Symbol";
    }
    function isPrimitive(payload) {
      return isBoolean(payload) || isNull(payload) || isUndefined(payload) || isNumber(payload) || isString(payload) || isSymbol(payload);
    }
    function isPromise(payload) {
      return getType(payload) === "Promise";
    }
    function isRegExp(payload) {
      return getType(payload) === "RegExp";
    }
    function isSet(payload) {
      return getType(payload) === "Set";
    }
    function isWeakMap(payload) {
      return getType(payload) === "WeakMap";
    }
    function isWeakSet(payload) {
      return getType(payload) === "WeakSet";
    }
    exports.getType = getType;
    exports.isAnyObject = isAnyObject;
    exports.isArray = isArray;
    exports.isBlob = isBlob;
    exports.isBoolean = isBoolean;
    exports.isDate = isDate;
    exports.isEmptyArray = isEmptyArray;
    exports.isEmptyObject = isEmptyObject;
    exports.isEmptyString = isEmptyString;
    exports.isError = isError;
    exports.isFile = isFile;
    exports.isFullArray = isFullArray;
    exports.isFullObject = isFullObject;
    exports.isFullString = isFullString;
    exports.isFunction = isFunction2;
    exports.isInstanceOf = isInstanceOf;
    exports.isMap = isMap;
    exports.isNaNValue = isNaNValue;
    exports.isNegativeNumber = isNegativeNumber;
    exports.isNull = isNull;
    exports.isNullOrUndefined = isNullOrUndefined;
    exports.isNumber = isNumber;
    exports.isObject = isObject2;
    exports.isObjectLike = isObjectLike;
    exports.isOneOf = isOneOf;
    exports.isPlainObject = isPlainObject;
    exports.isPositiveNumber = isPositiveNumber;
    exports.isPrimitive = isPrimitive;
    exports.isPromise = isPromise;
    exports.isRegExp = isRegExp;
    exports.isSet = isSet;
    exports.isString = isString;
    exports.isSymbol = isSymbol;
    exports.isType = isType;
    exports.isUndefined = isUndefined;
    exports.isWeakMap = isWeakMap;
    exports.isWeakSet = isWeakSet;
  }
});

// node_modules/.pnpm/copy-anything@3.0.5/node_modules/copy-anything/dist/cjs/index.cjs
var require_cjs2 = __commonJS({
  "node_modules/.pnpm/copy-anything@3.0.5/node_modules/copy-anything/dist/cjs/index.cjs"(exports) {
    "use strict";
    var isWhat = require_cjs();
    function assignProp(carry, key, newVal, originalObject, includeNonenumerable) {
      const propType = {}.propertyIsEnumerable.call(originalObject, key) ? "enumerable" : "nonenumerable";
      if (propType === "enumerable")
        carry[key] = newVal;
      if (includeNonenumerable && propType === "nonenumerable") {
        Object.defineProperty(carry, key, {
          value: newVal,
          enumerable: false,
          writable: true,
          configurable: true
        });
      }
    }
    function copy(target, options = {}) {
      if (isWhat.isArray(target)) {
        return target.map((item) => copy(item, options));
      }
      if (!isWhat.isPlainObject(target)) {
        return target;
      }
      const props = Object.getOwnPropertyNames(target);
      const symbols = Object.getOwnPropertySymbols(target);
      return [...props, ...symbols].reduce((carry, key) => {
        if (isWhat.isArray(options.props) && !options.props.includes(key)) {
          return carry;
        }
        const val = target[key];
        const newVal = copy(val, options);
        assignProp(carry, key, newVal, target, options.nonenumerable);
        return carry;
      }, {});
    }
    exports.copy = copy;
  }
});

// node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/superjson@1.13.3/node_modules/superjson/dist/index.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t2) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t2[p] = s[p];
        }
        return t2;
      };
      return __assign.apply(this, arguments);
    };
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    exports.__esModule = true;
    exports.allowErrorProps = exports.registerSymbol = exports.registerCustom = exports.registerClass = exports.parse = exports.stringify = exports.deserialize = exports.serialize = exports.SuperJSON = void 0;
    var class_registry_1 = require_class_registry();
    var registry_1 = require_registry();
    var custom_transformer_registry_1 = require_custom_transformer_registry();
    var plainer_1 = require_plainer();
    var copy_anything_1 = require_cjs2();
    var SuperJSON = (
      /** @class */
      (function() {
        function SuperJSON2(_a) {
          var _b = _a === void 0 ? {} : _a, _c = _b.dedupe, dedupe = _c === void 0 ? false : _c;
          this.classRegistry = new class_registry_1.ClassRegistry();
          this.symbolRegistry = new registry_1.Registry(function(s) {
            var _a2;
            return (_a2 = s.description) !== null && _a2 !== void 0 ? _a2 : "";
          });
          this.customTransformerRegistry = new custom_transformer_registry_1.CustomTransformerRegistry();
          this.allowedErrorProps = [];
          this.dedupe = dedupe;
        }
        SuperJSON2.prototype.serialize = function(object) {
          var identities = /* @__PURE__ */ new Map();
          var output = plainer_1.walker(object, identities, this, this.dedupe);
          var res = {
            json: output.transformedValue
          };
          if (output.annotations) {
            res.meta = __assign(__assign({}, res.meta), { values: output.annotations });
          }
          var equalityAnnotations = plainer_1.generateReferentialEqualityAnnotations(identities, this.dedupe);
          if (equalityAnnotations) {
            res.meta = __assign(__assign({}, res.meta), { referentialEqualities: equalityAnnotations });
          }
          return res;
        };
        SuperJSON2.prototype.deserialize = function(payload) {
          var json = payload.json, meta = payload.meta;
          var result = copy_anything_1.copy(json);
          if (meta === null || meta === void 0 ? void 0 : meta.values) {
            result = plainer_1.applyValueAnnotations(result, meta.values, this);
          }
          if (meta === null || meta === void 0 ? void 0 : meta.referentialEqualities) {
            result = plainer_1.applyReferentialEqualityAnnotations(result, meta.referentialEqualities);
          }
          return result;
        };
        SuperJSON2.prototype.stringify = function(object) {
          return JSON.stringify(this.serialize(object));
        };
        SuperJSON2.prototype.parse = function(string) {
          return this.deserialize(JSON.parse(string));
        };
        SuperJSON2.prototype.registerClass = function(v, options) {
          this.classRegistry.register(v, options);
        };
        SuperJSON2.prototype.registerSymbol = function(v, identifier) {
          this.symbolRegistry.register(v, identifier);
        };
        SuperJSON2.prototype.registerCustom = function(transformer, name) {
          this.customTransformerRegistry.register(__assign({ name }, transformer));
        };
        SuperJSON2.prototype.allowErrorProps = function() {
          var _a;
          var props = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            props[_i] = arguments[_i];
          }
          (_a = this.allowedErrorProps).push.apply(_a, __spreadArray([], __read(props)));
        };
        SuperJSON2.defaultInstance = new SuperJSON2();
        SuperJSON2.serialize = SuperJSON2.defaultInstance.serialize.bind(SuperJSON2.defaultInstance);
        SuperJSON2.deserialize = SuperJSON2.defaultInstance.deserialize.bind(SuperJSON2.defaultInstance);
        SuperJSON2.stringify = SuperJSON2.defaultInstance.stringify.bind(SuperJSON2.defaultInstance);
        SuperJSON2.parse = SuperJSON2.defaultInstance.parse.bind(SuperJSON2.defaultInstance);
        SuperJSON2.registerClass = SuperJSON2.defaultInstance.registerClass.bind(SuperJSON2.defaultInstance);
        SuperJSON2.registerSymbol = SuperJSON2.defaultInstance.registerSymbol.bind(SuperJSON2.defaultInstance);
        SuperJSON2.registerCustom = SuperJSON2.defaultInstance.registerCustom.bind(SuperJSON2.defaultInstance);
        SuperJSON2.allowErrorProps = SuperJSON2.defaultInstance.allowErrorProps.bind(SuperJSON2.defaultInstance);
        return SuperJSON2;
      })()
    );
    exports.SuperJSON = SuperJSON;
    exports["default"] = SuperJSON;
    exports.serialize = SuperJSON.serialize;
    exports.deserialize = SuperJSON.deserialize;
    exports.stringify = SuperJSON.stringify;
    exports.parse = SuperJSON.parse;
    exports.registerClass = SuperJSON.registerClass;
    exports.registerCustom = SuperJSON.registerCustom;
    exports.registerSymbol = SuperJSON.registerSymbol;
    exports.allowErrorProps = SuperJSON.allowErrorProps;
  }
});

// server/routers.ts
import { z as z2 } from "zod";

// node_modules/.pnpm/@trpc+server@11.6.0_typescript@5.9.3/node_modules/@trpc/server/dist/utils-CLZnJdb_.mjs
var TRPC_ERROR_CODES_BY_KEY = {
  PARSE_ERROR: -32700,
  BAD_REQUEST: -32600,
  INTERNAL_SERVER_ERROR: -32603,
  NOT_IMPLEMENTED: -32603,
  BAD_GATEWAY: -32603,
  SERVICE_UNAVAILABLE: -32603,
  GATEWAY_TIMEOUT: -32603,
  UNAUTHORIZED: -32001,
  PAYMENT_REQUIRED: -32002,
  FORBIDDEN: -32003,
  NOT_FOUND: -32004,
  METHOD_NOT_SUPPORTED: -32005,
  TIMEOUT: -32008,
  CONFLICT: -32009,
  PRECONDITION_FAILED: -32012,
  PAYLOAD_TOO_LARGE: -32013,
  UNSUPPORTED_MEDIA_TYPE: -32015,
  UNPROCESSABLE_CONTENT: -32022,
  PRECONDITION_REQUIRED: -32028,
  TOO_MANY_REQUESTS: -32029,
  CLIENT_CLOSED_REQUEST: -32099
};
var retryableRpcCodes = [
  TRPC_ERROR_CODES_BY_KEY.BAD_GATEWAY,
  TRPC_ERROR_CODES_BY_KEY.SERVICE_UNAVAILABLE,
  TRPC_ERROR_CODES_BY_KEY.GATEWAY_TIMEOUT,
  TRPC_ERROR_CODES_BY_KEY.INTERNAL_SERVER_ERROR
];
function mergeWithoutOverrides(obj1, ...objs) {
  const newObj = Object.assign(/* @__PURE__ */ Object.create(null), obj1);
  for (const overrides of objs) for (const key in overrides) {
    if (key in newObj && newObj[key] !== overrides[key]) throw new Error(`Duplicate key ${key}`);
    newObj[key] = overrides[key];
  }
  return newObj;
}
function isObject(value) {
  return !!value && !Array.isArray(value) && typeof value === "object";
}
function isFunction(fn) {
  return typeof fn === "function";
}
function omitPrototype(obj) {
  return Object.assign(/* @__PURE__ */ Object.create(null), obj);
}

// node_modules/.pnpm/@trpc+server@11.6.0_typescript@5.9.3/node_modules/@trpc/server/dist/getErrorShape-BH60iMC2.mjs
var __create2 = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __getProtoOf2 = Object.getPrototypeOf;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __commonJS2 = (cb, mod) => function() {
  return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps2 = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames2(from), i = 0, n = keys.length, key; i < n; i++) {
    key = keys[i];
    if (!__hasOwnProp2.call(to, key) && key !== except) __defProp2(to, key, {
      get: ((k) => from[k]).bind(null, key),
      enumerable: !(desc2 = __getOwnPropDesc2(from, key)) || desc2.enumerable
    });
  }
  return to;
};
var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", {
  value: mod,
  enumerable: true
}) : target, mod));
var noop = () => {
};
var freezeIfAvailable = (obj) => {
  if (Object.freeze) Object.freeze(obj);
};
function createInnerProxy(callback, path, memo) {
  var _memo$cacheKey;
  const cacheKey = path.join(".");
  (_memo$cacheKey = memo[cacheKey]) !== null && _memo$cacheKey !== void 0 || (memo[cacheKey] = new Proxy(noop, {
    get(_obj, key) {
      if (typeof key !== "string" || key === "then") return void 0;
      return createInnerProxy(callback, [...path, key], memo);
    },
    apply(_1, _2, args) {
      const lastOfPath = path[path.length - 1];
      let opts = {
        args,
        path
      };
      if (lastOfPath === "call") opts = {
        args: args.length >= 2 ? [args[1]] : [],
        path: path.slice(0, -1)
      };
      else if (lastOfPath === "apply") opts = {
        args: args.length >= 2 ? args[1] : [],
        path: path.slice(0, -1)
      };
      freezeIfAvailable(opts.args);
      freezeIfAvailable(opts.path);
      return callback(opts);
    }
  }));
  return memo[cacheKey];
}
var createRecursiveProxy = (callback) => createInnerProxy(callback, [], /* @__PURE__ */ Object.create(null));
var require_typeof = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/typeof.js"(exports, module) {
  function _typeof$2(o) {
    "@babel/helpers - typeof";
    return module.exports = _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof$2(o);
  }
  module.exports = _typeof$2, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var require_toPrimitive = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/toPrimitive.js"(exports, module) {
  var _typeof$1 = require_typeof()["default"];
  function toPrimitive$1(t2, r) {
    if ("object" != _typeof$1(t2) || !t2) return t2;
    var e = t2[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t2, r || "default");
      if ("object" != _typeof$1(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t2);
  }
  module.exports = toPrimitive$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var require_toPropertyKey = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/toPropertyKey.js"(exports, module) {
  var _typeof = require_typeof()["default"];
  var toPrimitive = require_toPrimitive();
  function toPropertyKey$1(t2) {
    var i = toPrimitive(t2, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  module.exports = toPropertyKey$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var require_defineProperty = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/defineProperty.js"(exports, module) {
  var toPropertyKey = require_toPropertyKey();
  function _defineProperty(e, r, t2) {
    return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t2,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t2, e;
  }
  module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var require_objectSpread2 = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectSpread2.js"(exports, module) {
  var defineProperty = require_defineProperty();
  function ownKeys(e, r) {
    var t2 = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t2.push.apply(t2, o);
    }
    return t2;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t2 = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t2), true).forEach(function(r$1) {
        defineProperty(e, r$1, t2[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys(Object(t2)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t2, r$1));
      });
    }
    return e;
  }
  module.exports = _objectSpread2, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var import_objectSpread2 = __toESM2(require_objectSpread2(), 1);

// node_modules/.pnpm/@trpc+server@11.6.0_typescript@5.9.3/node_modules/@trpc/server/dist/tracked-Blz8XOf1.mjs
var defaultFormatter = ({ shape }) => {
  return shape;
};
var import_defineProperty = __toESM2(require_defineProperty(), 1);
var UnknownCauseError = class extends Error {
};
function getCauseFromUnknown(cause) {
  if (cause instanceof Error) return cause;
  const type = typeof cause;
  if (type === "undefined" || type === "function" || cause === null) return void 0;
  if (type !== "object") return new Error(String(cause));
  if (isObject(cause)) return Object.assign(new UnknownCauseError(), cause);
  return void 0;
}
function getTRPCErrorFromUnknown(cause) {
  if (cause instanceof TRPCError) return cause;
  if (cause instanceof Error && cause.name === "TRPCError") return cause;
  const trpcError = new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    cause
  });
  if (cause instanceof Error && cause.stack) trpcError.stack = cause.stack;
  return trpcError;
}
var TRPCError = class extends Error {
  constructor(opts) {
    var _ref, _opts$message, _this$cause;
    const cause = getCauseFromUnknown(opts.cause);
    const message = (_ref = (_opts$message = opts.message) !== null && _opts$message !== void 0 ? _opts$message : cause === null || cause === void 0 ? void 0 : cause.message) !== null && _ref !== void 0 ? _ref : opts.code;
    super(message, { cause });
    (0, import_defineProperty.default)(this, "cause", void 0);
    (0, import_defineProperty.default)(this, "code", void 0);
    this.code = opts.code;
    this.name = "TRPCError";
    (_this$cause = this.cause) !== null && _this$cause !== void 0 || (this.cause = cause);
  }
};
var import_objectSpread2$1 = __toESM2(require_objectSpread2(), 1);
function getDataTransformer(transformer) {
  if ("input" in transformer) return transformer;
  return {
    input: transformer,
    output: transformer
  };
}
var defaultTransformer = {
  input: {
    serialize: (obj) => obj,
    deserialize: (obj) => obj
  },
  output: {
    serialize: (obj) => obj,
    deserialize: (obj) => obj
  }
};
var import_objectSpread22 = __toESM2(require_objectSpread2(), 1);
var lazyMarker = "lazyMarker";
function once(fn) {
  const uncalled = Symbol();
  let result = uncalled;
  return () => {
    if (result === uncalled) result = fn();
    return result;
  };
}
function isLazy(input) {
  return typeof input === "function" && lazyMarker in input;
}
function isRouter(value) {
  return isObject(value) && isObject(value["_def"]) && "router" in value["_def"];
}
var emptyRouter = {
  _ctx: null,
  _errorShape: null,
  _meta: null,
  queries: {},
  mutations: {},
  subscriptions: {},
  errorFormatter: defaultFormatter,
  transformer: defaultTransformer
};
var reservedWords = [
  "then",
  "call",
  "apply"
];
function createRouterFactory(config) {
  function createRouterInner(input) {
    const reservedWordsUsed = new Set(Object.keys(input).filter((v) => reservedWords.includes(v)));
    if (reservedWordsUsed.size > 0) throw new Error("Reserved words used in `router({})` call: " + Array.from(reservedWordsUsed).join(", "));
    const procedures = omitPrototype({});
    const lazy$1 = omitPrototype({});
    function createLazyLoader(opts) {
      return {
        ref: opts.ref,
        load: once(async () => {
          const router$1 = await opts.ref();
          const lazyPath = [...opts.path, opts.key];
          const lazyKey = lazyPath.join(".");
          opts.aggregate[opts.key] = step(router$1._def.record, lazyPath);
          delete lazy$1[lazyKey];
          for (const [nestedKey, nestedItem] of Object.entries(router$1._def.lazy)) {
            const nestedRouterKey = [...lazyPath, nestedKey].join(".");
            lazy$1[nestedRouterKey] = createLazyLoader({
              ref: nestedItem.ref,
              path: lazyPath,
              key: nestedKey,
              aggregate: opts.aggregate[opts.key]
            });
          }
        })
      };
    }
    function step(from, path = []) {
      const aggregate = omitPrototype({});
      for (const [key, item] of Object.entries(from !== null && from !== void 0 ? from : {})) {
        if (isLazy(item)) {
          lazy$1[[...path, key].join(".")] = createLazyLoader({
            path,
            ref: item,
            key,
            aggregate
          });
          continue;
        }
        if (isRouter(item)) {
          aggregate[key] = step(item._def.record, [...path, key]);
          continue;
        }
        if (!isProcedure(item)) {
          aggregate[key] = step(item, [...path, key]);
          continue;
        }
        const newPath = [...path, key].join(".");
        if (procedures[newPath]) throw new Error(`Duplicate key: ${newPath}`);
        procedures[newPath] = item;
        aggregate[key] = item;
      }
      return aggregate;
    }
    const record = step(input);
    const _def = (0, import_objectSpread22.default)((0, import_objectSpread22.default)({
      _config: config,
      router: true,
      procedures,
      lazy: lazy$1
    }, emptyRouter), {}, { record });
    const router2 = (0, import_objectSpread22.default)((0, import_objectSpread22.default)({}, record), {}, {
      _def,
      createCaller: createCallerFactory()({ _def })
    });
    return router2;
  }
  return createRouterInner;
}
function isProcedure(procedureOrRouter) {
  return typeof procedureOrRouter === "function";
}
async function getProcedureAtPath(router2, path) {
  const { _def } = router2;
  let procedure = _def.procedures[path];
  while (!procedure) {
    const key = Object.keys(_def.lazy).find((key$1) => path.startsWith(key$1));
    if (!key) return null;
    const lazyRouter = _def.lazy[key];
    await lazyRouter.load();
    procedure = _def.procedures[path];
  }
  return procedure;
}
function createCallerFactory() {
  return function createCallerInner(router2) {
    const { _def } = router2;
    return function createCaller(ctxOrCallback, opts) {
      return createRecursiveProxy(async (innerOpts) => {
        const { path, args } = innerOpts;
        const fullPath = path.join(".");
        if (path.length === 1 && path[0] === "_def") return _def;
        const procedure = await getProcedureAtPath(router2, fullPath);
        let ctx = void 0;
        try {
          if (!procedure) throw new TRPCError({
            code: "NOT_FOUND",
            message: `No procedure found on path "${path}"`
          });
          ctx = isFunction(ctxOrCallback) ? await Promise.resolve(ctxOrCallback()) : ctxOrCallback;
          return await procedure({
            path: fullPath,
            getRawInput: async () => args[0],
            ctx,
            type: procedure._def.type,
            signal: opts === null || opts === void 0 ? void 0 : opts.signal
          });
        } catch (cause) {
          var _opts$onError, _procedure$_def$type;
          opts === null || opts === void 0 || (_opts$onError = opts.onError) === null || _opts$onError === void 0 || _opts$onError.call(opts, {
            ctx,
            error: getTRPCErrorFromUnknown(cause),
            input: args[0],
            path: fullPath,
            type: (_procedure$_def$type = procedure === null || procedure === void 0 ? void 0 : procedure._def.type) !== null && _procedure$_def$type !== void 0 ? _procedure$_def$type : "unknown"
          });
          throw cause;
        }
      });
    };
  };
}
function mergeRouters(...routerList) {
  var _routerList$;
  const record = mergeWithoutOverrides({}, ...routerList.map((r) => r._def.record));
  const errorFormatter = routerList.reduce((currentErrorFormatter, nextRouter) => {
    if (nextRouter._def._config.errorFormatter && nextRouter._def._config.errorFormatter !== defaultFormatter) {
      if (currentErrorFormatter !== defaultFormatter && currentErrorFormatter !== nextRouter._def._config.errorFormatter) throw new Error("You seem to have several error formatters");
      return nextRouter._def._config.errorFormatter;
    }
    return currentErrorFormatter;
  }, defaultFormatter);
  const transformer = routerList.reduce((prev, current) => {
    if (current._def._config.transformer && current._def._config.transformer !== defaultTransformer) {
      if (prev !== defaultTransformer && prev !== current._def._config.transformer) throw new Error("You seem to have several transformers");
      return current._def._config.transformer;
    }
    return prev;
  }, defaultTransformer);
  const router2 = createRouterFactory({
    errorFormatter,
    transformer,
    isDev: routerList.every((r) => r._def._config.isDev),
    allowOutsideOfServer: routerList.every((r) => r._def._config.allowOutsideOfServer),
    isServer: routerList.every((r) => r._def._config.isServer),
    $types: (_routerList$ = routerList[0]) === null || _routerList$ === void 0 ? void 0 : _routerList$._def._config.$types
  })(record);
  return router2;
}
var trackedSymbol = Symbol();

// node_modules/.pnpm/@trpc+server@11.6.0_typescript@5.9.3/node_modules/@trpc/server/dist/initTRPC-CB9uBez5.mjs
var import_objectSpread2$2 = __toESM2(require_objectSpread2(), 1);
var middlewareMarker = "middlewareMarker";
function createMiddlewareFactory() {
  function createMiddlewareInner(middlewares) {
    return {
      _middlewares: middlewares,
      unstable_pipe(middlewareBuilderOrFn) {
        const pipedMiddleware = "_middlewares" in middlewareBuilderOrFn ? middlewareBuilderOrFn._middlewares : [middlewareBuilderOrFn];
        return createMiddlewareInner([...middlewares, ...pipedMiddleware]);
      }
    };
  }
  function createMiddleware(fn) {
    return createMiddlewareInner([fn]);
  }
  return createMiddleware;
}
function createInputMiddleware(parse2) {
  const inputMiddleware = async function inputValidatorMiddleware(opts) {
    let parsedInput;
    const rawInput = await opts.getRawInput();
    try {
      parsedInput = await parse2(rawInput);
    } catch (cause) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        cause
      });
    }
    const combinedInput = isObject(opts.input) && isObject(parsedInput) ? (0, import_objectSpread2$2.default)((0, import_objectSpread2$2.default)({}, opts.input), parsedInput) : parsedInput;
    return opts.next({ input: combinedInput });
  };
  inputMiddleware._type = "input";
  return inputMiddleware;
}
function createOutputMiddleware(parse2) {
  const outputMiddleware = async function outputValidatorMiddleware({ next }) {
    const result = await next();
    if (!result.ok) return result;
    try {
      const data = await parse2(result.data);
      return (0, import_objectSpread2$2.default)((0, import_objectSpread2$2.default)({}, result), {}, { data });
    } catch (cause) {
      throw new TRPCError({
        message: "Output validation failed",
        code: "INTERNAL_SERVER_ERROR",
        cause
      });
    }
  };
  outputMiddleware._type = "output";
  return outputMiddleware;
}
var import_defineProperty2 = __toESM2(require_defineProperty(), 1);
var StandardSchemaV1Error = class extends Error {
  /**
  * Creates a schema error with useful information.
  *
  * @param issues The schema issues.
  */
  constructor(issues) {
    var _issues$;
    super((_issues$ = issues[0]) === null || _issues$ === void 0 ? void 0 : _issues$.message);
    (0, import_defineProperty2.default)(this, "issues", void 0);
    this.name = "SchemaError";
    this.issues = issues;
  }
};
function getParseFn(procedureParser) {
  const parser = procedureParser;
  const isStandardSchema = "~standard" in parser;
  if (typeof parser === "function" && typeof parser.assert === "function") return parser.assert.bind(parser);
  if (typeof parser === "function" && !isStandardSchema) return parser;
  if (typeof parser.parseAsync === "function") return parser.parseAsync.bind(parser);
  if (typeof parser.parse === "function") return parser.parse.bind(parser);
  if (typeof parser.validateSync === "function") return parser.validateSync.bind(parser);
  if (typeof parser.create === "function") return parser.create.bind(parser);
  if (typeof parser.assert === "function") return (value) => {
    parser.assert(value);
    return value;
  };
  if (isStandardSchema) return async (value) => {
    const result = await parser["~standard"].validate(value);
    if (result.issues) throw new StandardSchemaV1Error(result.issues);
    return result.value;
  };
  throw new Error("Could not find a validator fn");
}
var require_objectWithoutPropertiesLoose = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectWithoutPropertiesLoose.js"(exports, module) {
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t2 = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (e.includes(n)) continue;
      t2[n] = r[n];
    }
    return t2;
  }
  module.exports = _objectWithoutPropertiesLoose, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var require_objectWithoutProperties = __commonJS2({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectWithoutProperties.js"(exports, module) {
  var objectWithoutPropertiesLoose = require_objectWithoutPropertiesLoose();
  function _objectWithoutProperties$1(e, t2) {
    if (null == e) return {};
    var o, r, i = objectWithoutPropertiesLoose(e, t2);
    if (Object.getOwnPropertySymbols) {
      var s = Object.getOwnPropertySymbols(e);
      for (r = 0; r < s.length; r++) o = s[r], t2.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  module.exports = _objectWithoutProperties$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });
var import_objectWithoutProperties = __toESM2(require_objectWithoutProperties(), 1);
var import_objectSpread2$12 = __toESM2(require_objectSpread2(), 1);
var _excluded = [
  "middlewares",
  "inputs",
  "meta"
];
function createNewBuilder(def1, def2) {
  const { middlewares = [], inputs, meta } = def2, rest = (0, import_objectWithoutProperties.default)(def2, _excluded);
  return createBuilder((0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, mergeWithoutOverrides(def1, rest)), {}, {
    inputs: [...def1.inputs, ...inputs !== null && inputs !== void 0 ? inputs : []],
    middlewares: [...def1.middlewares, ...middlewares],
    meta: def1.meta && meta ? (0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, def1.meta), meta) : meta !== null && meta !== void 0 ? meta : def1.meta
  }));
}
function createBuilder(initDef = {}) {
  const _def = (0, import_objectSpread2$12.default)({
    procedure: true,
    inputs: [],
    middlewares: []
  }, initDef);
  const builder = {
    _def,
    input(input) {
      const parser = getParseFn(input);
      return createNewBuilder(_def, {
        inputs: [input],
        middlewares: [createInputMiddleware(parser)]
      });
    },
    output(output) {
      const parser = getParseFn(output);
      return createNewBuilder(_def, {
        output,
        middlewares: [createOutputMiddleware(parser)]
      });
    },
    meta(meta) {
      return createNewBuilder(_def, { meta });
    },
    use(middlewareBuilderOrFn) {
      const middlewares = "_middlewares" in middlewareBuilderOrFn ? middlewareBuilderOrFn._middlewares : [middlewareBuilderOrFn];
      return createNewBuilder(_def, { middlewares });
    },
    unstable_concat(builder$1) {
      return createNewBuilder(_def, builder$1._def);
    },
    concat(builder$1) {
      return createNewBuilder(_def, builder$1._def);
    },
    query(resolver) {
      return createResolver((0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, _def), {}, { type: "query" }), resolver);
    },
    mutation(resolver) {
      return createResolver((0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, _def), {}, { type: "mutation" }), resolver);
    },
    subscription(resolver) {
      return createResolver((0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, _def), {}, { type: "subscription" }), resolver);
    },
    experimental_caller(caller) {
      return createNewBuilder(_def, { caller });
    }
  };
  return builder;
}
function createResolver(_defIn, resolver) {
  const finalBuilder = createNewBuilder(_defIn, {
    resolver,
    middlewares: [async function resolveMiddleware(opts) {
      const data = await resolver(opts);
      return {
        marker: middlewareMarker,
        ok: true,
        data,
        ctx: opts.ctx
      };
    }]
  });
  const _def = (0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, finalBuilder._def), {}, {
    type: _defIn.type,
    experimental_caller: Boolean(finalBuilder._def.caller),
    meta: finalBuilder._def.meta,
    $types: null
  });
  const invoke = createProcedureCaller(finalBuilder._def);
  const callerOverride = finalBuilder._def.caller;
  if (!callerOverride) return invoke;
  const callerWrapper = async (...args) => {
    return await callerOverride({
      args,
      invoke,
      _def
    });
  };
  callerWrapper._def = _def;
  return callerWrapper;
}
var codeblock = `
This is a client-only function.
If you want to call this function on the server, see https://trpc.io/docs/v11/server/server-side-calls
`.trim();
async function callRecursive(index, _def, opts) {
  try {
    const middleware = _def.middlewares[index];
    const result = await middleware((0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, opts), {}, {
      meta: _def.meta,
      input: opts.input,
      next(_nextOpts) {
        var _nextOpts$getRawInput;
        const nextOpts = _nextOpts;
        return callRecursive(index + 1, _def, (0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, opts), {}, {
          ctx: (nextOpts === null || nextOpts === void 0 ? void 0 : nextOpts.ctx) ? (0, import_objectSpread2$12.default)((0, import_objectSpread2$12.default)({}, opts.ctx), nextOpts.ctx) : opts.ctx,
          input: nextOpts && "input" in nextOpts ? nextOpts.input : opts.input,
          getRawInput: (_nextOpts$getRawInput = nextOpts === null || nextOpts === void 0 ? void 0 : nextOpts.getRawInput) !== null && _nextOpts$getRawInput !== void 0 ? _nextOpts$getRawInput : opts.getRawInput
        }));
      }
    }));
    return result;
  } catch (cause) {
    return {
      ok: false,
      error: getTRPCErrorFromUnknown(cause),
      marker: middlewareMarker
    };
  }
}
function createProcedureCaller(_def) {
  async function procedure(opts) {
    if (!opts || !("getRawInput" in opts)) throw new Error(codeblock);
    const result = await callRecursive(0, _def, opts);
    if (!result) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No result from middlewares - did you forget to `return next()`?"
    });
    if (!result.ok) throw result.error;
    return result.data;
  }
  procedure._def = _def;
  procedure.procedure = true;
  procedure.meta = _def.meta;
  return procedure;
}
var _globalThis$process;
var _globalThis$process2;
var _globalThis$process3;
var isServerDefault = typeof window === "undefined" || "Deno" in window || ((_globalThis$process = globalThis.process) === null || _globalThis$process === void 0 || (_globalThis$process = _globalThis$process.env) === null || _globalThis$process === void 0 ? void 0 : _globalThis$process["NODE_ENV"]) === "test" || !!((_globalThis$process2 = globalThis.process) === null || _globalThis$process2 === void 0 || (_globalThis$process2 = _globalThis$process2.env) === null || _globalThis$process2 === void 0 ? void 0 : _globalThis$process2["JEST_WORKER_ID"]) || !!((_globalThis$process3 = globalThis.process) === null || _globalThis$process3 === void 0 || (_globalThis$process3 = _globalThis$process3.env) === null || _globalThis$process3 === void 0 ? void 0 : _globalThis$process3["VITEST_WORKER_ID"]);
var import_objectSpread23 = __toESM2(require_objectSpread2(), 1);
var TRPCBuilder = class TRPCBuilder2 {
  /**
  * Add a context shape as a generic to the root object
  * @see https://trpc.io/docs/v11/server/context
  */
  context() {
    return new TRPCBuilder2();
  }
  /**
  * Add a meta shape as a generic to the root object
  * @see https://trpc.io/docs/v11/quickstart
  */
  meta() {
    return new TRPCBuilder2();
  }
  /**
  * Create the root object
  * @see https://trpc.io/docs/v11/server/routers#initialize-trpc
  */
  create(opts) {
    var _opts$transformer, _opts$isDev, _globalThis$process$1, _opts$allowOutsideOfS, _opts$errorFormatter, _opts$isServer;
    const config = (0, import_objectSpread23.default)((0, import_objectSpread23.default)({}, opts), {}, {
      transformer: getDataTransformer((_opts$transformer = opts === null || opts === void 0 ? void 0 : opts.transformer) !== null && _opts$transformer !== void 0 ? _opts$transformer : defaultTransformer),
      isDev: (_opts$isDev = opts === null || opts === void 0 ? void 0 : opts.isDev) !== null && _opts$isDev !== void 0 ? _opts$isDev : ((_globalThis$process$1 = globalThis.process) === null || _globalThis$process$1 === void 0 ? void 0 : _globalThis$process$1.env["NODE_ENV"]) !== "production",
      allowOutsideOfServer: (_opts$allowOutsideOfS = opts === null || opts === void 0 ? void 0 : opts.allowOutsideOfServer) !== null && _opts$allowOutsideOfS !== void 0 ? _opts$allowOutsideOfS : false,
      errorFormatter: (_opts$errorFormatter = opts === null || opts === void 0 ? void 0 : opts.errorFormatter) !== null && _opts$errorFormatter !== void 0 ? _opts$errorFormatter : defaultFormatter,
      isServer: (_opts$isServer = opts === null || opts === void 0 ? void 0 : opts.isServer) !== null && _opts$isServer !== void 0 ? _opts$isServer : isServerDefault,
      $types: null
    });
    {
      var _opts$isServer2;
      const isServer = (_opts$isServer2 = opts === null || opts === void 0 ? void 0 : opts.isServer) !== null && _opts$isServer2 !== void 0 ? _opts$isServer2 : isServerDefault;
      if (!isServer && (opts === null || opts === void 0 ? void 0 : opts.allowOutsideOfServer) !== true) throw new Error(`You're trying to use @trpc/server in a non-server environment. This is not supported by default.`);
    }
    return {
      _config: config,
      procedure: createBuilder({ meta: opts === null || opts === void 0 ? void 0 : opts.defaultMeta }),
      middleware: createMiddlewareFactory(),
      router: createRouterFactory(config),
      mergeRouters,
      createCallerFactory: createCallerFactory()
    };
  }
};
var initTRPC = new TRPCBuilder();

// node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js
import nodeCrypto from "crypto";
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return nodeCrypto.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
function setRandomFallback(random) {
  randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer2 = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer2[offset++] = c1;
    } else if (c1 < 2048) {
      buffer2[offset++] = c1 >> 6 | 192;
      buffer2[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer2[offset++] = c1 >> 18 | 240;
      buffer2[offset++] = c1 >> 12 & 63 | 128;
      buffer2[offset++] = c1 >> 6 & 63 | 128;
      buffer2[offset++] = c1 & 63 | 128;
    } else {
      buffer2[offset++] = c1 >> 12 | 224;
      buffer2[offset++] = c1 >> 6 & 63 | 128;
      buffer2[offset++] = c1 & 63 | 128;
    }
  }
  return buffer2;
}
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b2, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b2.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b2[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b2[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b2[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _crypt(b2, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b2, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b2, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};

// server/routers.ts
import { SignJWT, jwtVerify } from "jose";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
var import_superjson = __toESM(require_dist(), 1);
var t = initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/db.ts
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js
import os from "os";
import fs from "fs";

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/query.js
var originCache = /* @__PURE__ */ new Map();
var originStackCache = /* @__PURE__ */ new Map();
var originError = Symbol("OriginError");
var CLOSE = {};
var Query = class extends Promise {
  constructor(strings, args, handler, canceller, options = {}) {
    let resolve, reject;
    super((a, b2) => {
      resolve = a;
      reject = b2;
    });
    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler;
    this.canceller = canceller;
    this.options = options;
    this.state = null;
    this.statement = null;
    this.resolve = (x) => (this.active = false, resolve(x));
    this.reject = (x) => (this.active = false, reject(x));
    this.active = false;
    this.cancelled = null;
    this.executed = false;
    this.signature = "";
    this[originError] = this.handler.debug ? new Error() : this.tagged && cachedError(this.strings);
  }
  get origin() {
    return (this.handler.debug ? this[originError].stack : this.tagged && originStackCache.has(this.strings) ? originStackCache.get(this.strings) : originStackCache.set(this.strings, this[originError].stack).get(this.strings)) || "";
  }
  static get [Symbol.species]() {
    return Promise;
  }
  cancel() {
    return this.canceller && (this.canceller(this), this.canceller = null);
  }
  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }
  async readable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  async writable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === "function") {
      fn = rows;
      rows = 1;
    }
    this.cursorRows = rows;
    if (typeof fn === "function")
      return this.cursorFn = fn, this;
    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (this.executed && !this.active)
            return { done: true };
          prev && prev();
          const promise = new Promise((resolve, reject) => {
            this.cursorFn = (value) => {
              resolve({ value, done: false });
              return new Promise((r) => prev = r);
            };
            this.resolve = () => (this.active = false, resolve({ done: true }));
            this.reject = (x) => (this.active = false, reject(x));
          });
          this.execute();
          return promise;
        },
        return() {
          prev && prev(CLOSE);
          return { done: true };
        }
      })
    };
  }
  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this;
  }
  stream() {
    throw new Error(".stream has been renamed to .forEach");
  }
  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this;
  }
  raw() {
    this.isRaw = true;
    return this;
  }
  values() {
    this.isRaw = "values";
    return this;
  }
  async handle() {
    !this.executed && (this.executed = true) && await 1 && this.handler(this);
  }
  execute() {
    this.handle();
    return this;
  }
  then() {
    this.handle();
    return super.then.apply(this, arguments);
  }
  catch() {
    this.handle();
    return super.catch.apply(this, arguments);
  }
  finally() {
    this.handle();
    return super.finally.apply(this, arguments);
  }
};
function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs);
  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error());
  Error.stackTraceLimit = x;
  return originCache.get(xs);
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/errors.js
var PostgresError = class extends Error {
  constructor(x) {
    super(x.message);
    this.name = this.constructor.name;
    Object.assign(this, x);
  }
};
var Errors = {
  connection,
  postgres,
  generic,
  notSupported
};
function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(
    new Error("write " + x + " " + (options.path || host + ":" + port)),
    {
      code: x,
      errno: x,
      address: options.path || host
    },
    options.path ? {} : { port }
  );
  Error.captureStackTrace(error, connection);
  return error;
}
function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error;
}
function generic(code, message) {
  const error = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error, generic);
  return error;
}
function notSupported(x) {
  const error = Object.assign(
    new Error(x + " (B) is not supported"),
    {
      code: "MESSAGE_NOT_SUPPORTED",
      name: x
    }
  );
  Error.captureStackTrace(error, notSupported);
  return error;
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/types.js
var types = {
  string: {
    to: 25,
    from: null,
    // defaults to string
    serialize: (x) => "" + x
  },
  number: {
    to: 0,
    from: [21, 23, 26, 700, 701],
    serialize: (x) => "" + x,
    parse: (x) => +x
  },
  json: {
    to: 114,
    from: [114, 3802],
    serialize: (x) => JSON.stringify(x),
    parse: (x) => JSON.parse(x)
  },
  boolean: {
    to: 16,
    from: 16,
    serialize: (x) => x === true ? "t" : "f",
    parse: (x) => x === "t"
  },
  date: {
    to: 1184,
    from: [1082, 1114, 1184],
    serialize: (x) => (x instanceof Date ? x : new Date(x)).toISOString(),
    parse: (x) => new Date(x)
  },
  bytea: {
    to: 17,
    from: 17,
    serialize: (x) => "\\x" + Buffer.from(x).toString("hex"),
    parse: (x) => Buffer.from(x.slice(2), "hex")
  }
};
var NotTagged = class {
  then() {
    notTagged();
  }
  catch() {
    notTagged();
  }
  finally() {
    notTagged();
  }
};
var Identifier = class extends NotTagged {
  constructor(value) {
    super();
    this.value = escapeIdentifier(value);
  }
};
var Parameter = class extends NotTagged {
  constructor(value, type, array) {
    super();
    this.value = value;
    this.type = type;
    this.array = array;
  }
};
var Builder = class extends NotTagged {
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }
  build(before, parameters, types2, options) {
    const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b2) => a.i - b2.i).pop();
    return keyword.i === -1 ? escapeIdentifiers(this.first, options) : keyword.fn(this.first, this.rest, parameters, types2, options);
  }
};
function handleValue(x, parameters, types2, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === void 0) {
    x instanceof Parameter ? x.value = options.transform.undefined : value = x = options.transform.undefined;
    if (value === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
  }
  return "$" + types2.push(
    x instanceof Parameter ? (parameters.push(x.value), x.array ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value) : x.type) : (parameters.push(x), inferType(x))
  );
}
var defaultHandlers = typeHandlers(types);
function stringify(q, string, value, parameters, types2, options) {
  for (let i = 1; i < q.strings.length; i++) {
    string += stringifyValue(string, value, parameters, types2, options) + q.strings[i];
    value = q.args[i];
  }
  return string;
}
function stringifyValue(string, value, parameters, types2, o) {
  return value instanceof Builder ? value.build(string, parameters, types2, o) : value instanceof Query ? fragment(value, parameters, types2, o) : value instanceof Identifier ? value.value : value && value[0] instanceof Query ? value.reduce((acc, x) => acc + " " + fragment(x, parameters, types2, o), "") : handleValue(value, parameters, types2, o);
}
function fragment(q, parameters, types2, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types2, options);
}
function valuesBuilder(first, parameters, types2, columns, options) {
  return first.map(
    (row) => "(" + columns.map(
      (column) => stringifyValue("values", row[column], parameters, types2, options)
    ).join(",") + ")"
  ).join(",");
}
function values(first, rest, parameters, types2, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types2, columns, options);
}
function select(first, rest, parameters, types2, options) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options);
  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map((x) => {
    value = first[x];
    return (value instanceof Query ? fragment(value, parameters, types2, options) : value instanceof Identifier ? value.value : handleValue(value, parameters, types2, options)) + " as " + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x);
  }).join(",");
}
var builders = Object.entries({
  values,
  in: (...xs) => {
    const x = values(...xs);
    return x === "()" ? "(null)" : x;
  },
  select,
  as: select,
  returning: select,
  "\\(": select,
  update(first, rest, parameters, types2, options) {
    return (rest.length ? rest.flat() : Object.keys(first)).map(
      (x) => escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) + "=" + stringifyValue("values", first[x], parameters, types2, options)
    );
  },
  insert(first, rest, parameters, types2, options) {
    const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
    return "(" + escapeIdentifiers(columns, options) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], parameters, types2, columns, options);
  }
}).map(([x, fn]) => [new RegExp("((?:^|[\\s(])" + x + "(?:$|[\\s(]))(?![\\s\\S]*\\1)", "i"), fn]);
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
var serializers = defaultHandlers.serializers;
var parsers = defaultHandlers.parsers;
function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0]);
  return typeof x === "string" ? 1009 : 0;
}
var mergeUserTypes = function(types2) {
  const user = typeHandlers(types2 || {});
  return {
    serializers: Object.assign({}, serializers, user.serializers),
    parsers: Object.assign({}, parsers, user.parsers)
  };
};
function typeHandlers(types2) {
  return Object.keys(types2).reduce((acc, k) => {
    types2[k].from && [].concat(types2[k].from).forEach((x) => acc.parsers[x] = types2[k].parse);
    if (types2[k].serialize) {
      acc.serializers[types2[k].to] = types2[k].serialize;
      types2[k].from && [].concat(types2[k].from).forEach((x) => acc.serializers[x] = types2[k].serialize);
    }
    return acc;
  }, { parsers: {}, serializers: {} });
}
function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map((x) => escapeIdentifier(column.to ? column.to(x) : x)).join(",");
}
var escapeIdentifier = function escape(str) {
  return '"' + str.replace(/"/g, '""').replace(/\./g, '"."') + '"';
};
var inferType = function inferType2(x) {
  return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? inferType2(x[0]) : 0;
};
var escapeBackslash = /\\/g;
var escapeQuote = /"/g;
function arrayEscape(x) {
  return x.replace(escapeBackslash, "\\\\").replace(escapeQuote, '\\"');
}
var arraySerializer = function arraySerializer2(xs, serializer, options, typarray) {
  if (Array.isArray(xs) === false)
    return xs;
  if (!xs.length)
    return "{}";
  const first = xs[0];
  const delimiter = typarray === 1020 ? ";" : ",";
  if (Array.isArray(first) && !first.type)
    return "{" + xs.map((x) => arraySerializer2(x, serializer, options, typarray)).join(delimiter) + "}";
  return "{" + xs.map((x) => {
    if (x === void 0) {
      x = options.transform.undefined;
      if (x === void 0)
        throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    }
    return x === null ? "null" : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : "" + x) + '"';
  }).join(delimiter) + "}";
};
var arrayParserState = {
  i: 0,
  char: null,
  str: "",
  quoted: false,
  last: 0
};
var arrayParser = function arrayParser2(x, parser, typarray) {
  arrayParserState.i = arrayParserState.last = 0;
  return arrayParserLoop(arrayParserState, x, parser, typarray);
};
function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  const delimiter = typarray === 1020 ? ";" : ",";
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === "\\") {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = "";
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === "{") {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === "}") {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break;
    } else if (s.char === delimiter && s.p !== "}" && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs;
}
var toCamel = (x) => {
  let str = x[0];
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toPascal = (x) => {
  let str = x[0].toUpperCase();
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toKebab = (x) => x.replace(/_/g, "-");
var fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
var fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
var fromKebab = (x) => x.replace(/-/g, "_");
function createJsonTransform(fn) {
  return function jsonTransform(x, column) {
    return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
  };
}
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
var camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
var pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
var kebab = { ...toKebab };
kebab.column.to = fromKebab;

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/connection.js
import net from "net";
import tls from "tls";
import crypto2 from "crypto";
import Stream from "stream";
import { performance } from "perf_hooks";

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/result.js
var Result = class extends Array {
  constructor() {
    super();
    Object.defineProperties(this, {
      count: { value: null, writable: true },
      state: { value: null, writable: true },
      command: { value: null, writable: true },
      columns: { value: null, writable: true },
      statement: { value: null, writable: true }
    });
  }
  static get [Symbol.species]() {
    return Array;
  }
};

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/queue.js
var queue_default = Queue;
function Queue(initial = []) {
  let xs = initial.slice();
  let index = 0;
  return {
    get length() {
      return xs.length - index;
    },
    remove: (x) => {
      const index2 = xs.indexOf(x);
      return index2 === -1 ? null : (xs.splice(index2, 1), x);
    },
    push: (x) => (xs.push(x), x),
    shift: () => {
      const out = xs[index++];
      if (index === xs.length) {
        index = 0;
        xs = [];
      } else {
        xs[index - 1] = void 0;
      }
      return out;
    }
  };
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/bytes.js
var size = 256;
var buffer = Buffer.allocUnsafe(size);
var messages = "BCcDdEFfHPpQSX".split("").reduce((acc, x) => {
  const v = x.charCodeAt(0);
  acc[x] = () => {
    buffer[0] = v;
    b.i = 5;
    return b;
  };
  return acc;
}, {});
var b = Object.assign(reset, messages, {
  N: String.fromCharCode(0),
  i: 0,
  inc(x) {
    b.i += x;
    return b;
  },
  str(x) {
    const length = Buffer.byteLength(x);
    fit(length);
    b.i += buffer.write(x, b.i, length, "utf8");
    return b;
  },
  i16(x) {
    fit(2);
    buffer.writeUInt16BE(x, b.i);
    b.i += 2;
    return b;
  },
  i32(x, i) {
    if (i || i === 0) {
      buffer.writeUInt32BE(x, i);
      return b;
    }
    fit(4);
    buffer.writeUInt32BE(x, b.i);
    b.i += 4;
    return b;
  },
  z(x) {
    fit(x);
    buffer.fill(0, b.i, b.i + x);
    b.i += x;
    return b;
  },
  raw(x) {
    buffer = Buffer.concat([buffer.subarray(0, b.i), x]);
    b.i = buffer.length;
    return b;
  },
  end(at = 1) {
    buffer.writeUInt32BE(b.i - at, at);
    const out = buffer.subarray(0, b.i);
    b.i = 0;
    buffer = Buffer.allocUnsafe(size);
    return out;
  }
});
var bytes_default = b;
function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer, length = prev.length;
    buffer = Buffer.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}
function reset() {
  b.i = 0;
  return b;
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/connection.js
var connection_default = Connection;
var uid = 1;
var Sync = bytes_default().S().end();
var Flush = bytes_default().H().end();
var SSLRequest = bytes_default().i32(8).i32(80877103).end(8);
var ExecuteUnnamed = Buffer.concat([bytes_default().E().str(bytes_default.N).i32(0).end(), Sync]);
var DescribeUnnamed = bytes_default().D().str("S").str(bytes_default.N).end();
var noop2 = () => {
};
var retryRoutines = /* @__PURE__ */ new Set([
  "FetchPreparedStatement",
  "RevalidateCachedQuery",
  "transformAssignedExpr"
]);
var errorFields = {
  83: "severity_local",
  // S
  86: "severity",
  // V
  67: "code",
  // C
  77: "message",
  // M
  68: "detail",
  // D
  72: "hint",
  // H
  80: "position",
  // P
  112: "internal_position",
  // p
  113: "internal_query",
  // q
  87: "where",
  // W
  115: "schema_name",
  // s
  116: "table_name",
  // t
  99: "column_name",
  // c
  100: "data type_name",
  // d
  110: "constraint_name",
  // n
  70: "file",
  // F
  76: "line",
  // L
  82: "routine"
  // R
};
function Connection(options, queues = {}, { onopen = noop2, onend = noop2, onclose = noop2 } = {}) {
  const {
    sslnegotiation,
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers: parsers2,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff: backoff2,
    target_session_attrs
  } = options;
  const sent = queue_default(), id = uid++, backend = { pid: null, secret: null }, idleTimer = timer(end, options.idle_timeout), lifeTimer = timer(end, options.max_lifetime), connectTimer = timer(connectTimedOut, options.connect_timeout);
  let socket = null, cancelMessage, errorResponse = null, result = new Result(), incoming = Buffer.alloc(0), needsTypes = options.fetch_types, backendParameters = {}, statements = {}, statementId = Math.random().toString(36).slice(2), statementCount = 1, closedTime = 0, remaining = 0, hostIndex = 0, retries = 0, length = 0, delay = 0, rows = 0, serverSignature = null, nextWriteTimer = null, terminated = false, incomings = null, results = null, initial = null, ending = null, stream = null, chunk = null, ended = null, nonce = null, query = null, final = null;
  const connection2 = {
    queue: queues.closed,
    idleTimer,
    connect(query2) {
      initial = query2;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };
  queues.closed && queues.closed.push(connection2);
  return connection2;
  async function createSocket() {
    let x;
    try {
      x = options.socket ? await Promise.resolve(options.socket(options)) : new net.Socket();
    } catch (e) {
      error(e);
      return;
    }
    x.on("error", error);
    x.on("close", closed);
    x.on("drain", drain);
    return x;
  }
  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = bytes_default().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once("error", reject);
      socket.once("close", resolve);
    } catch (error2) {
      reject(error2);
    }
  }
  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection("CONNECTION_DESTROYED", options));
    if (stream)
      return queryError(q, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
    if (q.cancelled)
      return;
    try {
      q.state = backend;
      query ? sent.push(q) : (query = q, query.active = true);
      build(q);
      return write(toBuffer(q)) && !q.describeFirst && !q.cursorFn && sent.length < max_pipeline && (!q.options.onexecute || q.options.onexecute(connection2));
    } catch (error2) {
      sent.length === 0 && write(Sync);
      errored(error2);
      return true;
    }
  }
  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
    return q.options.simple ? bytes_default().Q().str(q.statement.string + bytes_default.N).end() : q.describeFirst ? Buffer.concat([describe(q), Flush]) : q.prepare ? q.prepared ? prepared(q) : Buffer.concat([describe(q), prepared(q)]) : unnamed(q);
  }
  function describe(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe("S", q.statement.name)
    ]);
  }
  function prepared(q) {
    return Buffer.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn ? Execute("", q.cursorRows) : ExecuteUnnamed
    ]);
  }
  function unnamed(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ]);
  }
  function build(q) {
    const parameters = [], types2 = [];
    const string = stringify(q, q.strings[0], q.args[0], parameters, types2, options);
    !q.tagged && q.args.forEach((x) => handleValue(x, parameters, types2, options));
    q.prepare = options.prepare && ("prepare" in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types2 + string;
    q.onlyDescribe && delete statements[q.signature];
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || parameters.length && !q.prepared;
    q.statement = q.prepared ? statements[q.signature] : { string, types: types2, name: q.prepare ? statementId + statementCount++ : "" };
    typeof options.debug === "function" && options.debug(id, string, parameters, types2);
  }
  function write(x, fn) {
    chunk = chunk ? Buffer.concat([chunk, x]) : Buffer.from(x);
    if (fn || chunk.length >= 1024)
      return nextWrite(fn);
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true;
  }
  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x;
  }
  function connectTimedOut() {
    errored(Errors.connection("CONNECT_TIMEOUT", options, socket));
    socket.destroy();
  }
  async function secure() {
    if (sslnegotiation !== "direct") {
      write(SSLRequest);
      const canSSL = await new Promise((r) => socket.once("data", (x) => r(x[0] === 83)));
      if (!canSSL && ssl === "prefer")
        return connected();
    }
    const options2 = {
      socket,
      servername: net.isIP(socket.host) ? void 0 : socket.host
    };
    if (sslnegotiation === "direct")
      options2.ALPNProtocols = ["postgresql"];
    if (ssl === "require" || ssl === "allow" || ssl === "prefer")
      options2.rejectUnauthorized = false;
    else if (typeof ssl === "object")
      Object.assign(options2, ssl);
    socket.removeAllListeners();
    socket = tls.connect(options2);
    socket.on("secureConnect", connected);
    socket.on("error", error);
    socket.on("close", closed);
    socket.on("drain", drain);
  }
  function drain() {
    !query && onopen(connection2);
  }
  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return;
    }
    incoming = incomings ? Buffer.concat(incomings, length - remaining) : incoming.length === 0 ? x : Buffer.concat([incoming, x], incoming.length + x.length);
    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break;
      }
      try {
        handle(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }
  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());
    if (!socket)
      return;
    connectTimer.start();
    if (options.socket)
      return ssl ? secure() : connected();
    socket.on("connect", ssl ? secure : connected);
    if (options.path)
      return socket.connect(options.path);
    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];
    hostIndex = (hostIndex + 1) % port.length;
  }
  function reconnect() {
    setTimeout(connect, closedTime ? Math.max(0, closedTime + delay - performance.now()) : 0);
  }
  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on("data", data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err) {
      error(err);
    }
  }
  function error(err) {
    if (connection2.queue === queues.connecting && options.host[retries + 1])
      return;
    errored(err);
    while (sent.length)
      queryError(sent.shift(), err);
  }
  function errored(err) {
    stream && (stream.destroy(err), stream = null);
    query && queryError(query, err);
    initial && (queryError(initial, err), initial = null);
  }
  function queryError(query2, err) {
    if (query2.reserve)
      return query2.reject(err);
    if (!err || typeof err !== "object")
      err = new Error(err);
    "query" in err || "parameters" in err || Object.defineProperties(err, {
      stack: { value: err.stack + query2.origin.replace(/.*\n/, "\n"), enumerable: options.debug },
      query: { value: query2.string, enumerable: options.debug },
      parameters: { value: query2.parameters, enumerable: options.debug },
      args: { value: query2.args, enumerable: options.debug },
      types: { value: query2.statement && query2.statement.types, enumerable: options.debug }
    });
    query2.reject(err);
  }
  function end() {
    return ending || (!connection2.reserved && onend(connection2), !connection2.reserved && !initial && !query && sent.length === 0 ? (terminate(), new Promise((r) => socket && socket.readyState !== "closed" ? socket.once("close", r) : r())) : ending = new Promise((r) => ended = r));
  }
  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection("CONNECTION_DESTROYED", options));
    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener("data", data);
      socket.removeListener("connect", connected);
      socket.readyState === "open" && socket.end(bytes_default().X().end());
    }
    ended && (ended(), ending = ended = null);
  }
  async function closed(hadError) {
    incoming = Buffer.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener("data", data);
    socket.removeListener("connect", connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();
    socket.removeAllListeners();
    socket = null;
    if (initial)
      return reconnect();
    !hadError && (query || sent.length) && error(Errors.connection("CONNECTION_CLOSED", options, socket));
    closedTime = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff2 === "function" ? backoff2(options.shared.retries) : backoff2) * 1e3;
    onclose(connection2, Errors.connection("CONNECTION_CLOSED", options, socket));
  }
  function handle(xs, x = xs[0]) {
    (x === 68 ? DataRow : (
      // D
      x === 100 ? CopyData : (
        // d
        x === 65 ? NotificationResponse : (
          // A
          x === 83 ? ParameterStatus : (
            // S
            x === 90 ? ReadyForQuery : (
              // Z
              x === 67 ? CommandComplete : (
                // C
                x === 50 ? BindComplete : (
                  // 2
                  x === 49 ? ParseComplete : (
                    // 1
                    x === 116 ? ParameterDescription : (
                      // t
                      x === 84 ? RowDescription : (
                        // T
                        x === 82 ? Authentication : (
                          // R
                          x === 110 ? NoData : (
                            // n
                            x === 75 ? BackendKeyData : (
                              // K
                              x === 69 ? ErrorResponse : (
                                // E
                                x === 115 ? PortalSuspended : (
                                  // s
                                  x === 51 ? CloseComplete : (
                                    // 3
                                    x === 71 ? CopyInResponse : (
                                      // G
                                      x === 78 ? NoticeResponse : (
                                        // N
                                        x === 72 ? CopyOutResponse : (
                                          // H
                                          x === 99 ? CopyDone : (
                                            // c
                                            x === 73 ? EmptyQueryResponse : (
                                              // I
                                              x === 86 ? FunctionCallResponse : (
                                                // V
                                                x === 118 ? NegotiateProtocolVersion : (
                                                  // v
                                                  x === 87 ? CopyBothResponse : (
                                                    // W
                                                    /* c8 ignore next */
                                                    UnknownMessage
                                                  )
                                                )
                                              )
                                            )
                                          )
                                        )
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ))(xs);
  }
  function DataRow(x) {
    let index = 7;
    let length2;
    let column;
    let value;
    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0; i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length2 = x.readInt32BE(index);
      index += 4;
      value = length2 === -1 ? null : query.isRaw === true ? x.subarray(index, index += length2) : column.parser === void 0 ? x.toString("utf8", index, index += length2) : column.parser.array === true ? column.parser(x.toString("utf8", index + 1, index += length2)) : column.parser(x.toString("utf8", index, index += length2));
      query.isRaw ? row[i] = query.isRaw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
    }
    query.forEachFn ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result) : result[rows++] = transform.row.from ? transform.row.from(row) : row;
  }
  function ParameterStatus(x) {
    const [k, v] = x.toString("utf8", 5, x.length - 1).split(bytes_default.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }
  function ReadyForQuery(x) {
    if (query) {
      if (errorResponse) {
        query.retried ? errored(query.retried) : query.prepared && retryRoutines.has(errorResponse.routine) ? retry(query, errorResponse) : errored(errorResponse);
      } else {
        query.resolve(results || result);
      }
    } else if (errorResponse) {
      errored(errorResponse);
    }
    query = results = errorResponse = null;
    result = new Result();
    connectTimer.cancel();
    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState();
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate();
      }
      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes();
      }
      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return;
    }
    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);
    if (query)
      return;
    connection2.reserved ? !connection2.reserved.release && x[5] === 73 ? ending ? terminate() : (connection2.reserved = null, onopen(connection2)) : connection2.reserved() : ending ? terminate() : onopen(connection2);
  }
  function CommandComplete(x) {
    rows = 0;
    for (let i = x.length - 1; i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString("utf8", i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString("utf8", 5, i);
        result.state = backend;
        break;
      }
    }
    final && (final(), final = null);
    if (result.command === "BEGIN" && max !== 1 && !connection2.reserved)
      return errored(Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1"));
    if (query.options.simple)
      return BindComplete();
    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }
  }
  function ParseComplete() {
    query.parsing = false;
  }
  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }
  function ParameterDescription(x) {
    const length2 = x.readUInt16BE(5);
    for (let i = 0; i < length2; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));
    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }
  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result());
      result.count = null;
      query.statement.columns = null;
    }
    const length2 = x.readUInt16BE(5);
    let index = 7;
    let start;
    query.statement.columns = Array(length2);
    for (let i = 0; i < length2; ++i) {
      start = index;
      while (x[index++] !== 0) ;
      const table = x.readUInt32BE(index);
      const number = x.readUInt16BE(index + 4);
      const type = x.readUInt32BE(index + 6);
      query.statement.columns[i] = {
        name: transform.column.from ? transform.column.from(x.toString("utf8", start, index - 1)) : x.toString("utf8", start, index - 1),
        parser: parsers2[type],
        table,
        number,
        type
      };
      index += 18;
    }
    result.statement = query.statement;
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  async function Authentication(x, type = x.readUInt32BE(5)) {
    (type === 3 ? AuthenticationCleartextPassword : type === 5 ? AuthenticationMD5Password : type === 10 ? SASL : type === 11 ? SASLContinue : type === 12 ? SASLFinal : type !== 0 ? UnknownAuth : noop2)(x, type);
  }
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function AuthenticationMD5Password(x) {
    const payload = "md5" + await md5(
      Buffer.concat([
        Buffer.from(await md5(await Pass() + user)),
        x.subarray(9)
      ])
    );
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function SASL() {
    nonce = (await crypto2.randomBytes(18)).toString("base64");
    bytes_default().p().str("SCRAM-SHA-256" + bytes_default.N);
    const i = bytes_default.i;
    write(bytes_default.inc(4).str("n,,n=*,r=" + nonce).i32(bytes_default.i - i - 4, i).end());
  }
  async function SASLContinue(x) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {});
    const saltedPassword = await crypto2.pbkdf2Sync(
      await Pass(),
      Buffer.from(res.s, "base64"),
      parseInt(res.i),
      32,
      "sha256"
    );
    const clientKey = await hmac(saltedPassword, "Client Key");
    const auth = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=biws,r=" + res.r;
    serverSignature = (await hmac(await hmac(saltedPassword, "Server Key"), auth)).toString("base64");
    const payload = "c=biws,r=" + res.r + ",p=" + xor(
      clientKey,
      Buffer.from(await hmac(await sha256(clientKey), auth))
    ).toString("base64");
    write(
      bytes_default().p().str(payload).end()
    );
  }
  function SASLFinal(x) {
    if (x.toString("utf8", 9).split(bytes_default.N, 1)[0].slice(2) === serverSignature)
      return;
    errored(Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature"));
    socket.destroy();
  }
  function Pass() {
    return Promise.resolve(
      typeof options.pass === "function" ? options.pass() : options.pass
    );
  }
  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }
  async function fetchArrayTypes() {
    needsTypes = false;
    const types2 = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types2.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }
  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray]) return;
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }
  function tryNext(x, xs) {
    return x === "read-write" && xs.default_transaction_read_only === "on" || x === "read-only" && xs.default_transaction_read_only === "off" || x === "primary" && xs.in_hot_standby === "on" || x === "standby" && xs.in_hot_standby === "off" || x === "prefer-standby" && xs.in_hot_standby === "off" && options.host[retries];
  }
  function fetchState() {
    const query2 = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query2.resolve = ([[a], [b2]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b2.pg_is_in_recovery ? "on" : "off";
    };
    query2.execute();
  }
  function ErrorResponse(x) {
    if (query) {
      (query.cursorFn || query.describeFirst) && write(Sync);
      errorResponse = Errors.postgres(parseError(x));
    } else {
      errored(Errors.postgres(parseError(x)));
    }
  }
  function retry(q, error2) {
    delete statements[q.signature];
    q.retried = error2;
    execute(q);
  }
  function NotificationResponse(x) {
    if (!onnotify)
      return;
    let index = 9;
    while (x[index++] !== 0) ;
    onnotify(
      x.toString("utf8", 9, index - 1),
      x.toString("utf8", index, x.length - 1)
    );
  }
  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE ? write(Close(query.portal)) : (result = new Result(), write(Execute("", query.cursorRows)));
    } catch (err) {
      write(Sync);
      query.reject(err);
    }
  }
  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }
  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
        stream = null;
      }
    });
    query.resolve(stream);
  }
  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() {
        socket.resume();
      }
    });
    query.resolve(stream);
  }
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() {
        socket.resume();
      },
      /* c8 ignore next 11 */
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }
  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }
  function NoticeResponse(x) {
    onnotice ? onnotice(parseError(x)) : console.log(parseError(x));
  }
  function EmptyQueryResponse() {
  }
  function FunctionCallResponse() {
    errored(Errors.notSupported("FunctionCallResponse"));
  }
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported("NegotiateProtocolVersion"));
  }
  function UnknownMessage(x) {
    console.error("Postgres.js : Unknown Message:", x[0]);
  }
  function UnknownAuth(x, type) {
    console.error("Postgres.js : Unknown Auth:", type);
  }
  function Bind(parameters, types2, statement = "", portal = "") {
    let prev, type;
    bytes_default().B().str(portal + bytes_default.N).str(statement + bytes_default.N).i16(0).i16(parameters.length);
    parameters.forEach((x, i) => {
      if (x === null)
        return bytes_default.i32(4294967295);
      type = types2[i];
      parameters[i] = x = type in options.serializers ? options.serializers[type](x) : "" + x;
      prev = bytes_default.i;
      bytes_default.inc(4).str(x).i32(bytes_default.i - prev - 4, prev);
    });
    bytes_default.i16(0);
    return bytes_default.end();
  }
  function Parse(str, parameters, types2, name = "") {
    bytes_default().P().str(name + bytes_default.N).str(str + bytes_default.N).i16(parameters.length);
    parameters.forEach((x, i) => bytes_default.i32(types2[i] || 0));
    return bytes_default.end();
  }
  function Describe(x, name = "") {
    return bytes_default().D().str(x).str(name + bytes_default.N).end();
  }
  function Execute(portal = "", rows2 = 0) {
    return Buffer.concat([
      bytes_default().E().str(portal + bytes_default.N).i32(rows2).end(),
      Flush
    ]);
  }
  function Close(portal = "") {
    return Buffer.concat([
      bytes_default().C().str("P").str(portal + bytes_default.N).end(),
      bytes_default().S().end()
    ]);
  }
  function StartupMessage() {
    return cancelMessage || bytes_default().inc(4).i16(3).z(2).str(
      Object.entries(Object.assign(
        {
          user,
          database,
          client_encoding: "UTF8"
        },
        options.connection
      )).filter(([, v]) => v).map(([k, v]) => k + bytes_default.N + v).join(bytes_default.N)
    ).z(2).end(0);
  }
}
function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5; i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString("utf8", start + 1, i);
      start = i + 1;
    }
  }
  return error;
}
function md5(x) {
  return crypto2.createHash("md5").update(x).digest("hex");
}
function hmac(key, x) {
  return crypto2.createHmac("sha256", key).update(x).digest();
}
function sha256(x) {
  return crypto2.createHash("sha256").update(x).digest();
}
function xor(a, b2) {
  const length = Math.max(a.length, b2.length);
  const buffer2 = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++)
    buffer2[i] = a[i] ^ b2[i];
  return buffer2;
}
function timer(fn, seconds) {
  seconds = typeof seconds === "function" ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop2, start: noop2 };
  let timer2;
  return {
    cancel() {
      timer2 && (clearTimeout(timer2), timer2 = null);
    },
    start() {
      timer2 && clearTimeout(timer2);
      timer2 = setTimeout(done, seconds * 1e3, arguments);
    }
  };
  function done(args) {
    fn.apply(null, args);
    timer2 = null;
  }
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/subscribe.js
var noop3 = () => {
};
function Subscribe(postgres2, options) {
  const subscribers = /* @__PURE__ */ new Map(), slot = "postgresjs_" + Math.random().toString(36).slice(2), state = {};
  let connection2, stream, ended = false;
  const sql2 = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: async function() {
      if (ended)
        return;
      stream = null;
      state.pid = state.secret = void 0;
      connected(await init(sql2, slot, options.publications));
      subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
    },
    no_subscribe: true
  });
  const end = sql2.end, close = sql2.close;
  sql2.end = async () => {
    ended = true;
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return end();
  };
  sql2.close = async () => {
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return close();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop3, onerror = noop3) {
    event = parseEvent(event);
    if (!connection2)
      connection2 = init(sql2, slot, options.publications);
    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };
    return connection2.then((x) => {
      connected(x);
      onsubscribe();
      stream && stream.on("error", onerror);
      return { unsubscribe, state, sql: sql2 };
    });
  }
  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }
  async function init(sql3, slot2, publications) {
    if (!publications)
      throw new Error("Missing publication names");
    const xs = await sql3.unsafe(
      `CREATE_REPLICATION_SLOT ${slot2} TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    );
    const [x] = xs;
    const stream2 = await sql3.unsafe(
      `START_REPLICATION SLOT ${slot2} LOGICAL ${x.consistent_point} (proto_version '1', publication_names '${publications}')`
    ).writable();
    const state2 = {
      lsn: Buffer.concat(x.consistent_point.split("/").map((x2) => Buffer.from(("00000000" + x2).slice(-8), "hex")))
    };
    stream2.on("data", data);
    stream2.on("error", error);
    stream2.on("close", sql3.close);
    return { stream: stream2, state: xs.state };
    function error(e) {
      console.error("Unexpected error during logical streaming - reconnecting", e);
    }
    function data(x2) {
      if (x2[0] === 119) {
        parse(x2.subarray(25), state2, sql3.options.parsers, handle, options.transform);
      } else if (x2[0] === 107 && x2[17]) {
        state2.lsn = x2.subarray(1, 9);
        pong();
      }
    }
    function handle(a, b2) {
      const path = b2.relation.schema + "." + b2.relation.table;
      call("*", a, b2);
      call("*:" + path, a, b2);
      b2.relation.keys.length && call("*:" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
      call(b2.command, a, b2);
      call(b2.command + ":" + path, a, b2);
      b2.relation.keys.length && call(b2.command + ":" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
    }
    function pong() {
      const x2 = Buffer.alloc(34);
      x2[0] = "r".charCodeAt(0);
      x2.fill(state2.lsn, 1);
      x2.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2e3, 0, 1)) * BigInt(1e3), 25);
      stream2.write(x2);
    }
  }
  function call(x, a, b2) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b2, x));
  }
}
function Time(x) {
  return new Date(Date.UTC(2e3, 0, 1) + Number(x / BigInt(1e3)));
}
function parse(x, state, parsers2, handle, transform) {
  const char = (acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc);
  Object.entries({
    R: (x2) => {
      let i = 1;
      const r = state[x2.readUInt32BE(i)] = {
        schema: x2.toString("utf8", i += 4, i = x2.indexOf(0, i)) || "pg_catalog",
        table: x2.toString("utf8", i + 1, i = x2.indexOf(0, i + 1)),
        columns: Array(x2.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;
      let columnIndex = 0, column;
      while (i < x2.length) {
        column = r.columns[columnIndex++] = {
          key: x2[i++],
          name: transform.column.from ? transform.column.from(x2.toString("utf8", i, i = x2.indexOf(0, i))) : x2.toString("utf8", i, i = x2.indexOf(0, i)),
          type: x2.readUInt32BE(i += 1),
          parser: parsers2[x2.readUInt32BE(i)],
          atttypmod: x2.readUInt32BE(i += 4)
        };
        column.key && r.keys.push(column);
        i += 4;
      }
    },
    Y: () => {
    },
    // Type
    O: () => {
    },
    // Origin
    B: (x2) => {
      state.date = Time(x2.readBigInt64BE(9));
      state.lsn = x2.subarray(1, 9);
    },
    I: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      const { row } = tuples(x2, relation.columns, i += 7, transform);
      handle(row, {
        command: "insert",
        relation
      });
    },
    D: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      handle(
        key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform).row : null,
        {
          command: "delete",
          relation,
          key
        }
      );
    },
    U: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      const xs = key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform) : null;
      xs && (i = xs.i);
      const { row } = tuples(x2, relation.columns, i + 3, transform);
      handle(row, {
        command: "update",
        relation,
        key,
        old: xs && xs.row
      });
    },
    T: () => {
    },
    // Truncate,
    C: () => {
    }
    // Commit
  }).reduce(char, {})[x[0]](x);
}
function tuples(x, columns, xi, transform) {
  let type, column, value;
  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0; i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 ? null : type === 117 ? void 0 : column.parser === void 0 ? x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)) : column.parser.array === true ? column.parser(x.toString("utf8", xi + 5, xi += 4 + x.readUInt32BE(xi))) : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    transform.raw ? row[i] = transform.raw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];
  if (!xs)
    throw new Error("Malformed subscribe pattern: " + x);
  const [, command, path, key] = xs;
  return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key ? "=" + key : "");
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/large.js
import Stream2 from "stream";
function largeObject(sql2, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve, reject) => {
    await sql2.begin(async (sql3) => {
      let finish;
      !oid && ([{ oid }] = await sql3`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql3`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: () => sql3`select lo_close(${fd})`.then(finish),
        tell: () => sql3`select lo_tell64(${fd})`,
        read: (x) => sql3`select loread(${fd}, ${x}) as data`,
        write: (x) => sql3`select lowrite(${fd}, ${x})`,
        truncate: (x) => sql3`select lo_truncate64(${fd}, ${x})`,
        seek: (x, whence = 0) => sql3`select lo_lseek64(${fd}, ${x}, ${whence})`,
        size: () => sql3`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };
      resolve(lo);
      return new Promise(async (r) => finish = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream2.Readable({
          highWaterMark,
          async read(size2) {
            const l = size2 > max ? size2 - max : size2;
            max -= size2;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size2)
              this.push(null);
          }
        });
      }
      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
    }).catch(reject);
  });
}

// node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js
Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: (x) => BigInt(x),
    // eslint-disable-line
    serialize: (x) => x.toString()
  }
});
var src_default = Postgres;
function Postgres(a, b2) {
  const options = parseOptions(a, b2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });
  let ending = false;
  const queries = queue_default(), connecting = queue_default(), reserved = queue_default(), closed = queue_default(), ended = queue_default(), open = queue_default(), busy = queue_default(), full = queue_default(), queues = { connecting, reserved, closed, ended, open, busy, full };
  const connections = [...Array(options.max)].map(() => connection_default(options, queues, { onopen, onend, onclose }));
  const sql2 = Sql(handler);
  Object.assign(sql2, {
    get parameters() {
      return options.parameters;
    },
    largeObject: largeObject.bind(null, sql2),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });
  return sql2;
  function Sql(handler2) {
    handler2.debug = options.debug;
    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc;
    }, typed);
    Object.assign(sql3, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json,
      file
    });
    return sql3;
    function typed(value, type) {
      return new Parameter(value, type);
    }
    function sql3(strings, ...args) {
      const query = strings && Array.isArray(strings.raw) ? new Query(strings, args, handler2, cancel) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
      return query;
    }
    function unsafe(string, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([string], args, handler2, cancel, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    function file(path, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([], args, (query2) => {
        fs.readFile(path, "utf8", (err, string) => {
          if (err)
            return query2.reject(err);
          query2.strings = [string];
          handler2(query2);
        });
      }, cancel, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
  }
  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };
    const sql3 = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name2, { listeners }]) => {
          delete listen.channels[name2];
          Promise.all(listeners.map((l) => listen(name2, l.fn, l.onlisten).catch(() => {
          })));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach((l) => l.fn(x));
      }
    }));
    const channels = listen.channels || (listen.channels = {}), exists = name in channels;
    if (exists) {
      channels[name].listeners.push(listener);
      const result2 = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result2.state, unlisten };
    }
    channels[name] = { result: sql3`listen ${sql3.unsafe('"' + name.replace(/"/g, '""') + '"')}`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten };
    async function unlisten() {
      if (name in channels === false)
        return;
      channels[name].listeners = channels[name].listeners.filter((x) => x !== listener);
      if (channels[name].listeners.length)
        return;
      delete channels[name];
      return sql3`unlisten ${sql3.unsafe('"' + name.replace(/"/g, '""') + '"')}`;
    }
  }
  async function notify(channel, payload) {
    return await sql2`select pg_notify(${channel}, ${"" + payload})`;
  }
  async function reserve() {
    const queue = queue_default();
    const c = open.length ? open.shift() : await new Promise((resolve, reject) => {
      const query = { reserve: resolve, reject };
      queries.push(query);
      closed.length && connect(closed.shift(), query);
    });
    move(c, reserved);
    c.reserved = () => queue.length ? c.execute(queue.shift()) : move(c, reserved);
    c.reserved.release = true;
    const sql3 = Sql(handler2);
    sql3.release = () => {
      c.reserved = null;
      onopen(c);
    };
    return sql3;
    function handler2(q) {
      c.queue === full ? queue.push(q) : c.execute(q) || move(c, full);
    }
  }
  async function begin(options2, fn) {
    !fn && (fn = options2, options2 = "");
    const queries2 = queue_default();
    let savepoints = 0, connection2, prepare = null;
    try {
      await sql2.unsafe("begin " + options2.replace(/[^a-z ]/ig, ""), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection2, fn),
        new Promise((_, reject) => connection2.onclose = reject)
      ]);
    } catch (error) {
      throw error;
    }
    async function scope(c, fn2, name) {
      const sql3 = Sql(handler2);
      sql3.savepoint = savepoint;
      sql3.prepare = (x) => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError, result;
      name && await sql3`savepoint ${sql3(name)}`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn2(sql3);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });
        if (uncaughtError)
          throw uncaughtError;
      } catch (e) {
        await (name ? sql3`rollback to ${sql3(name)}` : sql3`rollback`);
        throw e instanceof PostgresError && e.code === "25P02" && uncaughtError || e;
      }
      if (!name) {
        prepare ? await sql3`prepare transaction '${sql3.unsafe(prepare)}'` : await sql3`commit`;
      }
      return result;
      function savepoint(name2, fn3) {
        if (name2 && Array.isArray(name2.raw))
          return savepoint((sql4) => sql4.apply(sql4, arguments));
        arguments.length === 1 && (fn3 = name2, name2 = null);
        return scope(c, fn3, "s" + savepoints++ + (name2 ? "_" + name2 : ""));
      }
      function handler2(q) {
        q.catch((e) => uncaughtError || (uncaughtError = e));
        c.queue === full ? queries2.push(q) : c.execute(q) || move(c, full);
      }
    }
    function onexecute(c) {
      connection2 = c;
      move(c, reserved);
      c.reserved = () => queries2.length ? c.execute(queries2.shift()) : move(c, reserved);
    }
  }
  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open ? c.idleTimer.start() : c.idleTimer.cancel();
    return c;
  }
  function json(x) {
    return new Parameter(x, 3802);
  }
  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments));
    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap);
  }
  function handler(query) {
    if (ending)
      return query.reject(Errors.connection("CONNECTION_ENDED", options, options));
    if (open.length)
      return go(open.shift(), query);
    if (closed.length)
      return connect(closed.shift(), query);
    busy.length ? go(busy.shift(), query) : queries.push(query);
  }
  function go(c, query) {
    return c.execute(query) ? move(c, busy) : move(c, full);
  }
  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state ? query.active ? connection_default(options).cancel(query.state, resolve, reject) : query.cancelled = { resolve, reject } : (queries.remove(query), query.cancelled = true, query.reject(Errors.generic("57014", "canceling statement due to user request")), resolve());
    });
  }
  async function end({ timeout = null } = {}) {
    if (ending)
      return ending;
    await 1;
    let timer2;
    return ending = Promise.race([
      new Promise((r) => timeout !== null && (timer2 = setTimeout(destroy, timeout * 1e3, r))),
      Promise.all(connections.map((c) => c.end()).concat(
        listen.sql ? listen.sql.end({ timeout: 0 }) : [],
        subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []
      ))
    ]).then(() => clearTimeout(timer2));
  }
  async function close() {
    await Promise.all(connections.map((c) => c.end()));
  }
  async function destroy(resolve) {
    await Promise.all(connections.map((c) => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection("CONNECTION_DESTROYED", options));
    resolve();
  }
  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c;
  }
  function onend(c) {
    move(c, ended);
  }
  function onopen(c) {
    if (queries.length === 0)
      return move(c, open);
    let max = Math.ceil(queries.length / (connecting.length + 1)), ready = true;
    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c);
      ready = c.execute(query);
    }
    ready ? move(c, busy) : move(c, full);
  }
  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
}
function parseOptions(a, b2) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b2 : a) || {}, { url, multihost } = parseUrl(a), query = [...url.searchParams].reduce((a2, [b3, c]) => (a2[b3] = c, a2), {}), host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || "localhost", port = o.port || url.port || env.PGPORT || 5432, user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query.sslrootcert === "system" && (query.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive"];
  const defaults = {
    max: globalThis.Cloudflare ? 3 : 10,
    ssl: false,
    sslnegotiation: null,
    idle_timeout: null,
    connect_timeout: 30,
    max_lifetime,
    max_pipeline: 100,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    publications: "alltables",
    target_session_attrs: null
  };
  return {
    host: Array.isArray(host) ? host : host.split(",").map((x) => x.split(":")[0]),
    port: Array.isArray(port) ? port : host.split(",").map((x) => parseInt(x.split(":")[1] || port)),
    path: o.path || host.indexOf("/") > -1 && host + "/.s.PGSQL." + port,
    database: o.database || o.db || (url.pathname || "").slice(1) || env.PGDATABASE || user,
    user,
    pass: o.pass || o.password || url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce(
      (acc, [k, d]) => {
        const value = k in o ? o[k] : k in query ? query[k] === "disable" || query[k] === "false" ? false : query[k] : env["PG" + k.toUpperCase()] || d;
        acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
        return acc;
      },
      {}
    ),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    transform: parseTransform(o.transform || { undefined: void 0 }),
    parameters: {},
    shared: { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  };
}
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: /* @__PURE__ */ new Map() } };
  let host = url;
  host = host.slice(host.indexOf("://") + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf("@") + 1));
  const urlObj = new URL(url.replace(host, host.split(",")[0]));
  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(",") > -1 && host
  };
}
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}

// drizzle/schema.ts
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  serial
} from "drizzle-orm/pg-core";
var userRoleEnum = pgEnum("user_role", ["user", "admin"]);
var resellerTypeEnum = pgEnum("reseller_type", ["credits", "percentage"]);
var resellerStatusEnum = pgEnum("reseller_status", ["active", "inactive", "banned"]);
var appStatusEnum = pgEnum("app_status", ["active", "inactive"]);
var planLevelEnum = pgEnum("plan_level", ["basic", "premium", "lifetime"]);
var keyStatusEnum = pgEnum("key_status", ["active", "used", "revoked", "expired"]);
var transactionTypeEnum = pgEnum("transaction_type", ["add", "deduct", "purchase"]);
var pixPaymentStatusEnum = pgEnum("pix_payment_status", ["pending", "paid", "expired", "refunded", "cancelled"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var resellers = pgTable("resellers", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  credits: decimal("credits", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalPurchases: integer("totalPurchases").default(0).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("35.00").notNull(),
  resellerType: resellerTypeEnum("resellerType").default("credits").notNull(),
  status: resellerStatusEnum("status").default("active").notNull(),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt")
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 32 }).default("v1.0"),
  categoryId: integer("categoryId").references(() => categories.id),
  status: appStatusEnum("status").default("active").notNull(),
  maxUsers: integer("maxUsers").default(5e3),
  features: text("features"),
  // JSON string of feature list
  keyauthSellerKey: varchar("keyauthSellerKey", { length: 64 }),
  // KeyAuth Seller API Key for this app
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => apps.id),
  name: varchar("name", { length: 64 }).notNull(),
  // e.g. "Daily", "Weekly", "Monthly", "Lifetime"
  durationDays: integer("durationDays").notNull(),
  // 1, 7, 30, 9999
  priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }).notNull(),
  pricePercentage: decimal("pricePercentage", { precision: 10, scale: 2 }).default("0.00").notNull(),
  level: planLevelEnum("level").default("basic").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var resellerApps = pgTable("reseller_apps", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  appId: integer("appId").notNull().references(() => apps.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull()
});
var licenseKeys = pgTable("license_keys", {
  id: serial("id").primaryKey(),
  keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  appId: integer("appId").notNull().references(() => apps.id),
  planId: integer("planId").references(() => subscriptionPlans.id),
  planName: varchar("planName", { length: 64 }),
  durationDays: integer("durationDays").notNull(),
  creditsSpent: decimal("creditsSpent", { precision: 10, scale: 2 }).notNull(),
  status: keyStatusEnum("status").default("active").notNull(),
  usedBy: varchar("usedBy", { length: 128 }),
  // username who activated
  hwid: varchar("hwid", { length: 255 }),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  note: text("note"),
  customMask: varchar("customMask", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var pixPayments = pgTable("pix_payments", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  paymentId: varchar("paymentId", { length: 128 }).notNull().unique(),
  // psc_...
  amountCents: integer("amountCents").notNull(),
  credits: decimal("credits", { precision: 10, scale: 2 }).notNull(),
  // credits to add
  status: pixPaymentStatusEnum("status").notNull().default("pending"),
  brCode: text("brCode"),
  qrCodeImage: text("qrCodeImage"),
  expiresAt: timestamp("expiresAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var ipWhitelist = pgTable("ip_whitelist", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull(),
  label: varchar("label", { length: 128 }),
  userType: varchar("userType", { length: 32 }).notNull().default("admin"),
  userId: integer("userId"),
  // null = any admin; for reseller = reseller.id
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
        const client = src_default(connectionString, sslRequired ? { ssl: "require" } : {});
        _db = drizzle(client);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}
async function getAdminByUsername(username) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createAdmin(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(admins).values(data);
}
async function getAdminById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getResellerByUsername(username) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resellers).where(eq(resellers.username, username)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getResellerById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resellers).where(eq(resellers.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllResellers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellers).orderBy(desc(resellers.createdAt));
}
async function createReseller(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(resellers).values(data);
}
async function updateReseller(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set(data).where(eq(resellers.id, id));
}
async function updateResellerCredits(id, newCredits, newPurchases, newDiscount) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set({
    credits: newCredits,
    totalPurchases: newPurchases,
    discountPercent: newDiscount
  }).where(eq(resellers.id, id));
}
async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}
async function updateCategory(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}
async function deleteCategory(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(eq(categories.id, id));
}
async function getAllApps() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apps).orderBy(desc(apps.createdAt));
}
async function getAppById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createApp(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apps).values(data);
  return result;
}
async function updateApp(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(apps).set(data).where(eq(apps.id, id));
}
async function deleteApp(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.appId, id));
  for (const plan of plans) {
    await db.delete(licenseKeys).where(eq(licenseKeys.planId, plan.id));
  }
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.appId, id));
  await db.delete(resellerApps).where(eq(resellerApps.appId, id));
  await db.delete(apps).where(eq(apps.id, id));
}
async function getPlansByAppId(appId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.appId, appId));
}
async function getPlanById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createPlan(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(subscriptionPlans).values(data);
}
async function updatePlan(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
}
async function deletePlan(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(licenseKeys).where(eq(licenseKeys.planId, id));
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
}
async function getAppsByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ app: apps, assignedAt: resellerApps.assignedAt }).from(resellerApps).innerJoin(apps, eq(resellerApps.appId, apps.id)).where(eq(resellerApps.resellerId, resellerId));
  return rows;
}
async function assignAppToReseller(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(resellerApps).where(and(eq(resellerApps.resellerId, data.resellerId), eq(resellerApps.appId, data.appId))).limit(1);
  if (existing.length > 0) return;
  await db.insert(resellerApps).values(data);
}
async function removeAppFromReseller(resellerId, appId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(resellerApps).where(and(eq(resellerApps.resellerId, resellerId), eq(resellerApps.appId, appId)));
}
async function getAssignedAppIds(resellerId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ appId: resellerApps.appId }).from(resellerApps).where(eq(resellerApps.resellerId, resellerId));
  return rows.map((r) => r.appId);
}
async function getKeysByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).where(eq(licenseKeys.resellerId, resellerId)).orderBy(desc(licenseKeys.createdAt));
}
async function getAllKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}
async function getKeyById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createLicenseKey(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(licenseKeys).values(data);
}
async function updateLicenseKey(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(licenseKeys).set(data).where(eq(licenseKeys.id, id));
}
async function getTransactionsByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.resellerId, resellerId)).orderBy(desc(creditTransactions.createdAt)).limit(50);
}
async function createCreditTransaction(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(creditTransactions).values(data);
}
function normalizeIp(raw) {
  if (!raw) return "";
  const s = raw.trim();
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (s === "::1" || s === "0:0:0:0:0:0:0:1") return "127.0.0.1";
  return s;
}
async function getAllIpWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt));
}
async function addIpToWhitelist(ip, label, userType = "admin", userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const normalized = normalizeIp(ip);
  await db.insert(ipWhitelist).values({
    ip: normalized,
    label: label || null,
    userType,
    userId: userId ?? null
  });
}
async function removeIpFromWhitelist(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id));
}
async function isAdminIpAllowed(rawIp) {
  const db = await getDb();
  if (!db) return true;
  const ip = normalizeIp(rawIp);
  const adminEntries = await db.select().from(ipWhitelist).where(eq(ipWhitelist.userType, "admin"));
  if (adminEntries.length === 0) return true;
  return adminEntries.some((e) => normalizeIp(e.ip) === ip);
}
async function isResellerIpAllowed(rawIp, resellerId) {
  const db = await getDb();
  if (!db) return true;
  const ip = normalizeIp(rawIp);
  const entries = await db.select().from(ipWhitelist).where(
    and(eq(ipWhitelist.userType, "reseller"), eq(ipWhitelist.userId, resellerId))
  );
  if (entries.length === 0) return true;
  return entries.some((e) => normalizeIp(e.ip) === ip);
}
async function createPixPayment(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(pixPayments).values(data).returning();
  return row;
}
async function getPixPaymentByPaymentId(paymentId) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(pixPayments).where(eq(pixPayments.paymentId, paymentId));
  return row ?? null;
}
async function getPixPaymentsByReseller(resellerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pixPayments).where(eq(pixPayments.resellerId, resellerId)).orderBy(desc(pixPayments.createdAt)).limit(20);
}
async function updateAdminPassword(id, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
}
async function updateResellerPassword(id, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set({ passwordHash }).where(eq(resellers.id, id));
}

// server/routers.ts
var JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "cv-reseller-secret-key-2024");
var CUSTOM_COOKIE = "cv_session";
function getClientIp(req) {
  const h = req.headers;
  const candidates = [
    h["cf-connecting-ip"] || "",
    h["true-client-ip"] || "",
    h["x-real-ip"] || "",
    (h["x-forwarded-for"] || "").split(",")[0].trim(),
    h["x-client-ip"] || "",
    req.socket?.remoteAddress || ""
  ];
  const raw = candidates.find((c) => c && c.length > 0) || "";
  return normalizeIp(raw);
}
function generateKeyValue(prefix, mask) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const rand = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  if (mask) {
    return mask.replace(/X/gi, () => chars[Math.floor(Math.random() * chars.length)]);
  }
  return `${rand(6)}-${rand(6)}-${rand(6)}`;
}
function calcDiscount(totalPurchases) {
  if (totalPurchases >= 20) return 50;
  if (totalPurchases >= 10) return 40;
  return 35;
}
var KEYAUTH_SELLER_KEY = process.env.KEYAUTH_SELLER_KEY || "dd1d4c88ede441586316b84e6c71dac7";
async function keyauthCreateLicense(opts) {
  const expiry = opts.durationDays >= 9e3 ? 0 : opts.durationDays;
  const mask = "XXXX-XXXX-XXXX-XXXX";
  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", opts.sellerKey);
  url.searchParams.set("type", "add");
  url.searchParams.set("format", "json");
  url.searchParams.set("expiry", String(expiry));
  url.searchParams.set("mask", mask);
  url.searchParams.set("amount", String(opts.quantity));
  if (opts.owner) url.searchParams.set("owner", opts.owner);
  if (opts.note) url.searchParams.set("note", opts.note);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.success) {
    console.error("[KeyAuth] Failed to create license:", data.message);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `KeyAuth: ${data.message}` });
  }
  if (opts.quantity === 1) {
    return [data.key];
  }
  return data.keys;
}
async function keyauthResetHwid(sellerKey, username) {
  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", sellerKey);
  url.searchParams.set("type", "resetuser");
  url.searchParams.set("user", username);
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.success) {
    console.warn("[KeyAuth] HWID reset warning:", data.message);
  }
}
async function signCustomJwt(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET);
}
async function verifyCustomJwt(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
function getCustomToken(req) {
  const cookieHeader = req.headers?.cookie || "";
  const match = cookieHeader.match(new RegExp(`${CUSTOM_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
var authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  adminLogin: publicProcedure.input(z2.object({ username: z2.string(), password: z2.string() })).mutation(async ({ input, ctx }) => {
    const clientIp = getClientIp(ctx.req);
    const ipAllowed = await isAdminIpAllowed(clientIp);
    if (!ipAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP n\xE3o autorizado" });
    const admin = await getAdminByUsername(input.username);
    if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const valid = await bcryptjs_default.compare(input.password, admin.passwordHash);
    if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const token = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
    ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
    return { success: true, role: "admin", username: admin.username };
  }),
  resellerLogin: publicProcedure.input(z2.object({ username: z2.string(), password: z2.string() })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminByUsername(input.username);
    if (admin) {
      const validAdmin = await bcryptjs_default.compare(input.password, admin.passwordHash);
      if (validAdmin) {
        const clientIp = getClientIp(ctx.req);
        const ipAllowed = await isAdminIpAllowed(clientIp);
        if (!ipAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP n\xE3o autorizado" });
        const token2 = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
        ctx.res.cookie(CUSTOM_COOKIE, token2, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
        return { success: true, role: "admin", username: admin.username };
      }
    }
    const reseller = await getResellerByUsername(input.username);
    if (!reseller) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    if (reseller.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada" });
    const valid = await bcryptjs_default.compare(input.password, reseller.passwordHash);
    if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const resellerIp = getClientIp(ctx.req);
    const resellerIpAllowed = await isResellerIpAllowed(resellerIp, reseller.id);
    if (!resellerIpAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP n\xE3o autorizado para este reseller" });
    await updateReseller(reseller.id, { lastLoginAt: /* @__PURE__ */ new Date() });
    const token = await signCustomJwt({ sub: String(reseller.id), role: "reseller", username: reseller.username });
    ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
    return { success: true, role: "reseller", username: reseller.username };
  }),
  // Returns the real IP the server sees for this request (used by admin whitelist UI)
  getMyIp: publicProcedure.query(({ ctx }) => {
    const ip = getClientIp(ctx.req);
    return { ip };
  }),
  session: publicProcedure.query(async ({ ctx }) => {
    const token = getCustomToken(ctx.req);
    if (!token) return null;
    const payload = await verifyCustomJwt(token);
    if (!payload) return null;
    const id = parseInt(payload.sub);
    if (payload.role === "admin") {
      const admin = await getAdminById(id);
      if (!admin) return null;
      return { id: admin.id, username: admin.username, role: "admin" };
    } else {
      const reseller = await getResellerById(id);
      if (!reseller) return null;
      return {
        id: reseller.id,
        username: reseller.username,
        role: "reseller",
        credits: reseller.credits,
        discountPercent: reseller.discountPercent,
        totalPurchases: reseller.totalPurchases,
        status: reseller.status
      };
    }
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(CUSTOM_COOKIE, getSessionCookieOptions(ctx.req));
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
  // Bootstrap: create first admin if none exists
  setupAdmin: publicProcedure.input(z2.object({ username: z2.string().min(3), password: z2.string().min(6), setupKey: z2.string() })).mutation(async ({ input }) => {
    if (input.setupKey !== "CV-SETUP-2024") throw new TRPCError({ code: "FORBIDDEN", message: "Chave de setup inv\xE1lida" });
    const existing = await getAdminByUsername(input.username);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Admin j\xE1 existe" });
    const passwordHash = await bcryptjs_default.hash(input.password, 10);
    await createAdmin({ username: input.username, passwordHash });
    return { success: true };
  })
});
var adminProcedure2 = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, adminId: parseInt(payload.sub) } });
});
var resellerProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "reseller") throw new TRPCError({ code: "FORBIDDEN" });
  const resellerId = parseInt(payload.sub);
  const reseller = await getResellerById(resellerId);
  if (!reseller || reseller.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada" });
  return next({ ctx: { ...ctx, resellerId, reseller } });
});
var adminRouter = router({
  // Resellers
  listResellers: adminProcedure2.query(async () => {
    const list = await getAllResellers();
    return list.map((r) => ({ ...r, passwordHash: void 0 }));
  }),
  createReseller: adminProcedure2.input(z2.object({
    username: z2.string().min(3).max(64),
    password: z2.string().min(6),
    email: z2.string().email().optional(),
    location: z2.string().optional(),
    resellerType: z2.enum(["credits", "percentage"]).default("credits")
  })).mutation(async ({ input }) => {
    const existing = await getResellerByUsername(input.username);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username j\xE1 existe" });
    const passwordHash = await bcryptjs_default.hash(input.password, 10);
    await createReseller({ username: input.username, passwordHash, email: input.email, location: input.location, resellerType: input.resellerType });
    return { success: true };
  }),
  updateReseller: adminProcedure2.input(z2.object({
    id: z2.number(),
    email: z2.string().email().optional().nullable(),
    location: z2.string().optional().nullable(),
    status: z2.enum(["active", "inactive", "banned"]).optional(),
    password: z2.string().min(6).optional(),
    resellerType: z2.enum(["credits", "percentage"]).optional()
  })).mutation(async ({ input }) => {
    const { id, password, ...rest } = input;
    const data = { ...rest };
    if (password) data.passwordHash = await bcryptjs_default.hash(password, 10);
    await updateReseller(id, data);
    return { success: true };
  }),
  addCredits: adminProcedure2.input(z2.object({ resellerId: z2.number(), amount: z2.number().positive(), description: z2.string().optional() })).mutation(async ({ input }) => {
    const reseller = await getResellerById(input.resellerId);
    if (!reseller) throw new TRPCError({ code: "NOT_FOUND" });
    const before = parseFloat(reseller.credits);
    const after = before + input.amount;
    await updateReseller(input.resellerId, { credits: after.toFixed(2) });
    await createCreditTransaction({
      resellerId: input.resellerId,
      type: "add",
      amount: input.amount.toFixed(2),
      balanceBefore: before.toFixed(2),
      balanceAfter: after.toFixed(2),
      description: input.description || "Cr\xE9ditos adicionados pelo admin"
    });
    return { success: true, newBalance: after };
  }),
  // Categories
  listCategories: adminProcedure2.query(() => getAllCategories()),
  createCategory: adminProcedure2.input(z2.object({ name: z2.string().min(2), description: z2.string().optional() })).mutation(async ({ input }) => {
    await createCategory(input);
    return { success: true };
  }),
  updateCategory: adminProcedure2.input(z2.object({ id: z2.number(), name: z2.string().min(2).optional(), description: z2.string().optional() })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateCategory(id, data);
    return { success: true };
  }),
  deleteCategory: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteCategory(input.id);
    return { success: true };
  }),
  // Apps
  listApps: adminProcedure2.query(() => getAllApps()),
  getApp: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const app = await getAppById(input.id);
    if (!app) throw new TRPCError({ code: "NOT_FOUND" });
    const plans = await getPlansByAppId(input.id);
    return { ...app, plans };
  }),
  createApp: adminProcedure2.input(z2.object({
    name: z2.string().min(2),
    description: z2.string().optional(),
    version: z2.string().optional(),
    categoryId: z2.number().optional(),
    maxUsers: z2.number().optional(),
    features: z2.string().optional(),
    keyauthSellerKey: z2.string().length(32).optional()
  })).mutation(async ({ input }) => {
    await createApp(input);
    return { success: true };
  }),
  updateApp: adminProcedure2.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    description: z2.string().optional(),
    version: z2.string().optional(),
    categoryId: z2.number().optional().nullable(),
    status: z2.enum(["active", "inactive"]).optional(),
    maxUsers: z2.number().optional(),
    features: z2.string().optional(),
    keyauthSellerKey: z2.string().length(32).optional().nullable()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateApp(id, data);
    return { success: true };
  }),
  deleteApp: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteApp(input.id);
    return { success: true };
  }),
  // Plans
  createPlan: adminProcedure2.input(z2.object({
    appId: z2.number(),
    name: z2.string(),
    durationDays: z2.number().positive(),
    priceCredits: z2.number().positive(),
    pricePercentage: z2.number().min(0).optional(),
    level: z2.enum(["basic", "premium", "lifetime"]).optional()
  })).mutation(async ({ input }) => {
    await createPlan({
      ...input,
      priceCredits: input.priceCredits.toFixed(2),
      pricePercentage: (input.pricePercentage ?? 0).toFixed(2)
    });
    return { success: true };
  }),
  updatePlan: adminProcedure2.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    durationDays: z2.number().optional(),
    priceCredits: z2.number().optional(),
    pricePercentage: z2.number().min(0).optional(),
    level: z2.enum(["basic", "premium", "lifetime"]).optional()
  })).mutation(async ({ input }) => {
    const { id, priceCredits, pricePercentage, ...rest } = input;
    const data = { ...rest };
    if (priceCredits !== void 0) data.priceCredits = priceCredits.toFixed(2);
    if (pricePercentage !== void 0) data.pricePercentage = pricePercentage.toFixed(2);
    await updatePlan(id, data);
    return { success: true };
  }),
  deletePlan: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deletePlan(input.id);
    return { success: true };
  }),
  // Assign apps to resellers
  assignApp: adminProcedure2.input(z2.object({ resellerId: z2.number(), appId: z2.number() })).mutation(async ({ input }) => {
    await assignAppToReseller(input);
    return { success: true };
  }),
  removeApp: adminProcedure2.input(z2.object({ resellerId: z2.number(), appId: z2.number() })).mutation(async ({ input }) => {
    await removeAppFromReseller(input.resellerId, input.appId);
    return { success: true };
  }),
  getResellerApps: adminProcedure2.input(z2.object({ resellerId: z2.number() })).query(async ({ input }) => {
    const assigned = await getAssignedAppIds(input.resellerId);
    const all = await getAllApps();
    return { assigned, all };
  }),
  // All keys
  listAllKeys: adminProcedure2.query(() => getAllKeys()),
  // IP Whitelist management
  listIpWhitelist: adminProcedure2.query(() => getAllIpWhitelist()),
  addIp: adminProcedure2.input(z2.object({
    ip: z2.string().min(1),
    label: z2.string().optional(),
    userType: z2.enum(["admin", "reseller"]).default("admin"),
    userId: z2.number().optional().nullable()
  })).mutation(async ({ input }) => {
    await addIpToWhitelist(input.ip, input.label, input.userType, input.userId);
    return { success: true };
  }),
  removeIp: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await removeIpFromWhitelist(input.id);
    return { success: true };
  }),
  // Password management
  changeAdminPassword: adminProcedure2.input(z2.object({
    currentPassword: z2.string().min(1),
    newPassword: z2.string().min(6, "Nova senha deve ter pelo menos 6 caracteres")
  })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminById(ctx.adminId);
    if (!admin) throw new TRPCError({ code: "NOT_FOUND" });
    const valid = await bcryptjs_default.compare(input.currentPassword, admin.passwordHash);
    if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
    const newHash = await bcryptjs_default.hash(input.newPassword, 10);
    await updateAdminPassword(admin.id, newHash);
    return { success: true };
  }),
  changeResellerPassword: adminProcedure2.input(z2.object({
    resellerId: z2.number(),
    newPassword: z2.string().min(6, "Nova senha deve ter pelo menos 6 caracteres")
  })).mutation(async ({ input }) => {
    const reseller = await getResellerById(input.resellerId);
    if (!reseller) throw new TRPCError({ code: "NOT_FOUND", message: "Reseller n\xE3o encontrado" });
    const newHash = await bcryptjs_default.hash(input.newPassword, 10);
    await updateResellerPassword(input.resellerId, newHash);
    return { success: true };
  })
});
var resellerRouter = router({
  profile: resellerProcedure.query(async ({ ctx }) => {
    const r = ctx.reseller;
    const purchases = r.totalPurchases;
    const discount = calcDiscount(purchases);
    const nextLevel = purchases < 10 ? { target: 10, discount: 40 } : purchases < 20 ? { target: 20, discount: 50 } : null;
    const transactions = await getTransactionsByResellerId(r.id);
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      location: r.location,
      credits: r.credits,
      discountPercent: discount,
      totalPurchases: purchases,
      resellerType: r.resellerType,
      status: r.status,
      createdAt: r.createdAt,
      lastLoginAt: r.lastLoginAt,
      nextLevel,
      transactions
    };
  }),
  myApps: resellerProcedure.query(async ({ ctx }) => {
    const rows = await getAppsByResellerId(ctx.resellerId);
    const result = await Promise.all(rows.map(async (row) => {
      const plans = await getPlansByAppId(row.app.id);
      return { ...row.app, plans, assignedAt: row.assignedAt };
    }));
    return result;
  }),
  appDetail: resellerProcedure.input(z2.object({ appId: z2.number() })).query(async ({ ctx, input }) => {
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN" });
    const app = await getAppById(input.appId);
    if (!app) throw new TRPCError({ code: "NOT_FOUND" });
    const plans = await getPlansByAppId(input.appId);
    return { ...app, plans };
  }),
  myKeys: resellerProcedure.query(async ({ ctx }) => {
    return getKeysByResellerId(ctx.resellerId);
  }),
  generateKeys: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100),
    customMask: z2.string().optional(),
    note: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const reseller = ctx.reseller;
    if (reseller.resellerType !== "credits") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de cr\xE9ditos" });
    }
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App n\xE3o dispon\xEDvel" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const app = await getAppById(input.appId);
    if (!app) throw new TRPCError({ code: "NOT_FOUND" });
    const discount = parseFloat(reseller.discountPercent);
    const basePrice = parseFloat(plan.priceCredits);
    const discountedPrice = basePrice * (1 - discount / 100);
    const totalCost = discountedPrice * input.quantity;
    const currentCredits = parseFloat(reseller.credits);
    if (currentCredits < totalCost) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Cr\xE9ditos insuficientes. Necess\xE1rio: ${totalCost.toFixed(2)}, Dispon\xEDvel: ${currentCredits.toFixed(2)}` });
    }
    const newCredits = currentCredits - totalCost;
    const newPurchases = reseller.totalPurchases + input.quantity;
    await updateResellerCredits(ctx.resellerId, newCredits.toFixed(2), newPurchases, reseller.discountPercent);
    await createCreditTransaction({
      resellerId: ctx.resellerId,
      type: "deduct",
      amount: totalCost.toFixed(2),
      balanceBefore: currentCredits.toFixed(2),
      balanceAfter: newCredits.toFixed(2),
      description: `Gera\xE7\xE3o de ${input.quantity}x key(s) - ${app.name} (${plan.name})`
    });
    const sellerKey = app.keyauthSellerKey || KEYAUTH_SELLER_KEY;
    let keyauthKeys = null;
    try {
      keyauthKeys = await keyauthCreateLicense({
        sellerKey,
        durationDays: plan.durationDays,
        quantity: input.quantity,
        owner: reseller.username,
        note: input.note || `Zenity Store - ${reseller.username} - ${plan.name}`
      });
    } catch (err) {
      console.error("[KeyAuth] License creation failed, using local key generation:", err);
    }
    const generatedKeys = [];
    for (let i = 0; i < input.quantity; i++) {
      const keyValue = keyauthKeys ? keyauthKeys[i] : generateKeyValue(app.name, input.customMask);
      await createLicenseKey({
        keyValue,
        resellerId: ctx.resellerId,
        appId: input.appId,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: discountedPrice.toFixed(2),
        expiresAt: null,
        note: input.note || null,
        customMask: input.customMask || null
      });
      generatedKeys.push(keyValue);
    }
    return { success: true, keys: generatedKeys, creditsSpent: totalCost, newBalance: newCredits };
  }),
  resetHwid: resellerProcedure.input(z2.object({ keyId: z2.number() })).mutation(async ({ ctx, input }) => {
    const key = await getKeyById(input.keyId);
    if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN" });
    await updateLicenseKey(input.keyId, { hwid: null });
    if (key.usedBy) {
      const app = await getAppById(key.appId);
      const sellerKey = app?.keyauthSellerKey || KEYAUTH_SELLER_KEY;
      try {
        await keyauthResetHwid(sellerKey, key.usedBy);
      } catch (err) {
        console.warn("[KeyAuth] HWID reset failed (non-critical):", err);
      }
    }
    return { success: true };
  }),
  revokeKey: resellerProcedure.input(z2.object({ keyId: z2.number() })).mutation(async ({ ctx, input }) => {
    const key = await getKeyById(input.keyId);
    if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN" });
    if (key.status === "used") throw new TRPCError({ code: "BAD_REQUEST", message: "Key j\xE1 utilizada n\xE3o pode ser revogada" });
    await updateLicenseKey(input.keyId, { status: "revoked" });
    return { success: true };
  }),
  // ─── Pix / Purin Cash ──────────────────────────────────────────────────────
  createPixCharge: resellerProcedure.input(z2.object({
    credits: z2.number().min(1, "M\xEDnimo 1 cr\xE9dito").max(1e4, "M\xE1ximo 10000 cr\xE9ditos")
  })).mutation(async ({ ctx, input }) => {
    const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix n\xE3o configurado" });
    const reseller = ctx.reseller;
    const amountCents = Math.round(input.credits * 100);
    const callbackUrl = `${process.env.VITE_APP_URL || "https://cvreseller-n3qqggx2.manus.space"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `Compra de ${input.credits} cr\xE9dito(s) - ZENITY STORE`,
      callbackUrl,
      customer: {
        name: reseller.username,
        email: reseller.email || `${reseller.username}@zenitystore.com`,
        externalId: String(reseller.id)
      },
      metadata: JSON.stringify({ resellerId: reseller.id, credits: input.credits })
    };
    const response = await fetch("https://api.purincash.com/v1/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PURIN_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] Error creating charge:", err);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobran\xE7a Pix" });
    }
    const data = await response.json();
    const payment = await createPixPayment({
      resellerId: reseller.id,
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      credits: input.credits.toFixed(2),
      status: "pending",
      brCode: data.pix?.brCode || null,
      qrCodeImage: data.pix?.qrCodeImage || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      credits: input.credits,
      brCode: data.pix?.brCode,
      qrCodeImage: data.pix?.qrCodeImage,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  checkPixStatus: resellerProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ ctx, input }) => {
    const payment = await getPixPaymentByPaymentId(input.paymentId);
    if (!payment || payment.resellerId !== ctx.resellerId) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return {
      paymentId: payment.paymentId,
      status: payment.status,
      credits: parseFloat(payment.credits),
      amountCents: payment.amountCents,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt
    };
  }),
  myPixPayments: resellerProcedure.query(async ({ ctx }) => {
    return getPixPaymentsByReseller(ctx.resellerId);
  }),
  // Comprar keys para resellers de porcentagem (sem débito de créditos)
  buyKey: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100)
  })).mutation(async ({ ctx, input }) => {
    const reseller = ctx.reseller;
    if (reseller.resellerType !== "percentage") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de porcentagem" });
    }
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App n\xE3o dispon\xEDvel" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const app = await getAppById(input.appId);
    if (!app) throw new TRPCError({ code: "NOT_FOUND" });
    const discount = calcDiscount(reseller.totalPurchases);
    const basePrice = parseFloat(plan.pricePercentage ?? "0");
    const discountedPrice = basePrice * (1 - discount / 100);
    const totalCost = discountedPrice * input.quantity;
    const newPurchases = reseller.totalPurchases + input.quantity;
    const newDiscount = calcDiscount(newPurchases);
    await updateResellerCredits(ctx.resellerId, reseller.credits, newPurchases, newDiscount.toFixed(2));
    const sellerKey = app.keyauthSellerKey || KEYAUTH_SELLER_KEY;
    let keyauthKeys = null;
    try {
      keyauthKeys = await keyauthCreateLicense({
        sellerKey,
        durationDays: plan.durationDays,
        quantity: input.quantity,
        owner: reseller.username,
        note: `Zenity Store - ${reseller.username} - ${plan.name} - R$ ${totalCost.toFixed(2)}`
      });
    } catch (err) {
      console.error("[KeyAuth] License creation failed, using local key generation:", err);
    }
    const generatedKeys = [];
    for (let i = 0; i < input.quantity; i++) {
      const keyValue = keyauthKeys ? keyauthKeys[i] : generateKeyValue(app.name);
      await createLicenseKey({
        keyValue,
        resellerId: ctx.resellerId,
        appId: input.appId,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: discountedPrice.toFixed(2),
        expiresAt: null,
        note: `Compra via porcentagem - R$ ${totalCost.toFixed(2)}`,
        customMask: null
      });
      generatedKeys.push(keyValue);
    }
    return { success: true, keys: generatedKeys, totalCost, newBalance: reseller.credits };
  })
});
var appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  reseller: resellerRouter
});
export {
  appRouter
};
