var cdb = require('cartodb.js')
var TorqueLayerModel = require('cartodb.js/src/geo/map/torque-layer')
var HistogramModel = require('app/widgets/histogram/model')
var RangeFilter = require('app/windshaft/filters/range')
var TimeContentView = require('app/widgets/time-series/torque-content-view')

describe('geo/ui/widgets/time-series/torque-content-view', function () {
  beforeEach(function () {
    this.model = new HistogramModel({}, {
      filter: new cdb.core.Model(),
      layer: new cdb.core.Model()
    })
    this.model.sync = function (method, model, options) {
      this.options = options
    }.bind(this)

    this.rangeFilter = new RangeFilter()
    this.torqueLayerModel = new TorqueLayerModel({
    })
    this.view = new TimeContentView({
      model: this.model,
      torqueLayerModel: this.torqueLayerModel,
      rangeFilter: this.rangeFilter
    })
    this.renderResult = this.view.render()
  })

  it('should render loading state', function () {
    expect(this.renderResult).toBe(this.view)
  })

  describe('when data is provided', function () {
    beforeEach(function () {
      var timeOffset = 10000
      var startTime = (new Date()).getTime() - timeOffset
      this.model.fetch()
      this.options.success({
        bins: [{
          start: startTime,
          end: startTime + timeOffset,
          freq: 3
        }]
      })
    })

    it('should render a time-slider', function () {
      expect(this.view.$('.CDB-TimeSlider').length).toEqual(1)
    })
  })
})
