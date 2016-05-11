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

  describe('for a layer with an infowindow', function () {
    beforeEach(function () {
      this.configModel = new ConfigModel({
        base_url: '/u/pepe'
      });

      this.model = new LayerDefinitionModel({
        id: 'abc-123',
        kind: 'carto',
        options: {
          type: 'CartoDB',
          table_name: 'foo_table',
          source: 'a1'
        },
        infowindow: {
          template_name: 'infowindow_light',
          latlng: [0, 0],
          offset: [28, 0],
          maxHeight: 180,
          autoPan: true,
          template: '',
          content: '',
          visibility: false,
          alternative_names: {},
          fields: [
            {
              name: 'description',
              title: true,
              position: 0
            },
            {
              name: 'name',
              title: true,
              position: 1
            }
          ],
          width: 226
        }
      }, {
        parse: true,
        configModel: this.configModel
      });
    });

    it('should have an infowindow model', function () {
      var m = this.model.infowindowModel;
      expect(m).toBeDefined();
      expect(m.get('fields').length).toEqual(2);
    });

    describe('.toJSON', function () {
      it('should modify infowindow attribute', function () {
        var m = this.model.infowindowModel;
        m.setTemplate('testing');
        var data = this.model.toJSON();
        expect(data.infowindow.template_name).toEqual('testing');
      });

      it('should return the original data', function () {
        expect(this.model.toJSON()).toEqual({
          id: 'abc-123',
          kind: 'carto',
          options: {
            type: 'CartoDB',
            table_name: 'foo_table',
            source: 'a1'
          },
          infowindow: {
            template_name: 'infowindow_light',
            latlng: [0, 0],
            offset: [28, 0],
            maxHeight: 180,
            autoPan: true,
            template: '',
            content: '',
            visibility: false,
            alternative_names: {},
            fields: [
              {
                name: 'description',
                title: true,
                position: 0
              },
              {
                name: 'name',
                title: true,
                position: 1
              }
            ],
            width: 226
          }
        });
      });
    });
  });
});
