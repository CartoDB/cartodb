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
    this.dataviewModel = new cdb.core.Model();
    this.dataviewModel._totals = new cdb.core.Model();
    this.layerModel = new cdb.core.Model();
    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel
    });

    spyOn(WidgetView.prototype, 'clean');
    spyOn(WidgetView.prototype, '_onError');

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
        this.view.errorModel.set('error', error);
        expect(this.view.$el.html()).toContain('Something related to limits');
      });
    });

    describe('when there is no error', function () {
      it('should render the content view', function () {
        this.view.render();
        this.view.$('.CDB-Widget-error').hasClass('is-hidden');
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

    it('calls ._onError on model.dataviewModel:error', function () {
      this.view.model.dataviewModel.trigger('error');

      expect(WidgetView.prototype._onError).toHaveBeenCalled();
    });

    it('calls ._onError on model.dataModel:error', function () {
      this.view.model.dataviewModel._totals.trigger('error');

      expect(WidgetView.prototype._onError).toHaveBeenCalled();
    });
  });
});
