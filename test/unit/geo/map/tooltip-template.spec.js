var TooltipTemplate = require('../../../../src/geo/map/tooltip-template');

describe('geo/map/tooltip-template', function () {
  describe('.update', function () {
    beforeEach(function () {
      this.callback = jasmine.createSpy('callback');
      this.tooltipTemplate = new TooltipTemplate({
        fields: [
          { name: 'Name', title: true, position: 1 }
        ]
      });
      this.tooltipTemplate.fields.bind('reset', this.callback, this);
    });

    it('should reset the fields when new fields are given', function () {
      this.tooltipTemplate.update({
        fields: [
          { name: 'Name', title: true, position: 1 },
          { name: 'Description', title: false, position: 2 }
        ]
      });

      expect(this.tooltipTemplate.fields.toJSON()).toEqual([
        { name: 'Name', title: true, position: 1 },
        { name: 'Description', title: false, position: 2 }
      ]);

      expect(this.callback).toHaveBeenCalled();
    });

    it('should NOT reset the fields when given the same fields', function () {
      this.tooltipTemplate.update({
        fields: [
          { name: 'Name', title: true, position: 1 }
        ]
      });

      expect(this.tooltipTemplate.fields.toJSON()).toEqual([
        { name: 'Name', title: true, position: 1 }
      ]);

      expect(this.callback).not.toHaveBeenCalled();
    });

    it('should clone alternative names', function () {
      var callback = jasmine.createSpy('callback');
      this.tooltipTemplate.bind('change', callback);

      var alternativeNames = {
        'name': 'Nombre'
      };

      this.tooltipTemplate.update({
        alternative_names: alternativeNames
      });

      expect(callback).toHaveBeenCalled();
      callback.calls.reset();

      // Original object with names is changed
      alternativeNames.description = 'Descripción';

      this.tooltipTemplate.update({
        alternative_names: alternativeNames
      });

      // Change event has been triggered
      expect(callback).toHaveBeenCalled();
    });
  });
});
