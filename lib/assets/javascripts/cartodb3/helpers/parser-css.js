var carto = require('carto');
var torque = require('torque.js');
var _ = require('underscore');

var CartoParser = function (cartocss) {
  this.parse_env = null;
  this.ruleset = null;
  if (cartocss) {
    this.parse(cartocss);
  }
};

CartoParser.prototype = {
  // value due to torque
  RESERVED_VARIABLES: ['mapnik-geometry-type', 'points_density', 'points_count', 'src', 'value'],

  parse: function (cartocss) {
    this.parse_env = {
      validation_data: false,
      frames: [],
      errors: [],
      error: function (obj) {
        obj.line = carto.Parser().extractErrorLine(cartocss, obj.index);
        this.errors.push(obj);
      }
    };

    var self = this;
    var ruleset = null;
    var defs = null;

    try {
      // set default reference
      carto.tree.Reference.setData(carto.default_reference.version.latest);
      ruleset = (new carto.Parser(this.parse_env)).parse(cartocss);
    } catch (e) {
      console.log(e);
      // add the style.mss string to match the response from the server
      this.parse_env.errors = this.parseError(['style\.mss' + e.message]);
      return;
    }

    if (ruleset) {
      var existing = {};
      var mapDef;
      var symbolizers;
      var i;
      var j;
      var r;

      this.definitions = defs = ruleset.toList(this.parse_env);

      for (i in defs) {
        if (defs[i].elements.length > 0) {
          if (defs[i].elements[0].value === 'Map') {
            mapDef = defs.splice(i, 1)[0];
          }
        }
      }

      symbolizers = torque.cartocss_reference.version.latest.layer;

      if (mapDef) {
        mapDef.rules.forEach(function (r) {
          var key = r.name;
          var type;
          var element;

          if (!(key in symbolizers)) {
            self.parse_env.error({
              message: 'Rule ' + key + ' not allowed for Map.',
              index: r.index
            });
          } else {
            type = symbolizers[r.name].type;
            element = r.value.value[0].value[0];
            if (!self._checkValidType(element, type)) {
              self.parse_env.error({
                message: 'Expected type ' + type + '.',
                index: r.index
              });
            }
          }
        });
      }

      defs = carto.inheritDefinitions(defs, this.parse_env);
      defs = carto.sortStyles(defs, this.parse_env);

      for (i in defs) {
        for (j in defs[i]) {
          r = defs[i][j];
          if (r && r.toXML) {
            r.toXML(this.parse_env, existing);
          }
        }
      }

      // toList uses parse_env.errors.message to put messages
      if (this.parse_env.errors.message) {
        _(this.parse_env.errors.message.split('\n')).each(function (m) {
          self.parse_env.errors.push(m);
        });
      }
    }

    this.ruleset = ruleset;
    return this;
  },

  _checkValidType: function (e, type) {
    if (['number', 'float'].indexOf(type) > -1) {
      return typeof e.value === 'number';
    } else if (type === 'string') {
      return e.value !== 'undefined' && typeof e.value === 'string';
    } else if (type.constructor === Array) {
      return type.indexOf(e.value) > -1 || e.value === 'linear';
    } else if (type === 'color') {
      return this._checkValidColor(e);
    }
    return true;
  },

  _checkValidColor: function (e) {
    var expectedArguments = {rgb: 3, hsl: 3, rgba: 4, hsla: 4};
    return typeof e.rgb !== 'undefined' || expectedArguments[e.name] === e.args;
  },

  /**
   * gets an array of parse errors from windshaft
   * and returns an array of {line:1, error: 'string'] with user friendly
   * strings. Parses errors in format:
   *
   *  'style.mss:7:2 Invalid code: asdasdasda'
   */
  parseError: function (errors) {
    var parsedErrors = [];
    var i;
    var g;
    var err;

    for (i in errors) {
      err = errors[i];
      if (err && err.length > 0) {
        g = err.match(/.*:(\d+):(\d+)\s*(.*)/);
        if (g) {
          parsedErrors.push({
            line: parseInt(g[1], 10),
            message: g[3]
          });
        } else {
          parsedErrors.push({
            line: null,
            message: err
          });
        }
      }
    }

    // sort by line
    parsedErrors.sort(function (a, b) { return a.line - b.line; });
    parsedErrors = _.uniq(parsedErrors, true, function (a) { return a.line + a.message; });
    return parsedErrors;
  },

  /**
   * return the error list, empty if there were no errors
   */
  errors: function () {
    return this.parse_env ? this.parse_env.errors : [];
  },

  _colorsFromRule: function (rule) {
    function searchRecursiveByType (v, t) {
      var res = [];
      var i;
      var r;
      for (i in v) {
        if (v[i] instanceof t) {
          res.push(v[i]);
        } else if (typeof v[i] === 'object') {
          r = searchRecursiveByType(v[i], t);
          if (r.length) {
            res = res.concat(r);
          }
        }
      }
      return res;
    }
    return searchRecursiveByType(rule.ev(this.parse_env), carto.tree.Color);
  },

  _varsFromRule: function (rule) {
    function searchRecursiveByType (v, t) {
      var res = [];
      var i;
      var r;

      for (i in v) {
        if (v[i] instanceof t) {
          res.push(v[i]);
        } else if (typeof v[i] === 'object') {
          r = searchRecursiveByType(v[i], t);
          if (r.length) {
            res = res.concat(r);
          }
        }
      }
      return res;
    }
    return searchRecursiveByType(rule, carto.tree.Field);
  },

  /**
   * Extract information from the carto using the provided method.
   * */
  _extract: function (method, extractVariables) {
    var self = this;
    var columns = [];
    var definitions;
    var def;
    var d;
    var r;
    var f;
    var k;
    var rule;
    var columnList;
    var filter;
    var filter_key;

    if (this.ruleset) {
      definitions = this.ruleset.toList(this.parse_env);
      for (d in definitions) {
        def = definitions[d];

        if (def.filters) {
          // extract from rules
          for (r in def.rules) {
            rule = def.rules[r];
            columnList = method(this, rule);
            columns = columns.concat(columnList);
          }

          if (extractVariables) {
            for (f in def.filters) {
              filter = def.filters[f];
              for (k in filter) {
                filter_key = filter[k];
                if (filter_key.key && filter_key.key.value) {
                  columns.push(filter_key.key.value);
                }
              }
            }
          }
        }
      }

      return _.reject(_.uniq(columns), function (v) {
        return _.contains(self.RESERVED_VARIABLES, v);
      });
    }
  },

  /**
   * return a list of colors used in cartocss
   */
  colorsUsed: function (opt) {
    // extraction method
    var method = function (self, rule) {
      return _.map(self._colorsFromRule(rule), function (f) {
        return f.rgb;
      });
    };

    var colors = this._extract(method, false);

    if (opt && opt.mode === 'hex') {
      colors = _.map(colors, function (color) {
        return cdb.Utils.rgbToHex(color[0], color[1], color[2]);
      });
    }

    return colors;
  },

  /**
   * return a list of variables used in cartocss
   */
  variablesUsed: function () {
    // extraction method
    var method = function (self, rule) {
      return _.map(self._varsFromRule(rule), function (f) {
        return f.value;
      });
    };

    return this._extract(method, true);
  },

  /**
   * returns the default layer
   */
  getDefaultRules: function () {
    var rules = [];
    var i;
    var def;
    var rulesMap = {};

    for (i = 0; i < this.definitions.length; ++i) {
      def = this.definitions[i];
      // all zooms and default attachment so we don't get conditional variables
      if (def.zoom === 8388607 && _.size(def.filters.filters) === 0 && def.attachment === '__default__') {
        rules = rules.concat(def.rules);
      }
    }

    for (i in rules) {
      var rule = rules[i];
      rulesMap[rule.name] = rule;
    }
    return rulesMap;
  },

  getRuleByName: function (definition, ruleName) {
    if (!definition._rulesByName) {
      var rulesMap = definition._rulesByName = {};
      for (var r in definition.rules) {
        var rule = definition.rules[r];
        rulesMap[rule.name] = rule;
      }
    }
    return definition._rulesByName[ruleName];
  }
};

module.exports = CartoParser;
