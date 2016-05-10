var cdb = require('cartodb.js');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var InfowindowDefinitionModel = require('../../../../javascripts/cartodb3/data/infowindow-definition-model');

describe('data/infowindow-definition-model', function () {
  describe('model', function () {
    var model;

    beforeEach(function () {
      this.configModel = new ConfigModel({
        base_url: '/u/pepe'
      });

      model = new InfowindowDefinitionModel({
        'fields': [
          {
            'name': 'description',
            'title': true,
            'position': 0
          },
          {
            'name': 'name',
            'title': true,
            'position': 1
          }
        ],
        'template_name': 'infowindow_light',
        'template': '',
        'alternative_names': {},
        'width': 226,
        'maxHeight': 180
      }, {
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
  });
});
