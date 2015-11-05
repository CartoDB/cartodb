var _ = require('underscore');
var WidgetModel = require('cdb/geo/ui/widgets/widget_model');
var WidgetView = require('cdb/geo/ui/widget');

describe('geo/ui/widget', function() {

  beforeEach(function() {
    this.model = new WidgetModel({
      id: 'widget_1',
      options: {
        title: 'Hello widget',
        columns: ['cartodb_id', 'description']
      }
    });
    this.view = new WidgetView({
      model: this.model
    });
    this.view.render();
  });

  it('should have 3 subviews, content, loader and error panes', function() {
    expect(_.size(this.view._subviews)).toBe(3);
  });

  it('should have defined "_createContentView" method', function() {
    expect(this.view._createContentView).toBeDefined();
  });

});
