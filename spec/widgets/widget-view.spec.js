var _ = require('underscore')
var Model = require('cartodb.js').core.Model
var View = require('cartodb.js').core.View
var WidgetModel = require('app/widgets/widget-model')
var WidgetView = require('app/widgets/widget-view')

describe('geo/ui/widgets/widget-view', function () {
  beforeEach(function () {
    this.model = new WidgetModel({
      id: 'widget_1',
      options: {
        title: 'Hello widget',
        columns: ['cartodb_id', 'description']
      }
    }, {
      layer: new Model()
    })
    this.view = new WidgetView({
      model: this.model,
      contentView: new View()
    })
    this.view.render()
  })

  it('should have 3 subviews, content, loader and error panes', function () {
    expect(_.size(this.view._subviews)).toBe(3)
  })
})
