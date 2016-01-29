var WidgetModel = require('../../src/widgets/widget-model');

describe('widgets/widget-view', function () {
  beforeEach(function () {
    this.model = new WidgetModel(null, {
      dataviewModel: jasmine.createSpyObj('dataviewModel', ['remove'])
    });
  });

  describe('.remove', function () {
    beforeEach(function () {
      this.removeSpy = jasmine.createSpy('remove');
      spyOn(this.model, 'stopListening');
      this.model.on('destroy', this.removeSpy);
      this.model.remove();
    });

    it('should remove the model', function () {
      expect(this.removeSpy).toHaveBeenCalledWith(this.model);
    });

    it('should remove dataviewModel', function () {
      expect(this.model.dataviewModel.remove).toHaveBeenCalled();
    });

    it('should call stop listening to events', function () {
      expect(this.model.stopListening).toHaveBeenCalled();
    });
  });
});
