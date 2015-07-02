var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  Visualization template model
 *
 *  - It will contain the information about
 *  an already created visualization template.
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    visualization_parent_id: '',
    name: 'Map template',
    description: '',
    times_used: 0,
    code: '',
    related_tables: [],
    selected: false
  },

  initialize: function() {
    // this.steps = new Backbone.Collection();
    this.state = new cdb.core.Model();
    this.validationError = '';
    this._initBinds();
    this._setState();
  },

  _validate: function(attrs, options) {
    var valid = cdb.core.Model.prototype._validate.apply(this, arguments);
    if (valid) {
      this.trigger('valid')
      return true;
    } else {
      return false;
    }
  },

  validate: function(attrs) {
    if (!attrs) return;

    if (!attrs.code) {
      return "Template code not provided"
    }

  },

  _initBinds: function() {
    this.bind('change:code', this._setState, this);
    this.bind('valid', function() {
      this.validationError = '';
    }, this);
    this.bind('error', function(m, error) {
      this.validationError = error;
    }, this);
  },

  _setState: function() {
    this.state.attributes = {};
    var tmplCode = this.get('code');

    if (tmplCode) {
      var obj = {};
      _.each(tmplCode.steps, function(d) {
        _.each(d.forms, function(attrs) {
          var form = attrs.form;
          _.each(_.keys(form), function(key, i, f) {
            var props = f[key];
            obj[key] = (props && props.value) || '';
          });
        });
      });
      // It doesn't need to be validated
      this.state.attributes = obj;
    }
  },

  getError: function() {
    return this.validationError;
  },

})