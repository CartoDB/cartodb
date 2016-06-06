var cdb = require('cartodb.js');
var _ = require('underscore');

module.exports = cdb.core.View.extend({
  className: 'Notifier',

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is mandatory');
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderAllSubviews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'reset', this.render);
    this.listenTo(this.collection, 'add', this._renderSubview);
    this.listenTo(this.collection, 'remove', this._removeSubview);
  },

  _renderAllSubviews: function () {
    _.each(this._subviews, function (subview) {
      this.el.append(subview.render().el);
    }, this);
  },

  _renderSubview: function (model) {
    var view = model.get('view');
    this.$el.append(view.render().el);
    this.addView(view);
  },

  _removeSubview: function (model) {
    var view = model.get('view');
    this.removeView(view);
    view.remove();
  }

});
