var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var InfowindowHoverModel = require('../../../../javascripts/cartodb3/data/infowindow-hover-model');

describe('data/infowindow-hover-model', function () {
  describe('model', function () {
    var model;

    beforeEach(function () {
      this.configModel = new ConfigModel({
        base_url: '/u/pepe'
      });

      model = new InfowindowHoverModel({}, {
        configModel: this.configModel
      });
    });

    it('should relay in default attributes properly', function () {
      expect(model.get('template_name')).toBe('');
      expect(model.get('template')).toBe('');
    });

    it('should check isCustomTemplate properly', function () {
      expect(model.isCustomTemplate()).toBe(false);

      model.set({template: 'foo', template_name: ''});
      expect(model.isCustomTemplate()).toBe(true);

      model.set({template: '', template_name: 'foo'});
      expect(model.isCustomTemplate()).toBe(false);

      model.set({template: '', template_name: ''});
      expect(model.isCustomTemplate()).toBe(false);
    });
  });
});
