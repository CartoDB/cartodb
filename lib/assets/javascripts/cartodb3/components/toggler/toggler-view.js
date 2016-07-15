var CoreView = require('backbone/core-view');
var template = require('./toggler.tpl');

module.exports = CoreView.extend({

  className: 'Toggle',

  events: {
    'click .js-input': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel should be provided');

    this._editorModel = opts.editorModel;
    this._labelsArray = opts.labels;
    this._isDisableable = opts.isDisableable;

    this.listenTo(this._editorModel, 'change:edition', this.render);
    this.listenTo(this._editorModel, 'change:disabled', this.render);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var checked = this._editorModel.get('edition');
    var disabled = this._editorModel.get('disabled') && this._isDisableable;

    var _template = template({
      labels: this._labelsArray,
      checked: checked,
      disabled: disabled
    });

    this.$el.append(_template);
    return this;
  },

  _onClick: function () {
    var checked = this._editorModel.get('edition');
    this._editorModel.set({ edition: !checked });
  }
});
