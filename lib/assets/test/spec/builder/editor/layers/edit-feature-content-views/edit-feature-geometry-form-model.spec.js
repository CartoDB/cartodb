var Backbone = require('backbone');
require('backbone-forms');

var EditFeatureGeometryFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureGeometryPointFormModel = require('builder/editor/layers/edit-feature-content-views/edit-feature-geometry-point-form-model');

describe('editor/layers/edit-feature-content-views/edit-feature-geometry-form-model', function () {
  beforeEach(function () {
    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"Point","coordinates":[0,0]}',
      name: '',
      description: ''
    });
  });

  describe('type is point', function () {
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

    describe('latitude is erroneous', function () {
      it('should return regular error if lat is not a number', function () {
        this.formModel.set({ lat: 'Look at me!', lng: 100 });
        var form = new Backbone.Form({ model: this.formModel });
        var validation = form.getEditor('lat').validate();
        expect(validation.message).toBe('editor.edit-feature.valid-lat');
      });

      it('should return custom error if lat is out of bounds', function () {
        this.formModel.set({ lng: 10, lat: -120 });
        var form = new Backbone.Form({ model: this.formModel });

        var validation = form.getEditor('lat').validate();
        expect(validation.message).toBe('editor.edit-feature.out-of-bounds-lat');
      });
    });

    describe('longitude is erroneous', function () {
      it('should return regular error if lng is not a number', function () {
        this.formModel.set({ lng: 'Look at me!', lat: 10 });
        var form = new Backbone.Form({ model: this.formModel });
        var validation = form.getEditor('lng').validate();
        expect(validation.message).toBe('editor.edit-feature.valid-lng');
      });

      it('should return custom error if lng is out of bounds', function () {
        this.formModel.set({ lng: -5000, lat: 10 });
        var form = new Backbone.Form({ model: this.formModel });

        var validation = form.getEditor('lng').validate();
        expect(validation.message).toBe('editor.edit-feature.out-of-bounds-lng');
      });
    });

    describe('form data changes', function () {
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

      it('should set the_geom\'s feature without setting a previous one', function () {
        this.featureModel.unset('the_geom');
        this.formModel.set({ lat: 10, lng: 20 });
        expect(this.featureModel.get('the_geom')).toEqual('{"type":"Point","coordinates":[20,10]}');
      });
    });
  });

  describe('type is not point', function () {
    var formModel;
    var featureModel;
    var coords = [39.46975, -0.37739];

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
            validators: [ 'required', jasmine.any(Function) ],
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

    describe('._formatCoordinate', function () {
      it('should format properly the coordinate', function () {
        expect(formModel._formatCoordinate(0)).toEqual(0);
        expect(formModel._formatCoordinate(coords[0])).toEqual(39.46975);
        expect(formModel._formatCoordinate(coords[1])).toEqual(-0.37739);
      });
    });

    describe('._isValidCoordinate', function () {
      it('should validate coordinate', function () {
        expect(formModel._isValidCoordinate(null)).toBe(false);
        expect(formModel._isValidCoordinate(0)).toBe(true);
        expect(formModel._isValidCoordinate(coords[0])).toBe(true);
        expect(formModel._isValidCoordinate(coords[1])).toBe(true);
        expect(formModel._isValidCoordinate(coords[1].toString())).toBe(true);
      });
    });

    describe('._getLatitude', function () {
      it('should return latitude', function () {
        expect(formModel._getLatitude(coords)).toBe(39.46975);
      });
    });

    describe('._getLongitude', function () {
      it('should return longitude', function () {
        expect(formModel._getLongitude(coords)).toBe(-0.37739);
      });
    });

    describe('._validateGeom', function () {
      var the_geom_invalid_lng, the_geom_invalid_lat, the_geom_invalid_latlng, the_geom_valid;
      var invalid_lng_message = '{"message":"editor.edit-feature.out-of-bounds-lng"}';
      var invalid_lat_message = '{"message":"editor.edit-feature.out-of-bounds-lat"}';
      var invalid_latlng_message = '{"message":"editor.edit-feature.out-of-bounds-lat editor.edit-feature.out-of-bounds-lng"}';

      describe('type is line', function () {
        it('should validate the_geom', function () {
          the_geom_invalid_lng = '{"type":"LineString","coordinates":[[-200,0],[-190,0]]}';
          the_geom_invalid_lat = '{"type":"LineString","coordinates":[[0,-110],[0,-100]]}';
          the_geom_invalid_latlng = '{"type":"LineString","coordinates":[[-200,-110],[-190,-100]]}';
          the_geom_valid = '{"type":"LineString","coordinates":[[0,0],[1,1]]}';

          formModel._featureModel.isLine = function () { return true; };

          expect(JSON.stringify(formModel._validateGeom(the_geom_invalid_lng))).toBe(invalid_lng_message);
          expect(JSON.stringify(formModel._validateGeom(the_geom_invalid_lat))).toBe(invalid_lat_message);
          expect(JSON.stringify(formModel._validateGeom(the_geom_invalid_latlng))).toBe(invalid_latlng_message);
          expect(formModel._validateGeom(the_geom_valid)).toBe(undefined);
        });
      });

      describe('type is not line', function () {
        it('should validate the_geom', function () {
          the_geom_invalid_lng = '{"type":"Polygon","coordinates":[[[-200,0],[-190,0],[-190,10],[-200,0]]]}';
          the_geom_invalid_lat = '{"type":"Polygon","coordinates":[[[0,-110],[0,-100],[10,-100],[0,-110]]]}';
          the_geom_invalid_latlng = '{"type":"Polygon","coordinates":[[[-200,-110],[-190,-100],[-190,-100],[-190,-110]]]}';
          the_geom_valid = '{"type":"Polygon","coordinates":[[[0,0],[2,2],[1,1],[0,0]]]}';

          formModel._featureModel.isLine = function () { return false; };

          expect(JSON.stringify(formModel._validateGeom(the_geom_invalid_lng))).toBe(invalid_lng_message);
          expect(JSON.stringify(formModel._validateGeom(the_geom_invalid_lat))).toBe(invalid_lat_message);
          expect(JSON.stringify(formModel._validateGeom(the_geom_invalid_latlng))).toBe(invalid_latlng_message);
          expect(formModel._validateGeom(the_geom_valid)).toBe(undefined);
        });
      });
    });
  });
});
