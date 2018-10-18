var $ = require('jquery');
var Backbone = require('backbone');
var WidgetsService = require('builder/editor/widgets/widgets-service');
var ModalsServiceModel = require('builder/components/modals/modals-service-model');
var Router = require('builder/routes/router');

describe('editor/widgets/widgets-service', function () {
  var widgetModel;

  beforeEach(function () {
    spyOn(Router, 'goToWidget');
    spyOn(Router, 'goToWidgetList');

    widgetModel = new Backbone.Model({ id: 'wadus', name: 'wadus' });
    WidgetsService._editorModel = new Backbone.Model();
    WidgetsService._modals = new ModalsServiceModel();
  });

  describe('.editWidget', function () {
    it('should set `edition` to false in _editorModel', function () {
      spyOn(WidgetsService._editorModel, 'set');

      WidgetsService.editWidget(widgetModel);

      expect(WidgetsService._editorModel.set).toHaveBeenCalledWith('edition', false);
    });

    it('should call Router.goToWidget with the widgetModel id', function () {
      WidgetsService.editWidget(widgetModel);
      expect(Router.goToWidget).toHaveBeenCalledWith(widgetModel.get('id'));
    });

    it('should trigger `cancelPreviousEditions` in _editorModel', function () {
      spyOn(WidgetsService._editorModel, 'trigger');

      WidgetsService.editWidget(widgetModel);

      expect(WidgetsService._editorModel.trigger).toHaveBeenCalledWith('cancelPreviousEditions');
    });
  });

  describe('.removeWidget', function () {
    afterEach(function () {
      WidgetsService._modalView.clean();
    });

    describe('when the widgetDefinitionModel is defined', function () {
      it('should create a delete confirmation widget template', function () {
        spyOn(WidgetsService._modals, 'create').and.callThrough();

        WidgetsService.removeWidget(widgetModel);

        expect(WidgetsService._modals.create).toHaveBeenCalled();
        expect($('.js-cancel').text().trim()).toEqual('editor.widgets.delete.cancel');
        expect($('.js-confirm').text().trim()).toEqual('editor.widgets.delete.confirm');
      });

      it('should destroy the widget when the user clicks on ', function () {
        spyOn(widgetModel, 'destroy');

        WidgetsService.removeWidget(widgetModel);
        $('.js-confirm').click();

        expect(widgetModel.destroy).toHaveBeenCalled();
      });

      it('should redirect to the widget list when the user clicks on confirm', function () {
        spyOn(widgetModel, 'destroy');

        WidgetsService.removeWidget(widgetModel);
        $('.js-confirm').click();

        expect(Router.goToWidgetList).toHaveBeenCalled();
      });
    });
  });
});
