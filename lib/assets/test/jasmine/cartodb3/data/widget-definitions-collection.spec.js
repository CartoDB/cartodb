var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var WidgetDefinitionsCollection = require('../../../../javascripts/cartodb3/data/widget-definitions-collection');

describe('data/widget-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.collection = new WidgetDefinitionsCollection(null, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.originalAjax = Backbone.ajax;
    Backbone.ajax = function () {
      return {
        always: function (cb) {
          cb();
        }
      };
    };
  });

  afterEach(function () {
    Backbone.ajax = this.originalAjax;
  });

  describe('when a model is created', function () {
    beforeEach(function () {
      var histogram = {
        type: 'histogram',
        title: 'histogram',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };
      this.collection.create(histogram);
    });

    it('should set a new order when a new widget is created', function () {
      var widget = this.collection.at(0);
      expect(widget.get('order')).toBe(0);
      widget.set('order', 10);
      var category = {
        type: 'category',
        title: 'category',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };
      this.collection.create(category);
      var widget2 = this.collection.at(1);
      expect(widget2.get('order')).toBe(11);
    });
  });

  describe('.updateSourceIds', function () {
    beforeEach(function () {
      this.collection.add([
        {
          type: 'category',
          source: {
            id: 'a0'
          }
        }, {
          type: 'category',
          source: {
            id: 'a1'
          }
        }
      ]);
      this.collection.each(function (m) {
        spyOn(m, 'save').and.callThrough();
      });
      this.collection.updateSourceIds('a0', 'b0');
    });

    it('should change the source of all affected widgets', function () {
      expect(this.collection.pluck('source')).toEqual(['b0', 'a1']);
    });

    it('should have saved the changed widgets', function () {
      expect(this.collection.at(0).save).toHaveBeenCalled();
      expect(this.collection.at(1).save).not.toHaveBeenCalled();
    });
  });
});
