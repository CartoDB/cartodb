var cdb = require('cartodb.js');
var Backbone = require('backbone');
var BodyView = require('../../../../../javascripts/cartodb3/editor/add-widgets/body-view');

describe('editor/add-widgets/body-view', function () {
  beforeEach(function () {
    this.optionsCollection = new Backbone.Collection([
      {
        type: 'formula'
      }, {
        type: 'category'
      }
    ]);
    this.categoryContentView = new cdb.core.View();
    this.createCategoryContentViewSpy = jasmine.createSpy('category.createTabPaneContentView').and.returnValue(this.categoryContentView);
    this.createCategoryTabPaneItemSpy = jasmine.createSpy('category.createTabpaneItem').and.returnValue({
      label: 'category label',
      createContentView: this.createCategoryContentViewSpy
    });
    this.createHistogramTabPaneItemSpy = jasmine.createSpy('histogram.createTabpaneItem');
    this.widgetsTypes = [
      {
        type: 'category',
        createTabPaneItem: this.createCategoryTabPaneItemSpy
      }, {
        type: 'histogram',
        createTabPaneItem: this.createHistogramTabPaneItemSpy
      }
    ];
    this.view = new BodyView({
      optionsCollection: this.optionsCollection,
      widgetsTypes: this.widgetsTypes
    });
    this.view = this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render fine', function () {
    expect(this.view).toBeDefined();
  });

  it('should create tab pane items when there is at least one option of that type', function () {
    expect(this.createCategoryTabPaneItemSpy).toHaveBeenCalled();
    expect(this.createHistogramTabPaneItemSpy).not.toHaveBeenCalled();
  });
});
