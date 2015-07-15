var CityNamesModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/city_names_model');
var GeocodeStuffModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff_model');

describe('common/dialog/georeference/city_names_model', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuffModel({
      tableName: 'table_id'
    });
    this.model = new CityNamesModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
    this.view = this.model.createView(); // called when each view is about to be used, should reset state
  });

  it('should start on step 0', function() {
    expect(this.model.get('step')).toEqual(0);
  });

  describe('.availableGeometriesFetchData', function() {
    beforeEach(function() {
      this.returnVal = {};
      var location = this.model._location();
      location.set('value', 'loc');
      location.set('isFreeText', true);
      spyOn(this.geocodeStuff, 'availableGeometriesFetchData').and.returnValue(this.returnVal);
      this.results = this.model.availableGeometriesFetchData();
    });

    it('should call the geocode stuff model with expected args', function() {
      expect(this.geocodeStuff.availableGeometriesFetchData).toHaveBeenCalled();
      expect(this.geocodeStuff.availableGeometriesFetchData.calls.argsFor(0)[0]).toEqual('namedplace');
      expect(this.geocodeStuff.availableGeometriesFetchData.calls.argsFor(0)[1]).toEqual('loc');
      expect(this.geocodeStuff.availableGeometriesFetchData.calls.argsFor(0)[2]).toEqual(true);
      expect(this.results).toBe(this.returnVal);
    });
  });

  describe('.continue', function() {
    describe('when have selected a city column name', function() {
      beforeEach(function() {
        this.model.set('canContinue', true);
        this.model.get('rows').first().set('value', 'col');
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
            geometryType: 'point'
          });
          this.model.get('rows').first().set('value', 'col');
          this.model._location().set('value', 'loc');
          this.model.continue();
        });

        it('should set geocode data', function() {
          var d = this.model.get('geocodeData');
          expect(d).toBeDefined();
          expect(d.type).toEqual('city');
          expect(d.kind).toEqual('namedplace');
          expect(d.column_name).toEqual('col');
          expect(d.location).toEqual('loc');
          expect(d.geometry_type).toEqual('point');
        });

        it('should not set geocode data with optional stuff', function() {
          var d = this.model.get('geocodeData');
          expect(d.region).toBeUndefined();
          expect(d.region_text).toBeUndefined();
        });

        describe('when have also set a region', function() {
          beforeEach(function() {
            this.model._region().set('value', 'val');
          });

          it('should set geocode data with region', function() {
            this.model.continue();
            var d = this.model.get('geocodeData');
            expect(d.region).toEqual('val');
            expect(d.region_text).toBeFalsy();

            this.model._region().set('isFreeText', true);
            this.model.continue();
            d = this.model.get('geocodeData');
            expect(d.region).toEqual('val');
            expect(d.region_text).toBe(true);
          });
        });
      });
    });
  });
});
