var _ = require('underscore');
var cdb = require('cartodb.js');
var WidgetModel = require('app/widgets/widget-model');
var WidgetView = require('app/widgets/widget-view');

describe('widgets/widget-view', function () {
  beforeEach(function () {
    this.model = new WidgetModel({
      id: 'widget_1',
      options: {
        title: 'Hello widget',
        columns: ['cartodb_id', 'description']
      }
    }, {
      layer: new cdb.core.Model()
    });
    this.view = new WidgetView({
      model: this.model,
      contentView: new cdb.core.View()
    });
    this.view.render();
  });

  it('should have 3 subviews, content, loader and error panes', function () {
    expect(_.size(this.view._subviews)).toBe(3);
  });
});
