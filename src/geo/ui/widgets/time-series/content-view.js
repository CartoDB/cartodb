var _ = require('underscore');
var View = require('cdb/core/view');
var placeholderTemplate = require('../histogram/placeholder.tpl');
var HistogramView = require('./histogram-view');

/**
 * Widget content view for a time-series
 */
module.exports = View.extend({

  initialize: function() {
    this.model.once('change:data', this.render, this);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(''); // to remove placeholder if there is any

    if (this._isDataEmpty()) {
      this.$el.append(placeholderTemplate());
    } else {
      this._renderContent();
    }

    return this;
  },

  _renderContent: function() {
    this._appendView(new HistogramView(this.options));
  },

  _appendView: function(view) {
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isDataEmpty: function() {
    var data = this.model.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  }
});
