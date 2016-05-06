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
  });
});
