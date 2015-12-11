var _ = cdb._;
var View = cdb.core.View;
var torqueTemplate = require('./torque-template.tpl');
var placeholderTemplate = require('./placeholder.tpl');
var TorqueHeaderView = require('./torque-header-view');
var TorqueHistogramView = require('./torque-histogram-view');

/**
 * Widget content view for a Torque time-series
 */
module.exports = View.extend({

  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function() {
    this._torqueLayerModel = this.options.torqueLayerModel;
    this.model.once('change:data', this.render, this);
  },

  render: function() {
    this.clearSubViews();

    if (this._isDataEmpty()) {
      this.$el.html(placeholderTemplate({
        hasTorqueLayer: true
      }));
    } else {
      this.$el.html(torqueTemplate());

      this._appendView(
        new TorqueHeaderView({
          el: this.$('.js-header'),
          model: this.model,
          torqueLayerModel: this._torqueLayerModel
        })
      );

      var view = new TorqueHistogramView(this.options);
      this._appendView(view);
      this.$el.append(view.el);
    }

    return this;
  },

  _appendView: function(view) {
    this.addView(view);
    view.render();
  },

  _isDataEmpty: function() {
    var data = this.model.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  }
});
