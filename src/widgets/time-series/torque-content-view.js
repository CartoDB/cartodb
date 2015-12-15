var _ = cdb._
var View = cdb.core.View
var torqueTemplate = require('./torque-template.tpl')
var placeholderTemplate = require('./placeholder.tpl')
var TorqueControlsView = require('./torque-controls-view')
var TorqueTimeInfoView = require('./torque-time-info-view')
var TorqueHistogramView = require('./torque-histogram-view')

/**
 * Widget content view for a Torque time-series
 */
module.exports = View.extend({
  className: 'CDB-Widget-body CDB-Widget-body--timeSeries',

  initialize: function () {
    this.model.once('change:data', this.render, this)
  },

  render: function () {
    this.clearSubViews()

    if (this._isDataEmpty()) {
      this.$el.html(placeholderTemplate({
        hasTorqueLayer: true
      }))
    } else {
      this._renderContent()
    }

    return this
  },

  _renderContent: function () {
    this.$el.html(torqueTemplate())
    this._appendView(
      new TorqueControlsView({ model: this.options.torqueLayerModel }),
      '.js-header'
    )
    this._appendView(
      new TorqueTimeInfoView({ model: this.options.torqueLayerModel }),
      '.js-header'
    )
    this._appendView(new TorqueHistogramView(this.options))
  },

  _appendView: function (view, selector) {
    this.addView(view)
    if (selector) {
      this.$(selector).append(view.el)
    } else {
      this.$el.append(view.el)
    }
    view.render()
  },

  _isDataEmpty: function () {
    var data = this.model.getData()
    return _.isEmpty(data) || _.size(data) === 0
  }
})
