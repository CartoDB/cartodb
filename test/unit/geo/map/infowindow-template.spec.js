var InfowindowTemplate = require('../../../../src/geo/map/infowindow-template');

describe('geo/map/infowindow-template', function () {
  describe('.update', function () {
    beforeEach(function () {
      this.callback = jasmine.createSpy('callback');
      this.infowindowTemplate = new InfowindowTemplate({
        fields: [
          { name: 'Name', title: true, position: 1 }
        ]
      });
      this.infowindowTemplate.fields.bind('reset', this.callback, this);
    });

    it('should reset the fields when new fields are given', function () {
      this.infowindowTemplate.update({
        fields: [
          { name: 'Name', title: true, position: 1 },
          { name: 'Description', title: false, position: 2 }
        ]
      });

      expect(this.infowindowTemplate.fields.toJSON()).toEqual([
        { name: 'Name', title: true, position: 1 },
        { name: 'Description', title: false, position: 2 }
      ]);

      expect(this.callback).toHaveBeenCalled();
    });

    it('should NOT reset the fields when given the same fields', function () {
      this.infowindowTemplate.update({
        fields: [
          { name: 'Name', title: true, position: 1 }
        ]
      });

      expect(this.infowindowTemplate.fields.toJSON()).toEqual([
        { name: 'Name', title: true, position: 1 }
      ]);

      expect(this.callback).not.toHaveBeenCalled();
    });

    it('should clone alternative names', function () {
      var callback = jasmine.createSpy('callback');
      this.infowindowTemplate.bind('change', callback);

      var alternativeNames = {
        'name': 'Nombre'
      };

      this.infowindowTemplate.update({
        alternative_names: alternativeNames
      });

      expect(callback).toHaveBeenCalled();
      callback.calls.reset();

      // Original object with names is changed
      alternativeNames.description = 'Descripción';

      this.infowindowTemplate.update({
        alternative_names: alternativeNames
      });

      // Change event has been triggered
      expect(callback).toHaveBeenCalled();
    });
  });
});
