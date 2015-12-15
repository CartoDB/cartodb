var _ = cdb._
var Model = cdb.core.Model
var WidgetHistogramModel = require('app/widgets/histogram/model')
var WidgetHistogramContent = require('app/widgets/histogram/content-view')

describe('geo/ui/widgets/histogram/content-view', function () {
  beforeEach(function () {
    this.dataModel = new WidgetHistogramModel({
      id: 'widget_3',
      title: 'Howdy',
      options: {
        columns: ['cartodb_id', 'title']
      }
    }, {
      filter: new Model(),
      layer: new Model()
    })

    this.viewModel = new Model({
      sync: true
    })

    this.filter = new Model({
      min: 0,
      max: 100
    })

    this.view = new WidgetHistogramContent({
      viewModel: this.viewModel,
      dataModel: this.dataModel,
      filter: this.filter
    })
  })

  it('should render the histogram', function () {
    spyOn(this.view, 'render').and.callThrough()
    this.dataModel._data.reset(genHistogramData(20))
    this.dataModel.trigger('change:data')
    expect(this.view.render).toHaveBeenCalled()
    expect(this.view.$('h3').text()).toBe('Howdy')
  })

  it('should revert the lockedByUser state when the model is changed', function () {
    spyOn(this.view, '_unsetRange').and.callThrough()

    this.dataModel.sync = function (method, model, options) {
      options.success({ 'response': true })
    }

    this.view.viewModel.set('zoomed', true)
    this.dataModel._fetch()

    expect(this.view._unsetRange).not.toHaveBeenCalled()

    this.view.lockedByUser = true
    this.dataModel.set('url', 'test')

    expect(this.view.lockedByUser).toBe(true)
  })

  it("shouldn't revert the lockedByUser state when the url is changed and the histogram is zoomed", function () {
    this.dataModel.sync = function (method, model, options) {
      options.success({ 'response': true })
    }

    this.view.lockedByUser = true
    this.dataModel._fetch()
    this.dataModel.trigger('change:data')
    expect(this.view.lockedByUser).toBe(false)
  })

  it('should unset the range when the data is changed', function () {
    this.dataModel.sync = function (method, model, options) {
      options.success({ 'response': true })
    }

    spyOn(this.view, '_unsetRange').and.callThrough()
    this.view.unsettingRange = true
    this.dataModel._fetch()
    this.dataModel._data.reset(genHistogramData(20))
    this.dataModel.trigger('change:data')
    expect(this.view._unsetRange).toHaveBeenCalled()
  })

  it("shouldn't unset the range when the url is changed and is zoomed", function () {
    spyOn(this.view, '_unsetRange').and.callThrough()

    this.dataModel.sync = function (method, model, options) {
      options.success({ 'response': true })
    }

    this.view.viewModel.set('zoomed', true)
    this.dataModel._fetch()

    expect(this.view._unsetRange).not.toHaveBeenCalled()

    this.view.unsettingRange = true
    this.dataModel.set('url', 'test')

    expect(this.view._unsetRange).not.toHaveBeenCalled()
  })

  it('should update the stats when the model is changed', function () {
    this.dataModel.sync = function (method, model, options) {
      options.success({ 'response': true })
    }

    spyOn(this.view, '_updateStats').and.callThrough()
    spyOn(this.view, '_onChangeModel').and.callThrough()
    this.dataModel._fetch()
    this.dataModel._data.reset(genHistogramData(20))
    this.dataModel.trigger('change:data')
    expect(this.view._onChangeModel).toHaveBeenCalled()
    expect(this.view._updateStats).toHaveBeenCalled()
  })

  it('should update the stats values', function () {
    expect(this.view.viewModel.get('min')).toBe(undefined)
    expect(this.view.viewModel.get('max')).toBe(undefined)
    expect(this.view.viewModel.get('avg')).toBe(undefined)
    expect(this.view.viewModel.get('total')).toBe(undefined)

    this.dataModel._data.reset(genHistogramData(20))
    this.dataModel.trigger('change:data')

    expect(this.view.viewModel.get('min')).not.toBe(0)
    expect(this.view.viewModel.get('max')).not.toBe(0)
    expect(this.view.viewModel.get('avg')).not.toBe(0)
    expect(this.view.viewModel.get('total')).not.toBe(0)
  })

  afterEach(function () {
    this.view.clean()
  })
})

function genHistogramData (n) {
  n = n || 1
  var arr = []
  _.times(n, function (i) {
    var start = (100 * i) + Math.round(Math.random() * 1000)
    var end = start + 100
    var obj = {
      bin: i,
      freq: Math.round(Math.random() * 10),
      avg: Math.round(Math.random() * 10),
      start: start,
      end: end,
      max: end,
      min: start
    }
    arr.push(obj)
  })
  return arr
}
