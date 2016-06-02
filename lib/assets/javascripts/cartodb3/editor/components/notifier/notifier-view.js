var cdb = require('cartodb.js');
var _ = require('underscore');

module.exports = cdb.core.View.extend({
  className: 'Notifier',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderSubviews();
    return this;
  },

  _renderSubviews: function () {
    _.each(this._subviews, function (subview) {
      this.el.append(subview.render().el);
    }, this);
  },

  _initBinds: function () {
    this.listenTo(this.otherModel, 'change:source', this);
    this.add_related_model(this.otherModel);
  },

  includeView: function (view) {
    this.$el.append(view.render().el);
    this.addView(view);
  },

  excludeView: function (view) {
    var removed = _.firts(_.where(this._subviews, {cid: view.cid}));
    if (removed) {
      this.stopListeniing(removed);
      this.removeView(removed);
    }
  }

});
