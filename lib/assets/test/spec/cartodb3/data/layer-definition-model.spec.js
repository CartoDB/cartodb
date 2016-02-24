var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');

describe('data/layer-definition-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new LayerDefinitionModel({
      id: 'abc-123',
      type: 'cartodb'
    }, {
      configModel: this.configModel
    });
  });

  describe('for a tile layer', function () {
    beforeEach(function () {
      this.model = new LayerDefinitionModel({
        id: 'abc-123',
        type: 'tile'
      }, {
        parse: true,
        configModel: this.configModel
      });
    });

    it('should not have any data models', function () {
      expect(this.model.layerTableModel).toBeUndefined();
    });
  });

  describe('for a cartodb layer', function () {
    beforeEach(function () {
      this.model = new LayerDefinitionModel({
        id: 'abc-123',
        type: 'cartodb',
        options: {
          table_name: 'foo_table',
          query: 'SELECT * FROM pepe.foo_table'
        }
      }, {
        parse: true,
        configModel: this.configModel
      });
    });

    it('should have a layer table model', function () {
      var m = this.model.layerTableModel;
      expect(m).toBeDefined();
      expect(m.get('table_name')).toContain('foo_table');
      expect(m.get('query')).toContain('SELECT');
    });
  });

  describe('for a namedmap layer', function () {
    beforeEach(function () {
      this.model = new LayerDefinitionModel({
        id: 'abc-123',
        type: 'cartodb',
        options: {
          table_name: 'foo_table',
          query: 'SELECT * FROM pepe.foo_table',
          id: 'XOXO-999'
        }
      }, {
        parse: true,
        configModel: this.configModel
      });
    });

    it('should maintain its own id', function () {
      expect(this.model.id).toEqual('abc-123');
    });

    it('should have a layer table model', function () {
      var m = this.model.layerTableModel;
      expect(m).toBeDefined();
      expect(m.get('table_name')).toContain('foo_table');
      expect(m.get('query')).toContain('SELECT');
    });
  });
});
