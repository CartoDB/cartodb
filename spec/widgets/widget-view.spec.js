var _ = require('underscore');
var cdb = require('cartodb.js');
var WidgetView = require('../../src/widgets/widget-view');
var WidgetModel = require('../../src/widgets/widget-model');

describe('widgets/widget-view', function () {
  beforeEach(function () {
    this.dataviewModel = new cdb.core.Model();
    this.dataviewModel.layer = new cdb.core.Model();
    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new WidgetView({
      model: widgetModel,
      contentView: new cdb.core.View()
    });
    this.view.render();
  });

  it('should have 3 subviews, content, loader and error panes', function () {
    expect(_.size(this.view._subviews)).toBe(3);
  });
});
