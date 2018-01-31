var Backbone = require('backbone');
var WidgetsService = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-service');
var Router = require('../../../../../javascripts/cartodb3/routes/router');

describe('editor/widgets/widgets-service', function () {
  var widgetModel;

  beforeEach(function () {
    spyOn(Router, 'goToWidget');
    widgetModel = new Backbone.Model({ id: 'wadus' });
    WidgetsService._editorModel = new Backbone.Model();
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
});
