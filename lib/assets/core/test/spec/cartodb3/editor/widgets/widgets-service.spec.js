var WidgetsService = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-service');

describe('editor/widgets/widgets-service', function () {
  beforeEach(function () {
    WidgetsService._editorModel = {
      set: function () {},
      trigger: function () {}
    };
  });

  describe('.editWidget', function () {
    it('should set `edition` to false in _editorModel', function () {
      spyOn(WidgetsService._editorModel, 'set');

      WidgetsService.editWidget();

      expect(WidgetsService._editorModel.set).toHaveBeenCalledWith('edition', false);
    });

    it('should trigger `cancelPreviousEditions` in _editorModel', function () {
      spyOn(WidgetsService._editorModel, 'trigger');

      WidgetsService.editWidget();

      expect(WidgetsService._editorModel.trigger).toHaveBeenCalled();
    });
  });
});
