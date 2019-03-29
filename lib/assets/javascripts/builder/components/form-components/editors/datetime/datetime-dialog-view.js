var CoreView = require('backbone/core-view');
var DatetimeEditorView = require('./datetime-editor-view');

module.exports = CoreView.extend({

  className: 'CDB-Box-modal CustomList CustomList--inputs is-visible has-visibility js-datetimePicker',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._datetimeEditorView = new DatetimeEditorView({
      model: this.model
    });
    this.addView(this._datetimeEditorView);
    this.$el.append(this._datetimeEditorView.render().el);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:show', this._onShowChange);
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  _onShowChange: function (mdl, show) {
    if (show) {
      this.$el.show();
      this.$el.removeClass('is-closing').addClass('is-opening');
    } else {
      this.$el.removeClass('is-opening').addClass('is-closing');
      this.$el.hide();
    }
  },

  show: function () {
    this.model.show();
  },

  hide: function () {
    this.model.hide();
  },

  _onDestroy: function () {
    this.hide();
    this.clean();
  }
});
