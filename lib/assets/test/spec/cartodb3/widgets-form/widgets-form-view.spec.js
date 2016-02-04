var $ = require('jquery');
var WidgetsFormView = require('../../../../javascripts/cartodb3/widgets-form/widgets-form-view');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');

describe('widgets-form/widgets-form-view', function () {
  beforeEach(function () {
    this.widgetDefinitionModel = new WidgetDefinitionModel({
      type: 'formula',
      title: 'AVG districts homes',
      options: {
        column: 'areas',
        operation: 'avg'
      }
    }, {
      layerDefinitionModel: new cdb.core.Model(),
      dashboardWidgetsService: new cdb.core.Model()
    });

    this.view = new WidgetsFormView({
      widgetDefinitionModel: this.widgetDefinitionModel
    });
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render', function () {
      expect(this.view.$('form').length).toBe(1);
      expect(this.view.$('input[name="title"]').val()).toBe(this.widgetDefinitionModel.get('title'));
    });
  });

  describe('on change', function () {
    beforeEach(function () {
      this.view.render();
      this.widgetDefinitionModel.sync = function () {};
      this.formModel = this.widgetDefinitionModel.getFormModel();
      this.changeBind = jasmine.createSpy('formModelChange');
      this.formModel.bind('change', this.changeBind, this);
    });

    it('should update widget form when any attribute is changed', function () {
      var $el = this.view.$('input[name="title"]');
      $el.val('trees density');
      this.view.widgetFormView.trigger('change');
      expect(this.changeBind).toHaveBeenCalled();
    });

    it('shouldn\'t update widget form when there\'s an error in the form', function () {
      var $el = this.view.$('input[name="title"]');
      $el.val('');
      this.view.widgetFormView.trigger('change');
      expect(this.changeBind).not.toHaveBeenCalled();
    });

    it('should commit form when a change is made', function() {
      spyOn(this.view.widgetFormView, 'commit');
      var $el = this.view.$('input[name="title"]');
      $el.val('hello');
      this.view.widgetFormView.trigger('change');
      expect(this.view.widgetFormView.commit).toHaveBeenCalled();
    });

    afterEach(function () {
      this.changeBind.calls.reset();
    });
  });
});
