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

  url: '/api/v1/templates',

  defaults: {
    source_visualization_id: '',
    name: 'Map template',
    description: '',
    times_used: 0,
    code: '',
    related_tables: [],
    selected: false
  },

  // Valid methods or functions or variables
  // within javascript code
  _VALID_FUNCTIONS: [
    'onStepFinished',
    'onWizardFinished',
    'getStep',
    'getStepNames'
  ],

  initialize: function(attrs) {
    this.validationError = '';
    this._initBinds();
    this._validate();
    this._setModel();
  },

  _validate: function(attrs, options) {
    options = options || {};
    var valid = cdb.core.Model.prototype._validate.apply(this, [ attrs, options ]);
    // This follows Backbone way about how to validate a model
    if (valid) {
      this.trigger('valid')
      return true;
    } else {
      return false;
    }
  },

  validate: function(attrs) {
    if (!attrs) return;
    var templateCode = attrs.code;
    var name = attrs.name;

    if (!attrs.code) {
      return name + ": template code not provided"
    }

    // Evaluate code
    try {
      var code = eval("_cdbTemplate = " + templateCode);
    } catch(e) {
      return name + ": template code error \n " + e
    }

    // Validate code methods
    for(var i = 0, l = this._VALID_FUNCTIONS.length; i < l; i++) {
      var method = this._VALID_FUNCTIONS[i];
      if (!code[method]) {
        return name + ": '" + method + "' template function should be defined";  
      }
    }
  },

  _initBinds: function() {
    this.bind('change:code', this._setModel, this);
    this.bind('valid', function() {
      this.validationError = '';
    }, this);
    this.bind('error', function(m, error) {
      this.validationError = error;
      // Show error in console
      cdb.log.info(this.validationError);
    }, this);
  },

  _setModel: function() {
    var code = eval("_cdbTemplate = " + this.get('code'));
    // TODO: pick only valid methods + steps?
    _.extend(this, code);
  },

  getError: function() {
    return this.validationError;
  }

})