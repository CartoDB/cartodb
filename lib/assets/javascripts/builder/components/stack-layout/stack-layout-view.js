var CoreView = require('backbone/core-view');
var StackLayoutModel = require('./stack-layout-model');
var _ = require('underscore');

/**
 *  Stack layout view manages a "carousel" of views.
 *  They can go forward or backward.
 */

module.exports = CoreView.extend({
  module: 'components:stack-layout:stack-layout-view',

  initialize: function (opts) {
    if (!this.collection || !this.collection.size()) {
      throw new Error('A collection of stack views should be provided');
    }
    this.model = new StackLayoutModel({}, {
      stackLayoutItems: this.collection
    });
    this.model.bind('positionChanged', this._onPositionChange, this);
  },

  render: function () {
    this.clearSubViews();
    this._genNewStackView();
    return this;
  },

  _onPositionChange: function (newPos, opts) {
    this._removeOldStackView();
    this._genNewStackView(_.flatten(opts));
    this.trigger('positionChanged', this);
  },

  getCurrentPosition: function () {
    return this.model.get('position');
  },

  _removeOldStackView: function () {
    var oldView = this._getCurrentView();
    if (oldView) {
      oldView.clean();
      this.removeView(oldView);
    }
  },

  _getCurrentView: function () {
    for (var key in this._subviews) break;
    return this._subviews[key];
  },

  _genNewStackView: function () {
    var args = [this.model].concat([_.flatten(arguments)]);
    var nextView = this.collection.at(this.model.get('position')).get('createStackView').apply(this, args);
    this.addView(nextView);

    this.$el.html(nextView.render().el);
  }
});
