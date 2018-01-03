var CoreView = require('backbone/core-view');
var _ = require('underscore');
var errorButtonTemplate = require('./widget-error-button-template.tpl');
var errorTextTemplate = require('./widget-error-text-template.tpl');

/**
 * Default widget error view:
 *
 * It will listen or not to dataviewModel changes when first load is done.
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-body is-hidden',

  events: {
    'click .js-refresh': '_onRefreshClick'
  },

  initialize: function (opts) {
    this._title = opts.title;
    this._errorModel = opts.errorModel;

    this.listenTo(this._errorModel, 'change', this._onErrorModelChanged);
  },

  render: function () {
    var error = this._errorModel.get('error');

    if (error) {
      var placeholderTemplate = this._errorModel.get('placeholder');
      var placeholder = _.isFunction(placeholderTemplate) ? placeholderTemplate() : '';
      this.$el.addClass('CDB-Widget--' + error.level);

      var body = error.type
        ? errorTextTemplate({
          placeholder: placeholder,
          error: error.error,
          title: this._title,
          message: error.message,
          refresh: error.refresh
        })
        : errorButtonTemplate({ placeholder: placeholder });

      this.$el.html(body);
    }

    return this;
  },

  _onErrorModelChanged: function () {
    this._reset();

    _.isEmpty(this._errorModel.get('error'))
      ? this.$el.addClass('is-hidden')
      : this.$el.removeClass('is-hidden');

    this.render();
  },

  _onRefreshClick: function () {
    this._errorModel.get('model').refresh();
  },

  _reset: function () {
    this.$el.removeClass('CDB-Widget--alert CDB-Widget--error');
    this.$el.html('');
  }
});
