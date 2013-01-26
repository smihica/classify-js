/*
  copyright (c) smihica.
  Mit license
*/
(function(window) {

  function randomAscii(len) {
    for(var rt='';0<len;len--) rt += String.fromCharCode(32+Math.round(Math.random()*94));
    return rt.replace(/'|"|\\/g, '@');
  };

  function ClassifyError(message) {
    Error.apply(this, arguments);
    if (Error.captureStackTrace !== void(0))
      Error.captureStackTrace(this, this.constructor);
    this.message = message;
  };
  ClassifyError.prototype = new Error();

  function createExceptionClass(exceptionClassName) {
    var exceptionClass = function() { ClassifyError.apply(this, arguments); };
    exceptionClass.prototype = new ClassifyError();
    exceptionClass.prototype.name = exceptionClassName;
    return exceptionClass;
  };

  var NotImplemented   = createExceptionClass('NotImplemented');
  var ValueError       = createExceptionClass('ValueError');
  var PropertyError    = createExceptionClass('PropertyError');
  var NotSupported     = createExceptionClass('NotSupported');
  var NotAttached      = createExceptionClass('NotAttached');
  var NotFound         = createExceptionClass('NotFound');
  var AlreadyExists    = createExceptionClass('AlreadyExists');
  var AssertionFailure = createExceptionClass('AssertionFailure');
  var ArgumentError    = createExceptionClass('ArgumentError');
  var DeclarationError = createExceptionClass('DeclarationError');

  // test the obj is atomic or not.
  function _atomic_p(obj) {
    var t;
    return ( obj === null || obj === void(0) ||
             (t = typeof obj) === 'number' ||
             t === 'string' ||
             t === 'boolean' ||
             ((obj.valueOf !== Object.prototype.valueOf) &&
              !(obj instanceof Date)));
  };

  // make deep clone of the object
  function _clone(obj, target) {
    if (_atomic_p(obj)) return obj;

    // if target is given. clone obj properties into it.
    var clone, p;
    if (obj instanceof Date) {
      clone = new Date(obj.getTime());
      if (target instanceof Date) {
        for (p in target) if (target.hasOwnProperty(p)) clone[p] = _clone(target[p], clone[p]);
      }
    } else if (typeof obj === 'function') {
      clone = function(){return obj.apply(this, arguments);};
      if (typeof target === 'function') {
        for (p in target) if (target.hasOwnProperty(p)) clone[p] = _clone(target[p], clone[p]);
      }
    } else {
      clone = (!_atomic_p(target) && typeof target !== 'function') ?
        target : new obj.constructor();
    }

    for (p in obj)
      if (obj.hasOwnProperty(p))
        clone[p] = _clone(obj[p], clone[p]);

    return clone;
  };

  var genclassid = (function() {
    var id = 0;
    return function genclassid() {
      ++id;
      var ret = "ANONYMOUS_CLASS_"+id;
      return ret;
    };
  })();

  var init_instance_origin_props = randomAscii(64);

  function __super__() {
    return this.constructor.__super__.prototype;
  };

  function inherits(_class, parent) {
    _class.__super__ = parent;

    var f = function() {};
    f.prototype = parent.prototype;
    f.prototype.constructor = parent;
    _class.prototype = new f();
    _class.prototype.__super__ = __super__;

    var iiop = _class[init_instance_origin_props];

    _class[init_instance_origin_props] = function(inst) {
      var parent_iiop = parent[init_instance_origin_props];
      if (parent_iiop) parent_iiop(inst);
      iiop(inst);
    };

    return _class;
  };

  function method(_class, name, func) {
    func.__class__ = _class;
    _class.prototype[name] = func;
  };

  function mixin(_class, include) {
    var incproto = include.prototype;
    for (var i in incproto) {
      if (i == 'init') {
        _class.prototype['init@' + include['@CLASSNAME']] = incproto[i];
      } else if (i !== "__super__" && i !== "constructor") {
        _class.prototype[i] = incproto[i];
      }
    }

    var iiop = _class[init_instance_origin_props];
    _class[init_instance_origin_props] = function(inst) {
      var include_iiop = include[init_instance_origin_props];
      if (include_iiop) include_iiop(inst);
      iiop(inst);
    };
  };

  function check_interface(_class, impl) {
    for (var i in impl.prototype) {
      if (impl.prototype.hasOwnProperty(i)) {
        if (!_class.prototype.hasOwnProperty(i)) {
          throw new DeclarationError(
            'The class \'' + _class['@CLASSNAME'] +
              '\' must provide property or method \'' + i +
              '\' imposed by \'' + impl['@CLASSNAME'] +'".');
        }
      }
    }
  };

  var userModules = {};
  var classify = function classify(name, definition) {

    if (name instanceof Object && !name instanceof String && definition === void(0)) return classify(genclassid(), name);

    if (!name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/))
      throw new ArgumentError('You give "' + name + '" as class name. But class name must be a valid variable name in JavaScript.');

    var __class__, i, j, l, c, def, type;

    var context = {
      property:   {},
      static:     {},
      method:     {},
      parent:     Object,
      mixin:      [],
      implement:  []
    };

    var userModuleNames = [];
    for (var moduleName in userModules) userModuleNames.push(moduleName);

    for (i in definition) {
      switch (i) {
      case "property":
        def = definition[i];
        for (j in def) context.property[j] = def[j];
        break;
      case "static":
        context.static = definition[i];
        break;
      case "method":
        context.method = definition[i];
        break;
      case "parent":
        context.parent = definition[i];
        break;
      case "mixin":
        context.mixin = definition[i];
        break;
      case "implement":
        context.implement = definition[i];
        break;
      default:
        if (userModules[i]) break;
        throw new ArgumentError(
          'You gave \'' + i + '\' as definition, but the classify() excepts' +
            ' only "property, method, static, parent, mixin, implement'+((0 < userModuleNames.length) ? ', ' + userModuleNames.join(', ') : '')+'".');
      }
    }

    // TODO: support recursive user module.
    for (var moduleName in userModules) {
      var def = null;
      if (def = definition[moduleName]) {
        var fn = userModules[moduleName]
        for (var k in def) {
          context = fn(context, k, def[k]);
        }
      }
    }

    var inner_new_call_identifier = randomAscii(64);
    eval("__class__ = function " + name + "(arg) {" +
      "if (this.constructor === " + name + ") {" +
         name + "['" + init_instance_origin_props + "'](this);" +
         "if (arg !== '" + inner_new_call_identifier + "') " +
         (('init' in context.method) ? "this.init.apply(this, arguments);" : "_clone(arg, this);") +
         "return this;" +
      "}" +
      "var self = new " + name + "('" + inner_new_call_identifier + "');" +
      (('init' in context.method) ? "self.init.apply(self, arguments);" : "_clone(arg, self);") +
      "return self;" +
    "}");

    // TODO optimization.
    __class__[init_instance_origin_props] =
      function(inst) {
        for (var p in context.property) {
          inst[p] = _clone(context.property[p]);
        }
      };

    inherits(__class__, context.parent);

    for (j = 0, l = context.mixin.length; j < l; j++) {
      mixin(__class__, context.mixin[j]);
    }

    for (i in context.method) {
      if (context.method.hasOwnProperty(i)) {
        method(__class__, i, context.method[i]);
      }
    }
    __class__.prototype.constructor = __class__;

    __class__['@CLASSNAME'] = name;

    for (j=0, l=context.implement.length; j<l; j++) {
      check_interface(__class__, context.implement[j]);
    }

    for (i in context.static) {
      __class__[i] = context.static[i];
    }

    (typeof context.static['init'] === 'function') && context.static['init'].call(__class__);

    return __class__;
  };

  classify.addModule = function addModule(moduleName, fn) {
    userModules[moduleName] = fn;
  };
  classify.removeModule = function removeModule(moduleName) {
    delete userModules[moduleName];
  };

  classify.error = {
    ClassifyError    : ClassifyError,
    NotImplemented   : NotImplemented,
    ValueError       : ValueError,
    PropertyError    : PropertyError,
    NotSupported     : NotSupported,
    NotAttached      : NotAttached,
    NotFound         : NotFound,
    AlreadyExists    : AlreadyExists,
    AssertionFailure : AssertionFailure,
    ArgumentError    : ArgumentError,
    DeclarationError : DeclarationError
  };

  window.classify = classify;

  // for node.js
  if (window.exports) exports.classify = window.classify;

})(this);