var cdb = require('cartodb.js');
var template = require('./analysis-controls.tpl');

/**
 * View representing the apply button for a form
 */
module.exports = cdb.core.View.extend({

  className: 'Options-bar',

  events: {
    'click .js-save': '_onSaveClicked'
  },

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');

    this._formModel = opts.formModel;

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
    if (!this._formModel.isValid()) return;

    this._formModel.save();
  }

});
