var _ = require('underscore');
var cdb = require('cartodb.js');
var DataviewModel = require('../../src/dataviews/dataview-model');
var WidgetView = require('../../src/widgets/widget-view');

describe('widgets/widget-view', function () {
  beforeEach(function () {
    this.model = new DataviewModel({
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
