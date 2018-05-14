const $ = require('jquery');
const CoreView = require('backbone/core-view');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'routerModel'
];

/**
 * Controller view, managing view state of the groups entry point
 */
module.exports = CoreView.extend({
  events: {
    'click': '_onClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._contentView().render().el);
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._routerModel.model, 'change:view', this._onChangeView);
  },

  _onChangeView: function (model) {
    model.previous('view').clean();
    this.render();
  },

  _contentView: function () {
    return this._routerModel.model.get('view');
  },

  _onClick: function (event) {
    if (!this._isEventTriggeredOutsideOf(event, 'a')) {
      const url = $(event.target).closest('a').attr('href');
      if (this._routerModel.isWithinCurrentRoutes(url)) {
        navigateThroughRouter.apply(this, arguments);
      }
    }
  },

  _isEventTriggeredOutsideOf: function (ev, selector) {
    return $(ev.target).closest(selector).length === 0;
  }
});
