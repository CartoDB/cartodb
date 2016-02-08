var _ = require('underscore');
var specHelper = require('../../spec-helper');
var WidgetModel = require('../../../src/widgets/widget-model');
var WidgetListContent = require('../../../src/widgets/list/content-view');

describe('widgets/list/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createListModel(vis.map.layers.first(), {
      id: 'widget_3',
      columns: ['cartodb_id', 'title']
    });
    this.widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new WidgetListContent({
      showScroll: true,
      model: this.widgetModel
    });
  });

  it('should render the list, the pagination and the edges', function () {
    spyOn(this.view, 'render').and.callThrough();
    this.view._initBinds();
    this.dataviewModel._data.reset(genData(20));
    this.dataviewModel.trigger('change:data', this.dataviewModel);
    expect(this.view.render).toHaveBeenCalled();
    expect(_.size(this.view._subviews)).toBe(3);
    expect(_.size(this.view._list)).toBeDefined();
    expect(_.size(this.view._paginator)).toBeDefined();
    expect(_.size(this.view._edges)).toBeDefined();
  });

  describe('list', function () {
    beforeEach(function () {
      // Fake succesful list request
      this.dataviewModel._data.reset(genData(20, true));
      this.dataviewModel.trigger('change:data');
      this.list = this.view._list;
    });

    it('should render 20 list items', function () {
      expect(_.size(this.list._subviews)).toBe(20);
    });

    describe('interactivity', function () {
      beforeEach(function () {
        this._onItemClicked = jasmine.createSpy('onItemClicked');
        this.list.bind('itemClicked', this._onItemClicked, this.view);
      });

      it('should have interactivity when cartodb_id is defined', function () {
        this.list.$('.js-button:eq(0)').click();
        expect(this._onItemClicked).toHaveBeenCalled();
      });

      it('should not have interactivity when cartodb_id is not defined', function () {
        this.dataviewModel._data.reset(genData(20, false));
        this.dataviewModel.trigger('change:data');
        this.list.$('.js-button:eq(0)').click();
        expect(this._onItemClicked).not.toHaveBeenCalled();
      });
    });
  });
});

function genData (n, cartodb_id) {
  n = n || 1;
  var arr = [];
  _.times(n, function (i) {
    var obj = {
      title: 'test' + i
    };
    if (cartodb_id) {
      obj.cartodb_id = i;
    }
    arr.push(obj);
  });
  return arr;
}
