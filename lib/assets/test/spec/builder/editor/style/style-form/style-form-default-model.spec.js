var Backbone = require('backbone');
var QuerySchemaModel = require('builder/data/query-schema-model');
var StyleModel = require('builder/editor/style/style-definition-model.js');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');

describe('editor/style/style-form/style-form-default-model', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });
    this.querySchemaModel.columnsCollection.reset([]);

    this.styleModel = new StyleModel({
      type: 'animation',
      style: 'simple',
      fill: {
        color: {
          fixed: {}
        }
      }
    });

    spyOn(StyleFormDefaultModel.prototype, '_onChange').and.callThrough();
    this.model = new StyleFormDefaultModel(null, {
      parse: true,
      querySchemaModel: this.querySchemaModel,
      queryGeometryModel: new Backbone.Model(),
      styleModel: this.styleModel,
      userModel: new Backbone.Model(),
      modals: {}
    });
  });

  describe('._isTorqueCategory', function () {
    it('should return false if it is a heatmap', function () {
      expect(this.model._isTorqueCategory()).toBe(false);

      this.styleModel.set('style', 'heatmap');

      expect(this.model._isTorqueCategory()).toBe(false);
    });

    it('should return false if points are styled by a solid color', function () {
      expect(this.model._isTorqueCategory()).toBe(false);

      this.styleModel.set('style', 'simple');
      this.styleModel.set('fill', {
        color: {
          attribute_type: 'string',
          attribute: 'channel',
          fixed: '#FABADA'
        }
      });

      expect(this.model._isTorqueCategory()).toBe(false);
    });

    it('should return true if points are styled by value', function () {
      expect(this.model._isTorqueCategory()).toBe(false);

      this.styleModel.set('style', 'simple');
      this.styleModel.set('fill', {
        color: {
          attribute_type: 'string',
          attribute: 'channel',
          range: [],
          domain: []
        }
      });

      expect(this.model._isTorqueCategory()).toBe(true);
    });
  });
});
