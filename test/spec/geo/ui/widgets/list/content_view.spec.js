var _ = require('underscore');
var WidgetListModel = require('cdb/geo/ui/widgets/list/model');
var WidgetListContent = require('cdb/geo/ui/widgets/list/content_view');

describe('geo/ui/widgets/list/content_view', function() {
  beforeEach(function() {
    this.model = new WidgetListModel({
      id: 'widget_3',
      title: 'Howdy',
      columns: ['cartodb_id', 'title']
    });
    this.view = new WidgetListContent({
      showScroll: true,
      model: this.model
    });
  });

  it('should render the list, the pagination and the edges', function() {
    spyOn(this.view, 'render').and.callThrough();
    this.view._initBinds();
    this.model._data.reset(genData(20));
    this.model.trigger('change:data', this.model);
    expect(this.view.render).toHaveBeenCalled();
    expect(_.size(this.view._subviews)).toBe(3);
    expect(_.size(this.view._list)).toBeDefined();
    expect(_.size(this.view._paginator)).toBeDefined();
    expect(_.size(this.view._edges)).toBeDefined();
  });

  describe('list', function() {
    beforeEach(function() {
      // Fake succesful list request
      this.model._data.reset(genData(20, true));
      this.model.trigger('change:data');
      this.list = this.view._list;
    });

    it('should render 20 list items', function() {
      expect(_.size(this.list._subviews)).toBe(20);
    });

    describe('interactivity', function() {
      beforeEach(function() {
        this._onItemClicked = jasmine.createSpy("onItemClicked");
        this.list.bind('itemClicked', this._onItemClicked, this.view);
      });

      it('should have interactivity when cartodb_id is defined', function() {
        this.list.$('.js-button:eq(0)').click();
        expect(this._onItemClicked).toHaveBeenCalled();
      });

      it('should not have interactivity when cartodb_id is not defined', function() {
        this.model._data.reset(genData(20, false));
        this.model.trigger('change:data');
        this.list.$('.js-button:eq(0)').click();
        expect(this._onItemClicked).not.toHaveBeenCalled();
      });
    });
  });

});

function genData(n, cartodb_id) {
  n = n || 1;
  var arr = [];
  _.times(n, function(i) {
    var obj = {
      title: 'test' + i
    };
    if (cartodb_id) {
      obj.cartodb_id = i;
    }
    arr.push(obj);
  })
  return arr;
}
