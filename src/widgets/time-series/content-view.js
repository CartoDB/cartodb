var _ = cdb._;
var View = cdb.core.View;
var placeholderTemplate = require('./placeholder.tpl');
var HistogramView = require('./histogram-view');

/**
 * Widget content view for a time-series
 */
module.exports = View.extend({

  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function() {
    this.model.once('change:data', this._onFirstLoad, this);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(''); // to remove placeholder if there is any

    if (this._isDataEmpty()) {
      this.$el.append(placeholderTemplate({
        hasTorqueLayer: false
      }));
    } else {
      this._appendView(new HistogramView(this.options));
    }

    return this;
  },

  _onFirstLoad: function() {
    this._storeBounds();
    this.model.once('change:data', this.render, this);
    this.model._fetch();
  },

  _storeBounds: function() {
    var data = this.model.getData();
    if (data && data.length > 0) {
      var start = data[0].start;
      var end = data[data.length - 1].end;
      this.model.set({ start: start, end: end, bins: data.length });
    }
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
