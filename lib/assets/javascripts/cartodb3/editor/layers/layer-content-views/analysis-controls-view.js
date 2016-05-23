var cdb = require('cartodb.js');
var template = require('./analysis-controls.tpl');

/**
 * View representing the apply button for a form
 */
module.exports = cdb.core.View.extend({

  className: 'Toggle-bar',

  events: {
    'click .js-apply': '_onApplyClicked'
  },

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._formModel = opts.formModel;
    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this._formModel.on('change:errors', this.render, this);
    this.add_related_model(this._formModel);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    return template({
      isDisabled: !this._isValid()
    });
  },

  _onApplyClicked: function () {
    if (!this._isValid()) return;
    this._formModel.applyChanges(this._analysisDefinitionNodeModel);
  },

  _isValid: function () {
    return !this._formModel.get('errors');
  }

});
