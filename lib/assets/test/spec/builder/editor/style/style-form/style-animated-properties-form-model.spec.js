var Backbone = require('backbone');
var QuerySchemaModel = require('builder/data/query-schema-model');
var StyleModel = require('builder/editor/style/style-definition-model.js');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var StyleAnimatedFormModel = require('builder/editor/style/style-form/style-properties-form/style-animated-properties-form-model');

describe('editor/style/style-form/style-animated-properties-form-model', function () {
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

    spyOn(StyleFormDefaultModel.prototype, 'initialize').and.callThrough();
    spyOn(StyleAnimatedFormModel.prototype, '_onStyleChanged').and.callThrough();
    this.model = new StyleAnimatedFormModel(
      {
        attribute: 'year_month_day',
        duration: 30,
        overlap: false,
        resolution: 4,
        steps: 256,
        trails: 2
      },
      {
        parse: true,
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: new Backbone.Model(),
        styleModel: this.styleModel,
        userModel: new Backbone.Model(),
        modals: {}
      }
    );
  });

  describe('.initialize', function () {
    it('should initializa properly', function () {
      expect(StyleFormDefaultModel.prototype.initialize).toHaveBeenCalled();

      this.styleModel.set('fill', {
        color: {
          attribute_type: 'string',
          attribute: 'channel',
          range: [],
          domain: []
        }
      });

      expect(StyleAnimatedFormModel.prototype._onStyleChanged).toHaveBeenCalled();
    });
  });

  describe('._setSchema', function () {
    it('should call _generateSchema and trigger changeSchema event', function () {
      spyOn(this.model, '_generateSchema');
      spyOn(this.model, 'trigger');

      this.model._setSchema();

      expect(this.model._generateSchema).toHaveBeenCalled();
      expect(this.model.trigger).toHaveBeenCalledWith('changeSchema', this.model);
    });
  });

  describe('._onStyleChanged', function () {
    it('should call _replaceAttrs and _setSchema', function () {
      spyOn(this.model, '_replaceAttrs');
      spyOn(this.model, '_setSchema');

      this.model._onStyleChanged();

      expect(this.model._replaceAttrs).toHaveBeenCalled();
      expect(this.model._setSchema).toHaveBeenCalled();
    });
  });

  describe('._replaceAttrs', function () {
    it('should set overlap', function () {
      this.model.set('overlap', true);
      expect(this.model.get('overlap')).toBe(true);

      this.model._replaceAttrs();

      expect(this.model.get('overlap')).toBe(true);
    });

    describe('is torque category', function () {
      it('should set overlap', function () {
        this.model._isTorqueCategory = function () { return true; };

        this.model.set('overlap', true);
        expect(this.model.get('overlap')).toBe(true);

        this.model._replaceAttrs();

        expect(this.model.get('overlap')).toBe('false');
      });
    });
  });
});
