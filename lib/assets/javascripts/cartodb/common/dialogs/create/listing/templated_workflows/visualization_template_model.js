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
    this.state = new cdb.core.Model();
    this.validationError = '';
    this._initBinds();
    this._validate(this.attributes, { validate: true});
    this._setModel();
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
    var templateCode = attrs.code;
    var name = attrs.name;

    if (!name) {
      return "Template name not provided"
    }

    if (!attrs.code) {
      return name + ": template code not provided"
    }

    // Evaluate code
    try {
      var code = eval("a = " + templateCode);
    } catch(e) {
      return name + ": template code error \n " + e
    }

    // - onStepFinished should be present
    if (!code.onStepFinished) {
      return name + ": 'onStepFinished' template function should be defined";
    }
    // - onWizardFinished should be present
    if (!code.onWizardFinished) {
      return name + ": 'onWizardFinished' template function should be defined";
    }

    // - getStep should be present
    if (!code.getStep) {
      return name + ": 'getStep' template function should be defined";
    }

    // - getSteps should be present
    if (!code.getSteps) {
      return name + ": 'getSteps' template function should be defined";
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
    var code = eval("a = " + this.get('code'));
    _.extend(this, code);
  },

  setCurrentStepModel: function(mdl) {
    this._currentStepModel = mdl;
  },

  getError: function() {
    return this.validationError;
  },

  validateStep: function() {
    return this._currentStepModel && this._currentStepModel.validate();
  }

})