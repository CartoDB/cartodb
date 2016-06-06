var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var InfowindowDefinitionModel = require('../../../../javascripts/cartodb3/data/infowindow-definition-model');

describe('data/infowindow-definition-model', function () {
  describe('model', function () {
    var model;

    beforeEach(function () {
      this.configModel = new ConfigModel({
        base_url: '/u/pepe'
      });

      model = new InfowindowDefinitionModel({}, {
        configModel: this.configModel
      });
    });

    it('should allow adding an alternative name', function () {
      model.addField('name');
      model.addField('description');

      model.setAlternativeName('name', 'nombre');
      model.setAlternativeName('description', 'descriptionn');

      var n = model.getAlternativeName('name');
      var d = model.getAlternativeName('description');

      expect(n).toEqual('nombre');
      expect(d).toEqual('descriptionn');
    });

    it('should add a field', function () {
      expect(model.containsField('test')).toEqual(false);
      model.addField('test');
      model.addField('test2');
      expect(model.containsField('test')).toEqual(true);
      model.removeField('test');
      expect(model.containsField('test')).toEqual(false);
      expect(model.containsField('test2')).toEqual(true);
      model.clearFields();
      expect(model.containsField('test2')).toEqual(false);
    });

    it('should add a field in order', function () {
      model.addField('test', 1);
      model.addField('test2', 0);
      expect(model.get('fields')[0].name).toEqual('test2');
      expect(model.get('fields')[1].name).toEqual('test');
    });

    it('should allow modify field properties', function () {
      model.addField('test');
      var t = model.getFieldProperty('test', 'title');
      expect(t).toEqual(true);
      model.setFieldProperty('test', 'title', false);
      t = model.getFieldProperty('test', 'title');
      expect(t).toEqual(false);
    });
  });
});
