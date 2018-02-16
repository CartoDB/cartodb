var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./user.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

var REQUIRED_OPTS = [
  'username',
  'avatar'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      avatar: this._avatar,
      username: this._username
    }));

    this._initViews();
    return this;
  },

  _initViews: function () {
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-avatar'),
      title: function () {
        return $(this).attr('data-title');
      }
    });

    this.addView(tooltip);
  }
});
