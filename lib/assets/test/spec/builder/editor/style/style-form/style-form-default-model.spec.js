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
    it('should return if is torque category', function () {
      expect(this.model._isTorqueCategory()).toBe(false);

      this.styleModel.set('type', 'animated');

      expect(this.model._isTorqueCategory()).toBe(true);
    });
  });
});
