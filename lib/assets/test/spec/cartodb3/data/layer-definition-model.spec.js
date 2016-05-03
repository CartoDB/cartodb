var cdb = require('cartodb.js');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');

describe('data/layer-definition-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new LayerDefinitionModel({
      id: 'abc-123',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        query: 'SELECT * FROM foo',
        tile_style: 'asdasd'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });
  });

  it('should transform some attrs to be compatible with cartodb.js', function () {
    expect(this.model.get('cartocss')).toEqual('asdasd');
    expect(this.model.get('tile_style')).toBeUndefined();

    expect(this.model.get('sql')).toContain('SELECT');
    expect(this.model.get('query')).toBeUndefined();
  });

  describe('.toJSON', function () {
    it('should return the original data', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'abc-123',
        kind: 'carto',
        options: {
          type: 'CartoDB',
          table_name: 'foo',
          query: 'SELECT * FROM foo',
          tile_style: 'asdasd'
        }
      });
    });

    it('should not contain source if it is a source node', function () {
      this.model.set('source', 'a1');
      expect(this.model.toJSON().options.source).toEqual('a1');

      this.model.set('source', 'a0');
      expect(this.model.toJSON().options.source).not.toEqual('a0');
    });
  });

  describe('.hasAnalysisNode', function () {
    beforeEach(function () {
      this.nodeModel = new cdb.core.Model({
        id: 'b3'
      });
    });

    it('should return true if given layer definition model is considered owning it', function () {
      expect(this.model.hasAnalysisNode(this.nodeModel)).toBe(false);
      this.model.set('letter', 'b');
      expect(this.model.hasAnalysisNode(this.nodeModel)).toBe(true);
    });
  });

  describe('for a tile layer', function () {
    beforeEach(function () {
      this.model = new LayerDefinitionModel({
        id: 'abc-123',
        options: {
          type: 'Tiled'
        }
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
        options: {
          type: 'CartoDB',
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
        options: {
          type: 'CartoDB',
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

  describe('for a layer with a analysis source', function () {
    beforeEach(function () {
      this.model = new LayerDefinitionModel({
        id: 'abc-123',
        kind: 'carto',
        options: {
          type: 'CartoDB',
          table_name: 'foo_table',
          source: 'a1'
        }
      }, {
        parse: true,
        configModel: this.configModel
      });
    });

    it('should have a source set', function () {
      expect(this.model.get('source')).toEqual('a1');
    });

    describe('.toJSON', function () {
      it('should return the original data', function () {
        expect(this.model.toJSON()).toEqual({
          id: 'abc-123',
          kind: 'carto',
          options: {
            type: 'CartoDB',
            table_name: 'foo_table',
            source: 'a1'
          }
        });
      });
    });
  });
});
