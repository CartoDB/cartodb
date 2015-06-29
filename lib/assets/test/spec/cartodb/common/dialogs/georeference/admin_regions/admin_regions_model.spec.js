var AdminRegionsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/admin_regions/admin_regions_model');

describe('common/dialog/georeference/admin_regions/admin_regions_model', function() {
  beforeEach(function() {
    this.model = new AdminRegionsModel({
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
  });

  it('should start on step 0', function() {
    expect(this.model.get('step')).toEqual(0);
  });

  it('should have a admin1 as kind', function() {
    // Used for both available geometries lookup
    expect(this.model.kind).toEqual('admin1');
  });

  describe('.continue', function() {
    describe('when have selected a column name', function() {
      beforeEach(function() {
        this.model.set({
          canContinue: true,
          columnName: 'col'
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
            geometryType: 'polygon',
            columnName: 'col',
            location: 'loc'
          });
          this.model.continue();
        });

        it('should set geocode data', function() {
          var d = this.model.get('geocodeData');
          expect(d).toBeDefined();
          expect(d.type).toEqual('admin');
          expect(d.kind).toEqual('admin1');
          expect(d.column_name).toEqual('col');
          expect(d.location).toEqual('loc');
          expect(d.geometry_type).toEqual('polygon');
        });
      });
    });
  });
});
