var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureGeometryFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureGeometryPointFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-geometry-point-form-model');

describe('editor/layers/edit-feature-content-views/edit-feature-geometry-form-model', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });
    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"Point","coordinates":[0,0]}',
      name: '',
      description: ''
    });
  });

  describe('when type is point', function () {
    beforeEach(function () {
      this.formModel = new EditFeatureGeometryPointFormModel({
        lat: 0,
        lng: 0
      }, {
        featureModel: this.featureModel
      });
    });

    it('should generate lat lng schema from geometry', function () {
      expect(Object.keys(this.formModel.schema).length).toEqual(2);
      expect(this.formModel.schema.lng.type).toEqual('Number');
      expect(this.formModel.schema.lat.type).toEqual('Number');
    });

    describe('when form data changes', function () {
      it('should update feature model', function () {
        expect(this.featureModel.get('the_geom')).toBe('{"type":"Point","coordinates":[0,0]}');

        this.formModel.set('lat', 3.141592653);

        expect(this.featureModel.get('the_geom')).toBe('{"type":"Point","coordinates":[0,3.14159265]}');

        this.formModel.set({
          'lat': -90,
          'lng': 180
        });

        expect(this.featureModel.get('the_geom')).toBe('{"type":"Point","coordinates":[180,-90]}');

        this.formModel.set({
          'lat': 0,
          'lng': 0
        });

        expect(this.featureModel.get('the_geom')).toBe('{"type":"Point","coordinates":[0,0]}');
      });

      it('should only update the_geom once when lat and lng change so that changes can be detected', function () {
        expect(this.featureModel.get('the_geom')).toBe('{"type":"Point","coordinates":[0,0]}');

        this.formModel.set({
          'lat': -89.0123456789,
          'lng': 179.0123456789
        });

        expect(this.featureModel.get('the_geom')).toBe('{"type":"Point","coordinates":[179.01234568,-89.01234568]}');
        expect(this.featureModel.hasChanged('the_geom')).toBeTruthy();
      });
    });
  });

  describe('when type is not point', function () {
    var formModel;
    var featureModel;

    beforeEach(function () {
      featureModel = new Backbone.Model({
        the_geom: '{"type":"LineString","coordinates":[[0,0],[0,1]]}',
        name: '',
        description: ''
      });

      formModel = new EditFeatureGeometryFormModel(featureModel.toJSON(), {
        featureModel: featureModel
      });
    });

    describe('schema', function () {
      it('should generate schema from geometry', function () {
        expect(formModel.schema).toEqual({
          the_geom: {
            type: 'Text',
            validators: [ 'required' ],
            editorAttrs: { disabled: true },
            hasCopyButton: true
          }
        });
      });

      it('should NOT include copy attr if feature does NOT have the_geom', function () {
        featureModel.unset('the_geom');

        formModel = new EditFeatureGeometryFormModel(featureModel.toJSON(), {
          featureModel: featureModel
        });

        expect(formModel.schema.the_geom.hasCopyButton).toEqual(false);
      });
    });
  });
});
