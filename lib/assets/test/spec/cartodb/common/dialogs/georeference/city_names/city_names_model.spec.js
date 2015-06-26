var CityNamesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/city_names/city_names_model');

describe('common/dialog/georeference/city_names/city_names_model', function() {
  beforeEach(function() {
    this.model = new CityNamesModel({
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['foo', 'string'],
        ['lon', 'number'],
        ['bar', 'boolean'],
        ['lat', 'number']
      ]
    });
  });

  it('should start on step 0', function() {
    expect(this.model.get('step')).toEqual(0);
  });

  it('should have a namedplace as kind', function() {
    // Used for both available geometries lookup and geocoding process
    expect(this.model.kind).toEqual('namedplace');
  });

  describe('.continue', function() {
    describe('when have selected a city column name', function() {
      beforeEach(function() {
        this.model.set({
          canContinue: true,
          column_name: 'stad'
        });
        this.model.continue();
      });

      it('should set the state for next step', function() {
        expect(this.model.get('step')).toEqual(1);
        expect(this.model.get('canContinue')).toBe(false);
        expect(this.model.get('geometryType')).toEqual('');
      });

      describe('when have selected a geometry type', function() {
        beforeEach(function() {
          this.model.set({
            canContinue: true,
            geometryType: 'point',
            column_name: 'col',
            location: 'loc',
            region: ''
          });
          this.model.continue();
        });

        it('should set geocode data', function() {
          var d = this.model.get('geocodeData');
          expect(d).toBeDefined();
          expect(d.type).toEqual('city');
          expect(d.kind).toEqual('namedplace');
          expect(d.column_name).toEqual('col');
          expect(d.region).toBeUndefined();
          expect(d.location).toEqual('loc');
          expect(d.geometry_type).toEqual('point');

          // region should only be set if actually has a value
          this.model.set('region', 'val');
          this.model.continue();
          d = this.model.get('geocodeData');
          expect(d.region).toEqual('val');
        });
      });
    });
  });
});
