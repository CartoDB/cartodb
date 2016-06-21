var CoreView = require('backbone/core-view');
var template = require('./analysis-controls.tpl');

/**
 * View representing the apply button for a form
 */
module.exports = CoreView.extend({

  className: 'Options-bar Options-bar--right u-flex',

  events: {
    'click .js-save': '_onSaveClicked'
  },

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');
    if (!opts.userActions) throw new Error('userActions is required');

    this._formModel = opts.formModel;
    this._userActions = opts.userActions;

    this._formModel.on('change', this.render, this);
    this.add_related_model(this._formModel);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    return template({
      label: this._formModel.get('persisted')
        ? _t('editor.layers.analysis-form.apply-btn')
        : _t('editor.layers.analysis-form.create-btn'),
      isDisabled: !this._formModel.isValid()
    });
  },

  _onSaveClicked: function () {
    if (this._formModel.isValid()) {
      this._userActions.updateOrCreateAnalysis(this._formModel);
    }
  }

});
