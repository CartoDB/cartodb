var cdb = require('cartodb.js');
var WidgetView = require('../../src/widgets/widget-view');
var WidgetModel = require('../../src/widgets/widget-model');

describe('widgets/widget-view', function () {
  var error = {
    level: 'error',
    type: 'limit',
    message: 'Something related to limits',
    refresh: false
  };

  beforeEach(function () {
    this.dataviewModel = new cdb.core.Model({
      type: 'category'
    });
    this.dataviewModel.layer = new cdb.core.Model();
    this.dataviewModel._totals = new cdb.core.Model();

    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });

    spyOn(WidgetView.prototype, 'clean');
    spyOn(WidgetView.prototype, '_onDataModelEvent');
    spyOn(WidgetView.prototype, '_onDataviewModelEvent');

    this.view = new WidgetView({
      model: widgetModel,
      contentView: new cdb.core.View()
    });

    spyOn(this.view.options.contentView, 'render').and.returnValue({
      el: 'This is a widget'
    });

    this.view.render();
  });

  describe('.render', function () {
    describe('when there is an error', function () {
      it('should render the error view', function () {
        this.view.render(this.dataviewModel, error);
        expect(this.view.$el.html()).not.toContain('This is a widget');
        expect(this.view.$el.html()).toContain('Something related to limits');
      });
    });

    describe('when there is no error', function () {
      it('should render the content view', function () {
        this.view.render();
        expect(this.view.$el.html()).not.toContain('Something related to limits');
        expect(this.view.$el.html()).toContain('This is a widget');
      });
    });

    it('should render the loading view', function () {
      expect(this.view.$('.CDB-Widget-loader').length).toEqual(1);
    });
  });

  describe('bindings', function () {
    it('calls .clean on model:destroy', function () {
      this.view.model.trigger('destroy');

      expect(WidgetView.prototype.clean).toHaveBeenCalled();
    });

    it('calls ._onDataViewModelEvent on model.dataviewModel:all', function () {
      this.view.model.dataviewModel.trigger('error');

      expect(WidgetView.prototype._onDataviewModelEvent).toHaveBeenCalled();
    });

    it('calls ._onDataViewModelEvent on model.dataviewModel:all', function () {
      this.view.model.dataviewModel._totals.trigger('error');

      expect(WidgetView.prototype._onDataModelEvent).toHaveBeenCalled();
    });
  });
});
