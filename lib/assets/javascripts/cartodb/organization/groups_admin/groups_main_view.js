var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var navigateThroughRouter = require('../../common/view_helpers/navigate_through_router');

/**
 * Controller view, managing view state of the groups entry point
 */
module.exports = cdb.core.View.extend({

  events: {
    'click': '_onClick'
  },

  initialize: function () {
    _.each(['router'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._contentView().render().el);
    return this;
  },

  _initBinds: function () {
    this.options.router.model.bind('change:view', this._onChangeView, this);
    this.add_related_model(this.options.router.model);
  },

  _onChangeView: function (m) {
    m.previous('view').clean();
    this.render();
  },

  _contentView: function () {
    return this.options.router.model.get('view');
  },

  _onClick: function (e) {
    if (this._isEventTriggeredOutsideOf(e, '.Dialog')) {
      // Clicks outside of any dialog "body" will fire a closeDialogs event
      cdb.god.trigger('closeDialogs');
    }

    if (!this._isEventTriggeredOutsideOf(e, 'a')) {
      var url = $(e.target).closest('a').attr('href');
      if (this.options.router.isWithinCurrentRoutes(url)) {
        navigateThroughRouter.apply(this, arguments);
      }
    }
  },

  _isEventTriggeredOutsideOf: function (ev, selector) {
    return $(ev.target).closest(selector).length === 0;
  }
});
