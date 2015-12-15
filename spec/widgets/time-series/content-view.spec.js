var Model = require('cartodb.js').core.Model
var HistogramModel = require('app/widgets/histogram/model')
var TimeSeriesContentView = require('app/widgets/time-series/content-view')

describe('geo/ui/widgets/time-series/content-view', function () {
  beforeEach(function () {
    this.model = new HistogramModel({}, {
      filter: new Model(),
      layer: new Model()
    })

    this.model.sync = function (method, model, options) {
      this.options = options
    }.bind(this)

    this.view = new TimeSeriesContentView({
      model: this.model
    })

    this.view.render()
  })

  it('should render', function () {
    expect(this.view.$el.html()).not.toEqual('')
  })

  it('should not render chart just yet since have no data', function () {
    expect(this.view.$el.html()).not.toContain('<svg')
  })

  describe('when data is provided', function () {
    beforeEach(function () {
      var timeOffset = 10000
      var startTime = (new Date()).getTime() - timeOffset

      this.model.fetch()
      this.options.success({
        bins_count: 3,
        bin_width: 100,
        nulls: 0,
        bins_start: 10,
        bins: [{
          start: startTime,
          end: startTime + timeOffset,
          freq: 3
        }]
      })
    })

    it('should render chart', function () {
      expect(this.view.render().$el.html()).toContain('<svg')
    })
  })
})
