var cdb = require('cartodb.js');
var WidgetView = require('../../../../javascripts/deep-insights/widgets/widget-view');
var WidgetModel = require('../../../../javascripts/deep-insights/widgets/widget-model');

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
    this.dataviewModel.getUnfilteredData = function () {};
    this.dataviewModel.get = function (key) {
      switch (key) {
        case 'totalAmount':
          return 1234;
        case 'type':
          return 'histogram';
      }
    };
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
      this.view.model.dataviewModel.trigger('statusError');

      expect(WidgetView.prototype._onError).toHaveBeenCalled();
    });
  });

  describe('._onDataChanged', function () {
    it('should return error if too many bins', function () {
      spyOn(this.view.model.dataviewModel, 'getUnfilteredData').and.returnValue(new Array(368));

      this.view._onDataChanged();

      var error = this.view.errorModel.get('error');
      expect(error).toBeDefined();
      expect(error.type).toEqual('too_many_bins');
      expect(error.message).toEqual('There are too many bins returned. Try selecting a less granular aggregation or filtering the data source.');
      expect(error.error).toEqual('Too many bins returned');
    });
  });

  describe('._extractError', function () {
    it('should return error with context if it is from an AJAX request', function () {
      var error = {
        responseJSON: {
          errors_with_context: ['an error with context']
        }
      };

      var extractedError = this.view._extractError(error);

      expect(extractedError).toEqual('an error with context');
    });

    it('should return proper error (type and message) if Windshaft error', function () {
      var error = {
        message: 'a message',
        type: 'a type'
      };

      var extractedError = this.view._extractError(error);

      expect(extractedError).toEqual(error);

      // No type
      error = {
        message: 'another message'
      };

      extractedError = this.view._extractError(error);

      expect(extractedError).toEqual({
        type: 'generic',
        message: error.message
      });
    });

    it('should return an empty object if none of the above applies', function () {
      var extractedError = this.view._extractError();

      expect(extractedError).toEqual({});
    });
  });
});
