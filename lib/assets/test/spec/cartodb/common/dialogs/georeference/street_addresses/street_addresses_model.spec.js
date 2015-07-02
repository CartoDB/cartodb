var StreetAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/street_addresses_model');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/street_addresses/street_addresses_model', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new StreetAddressesModel({
      geocodeStuff: this.geocodeStuff,
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      this.model.set({
        canContinue: true,
        type: 'address',
        kind: 'high-resolution'
      });
      this.model.continue();
      this.geocodeData = this.model.get('geocodeData');
    });

    it('should set the geocodeData directly', function() {
      expect(this.geocodeData.type).toEqual('address');
      expect(this.geocodeData.kind).toEqual('high-resolution');
      expect(this.geocodeData.location).toBeUndefined();
      expect(this.geocodeData.text).toBeUndefined();
    });
  });

  describe('.onChangeRows', function() {
    describe('when no rows have any value', function() {
      beforeEach(function() {
        this.model.onChangeRows();
      });

      it('should set formatter to an empty string', function() {
        expect(this.model.get('formatter')).toEqual('');
      });

      it('should set canContinue to false', function() {
        expect(this.model.get('canContinue')).toBe(false);
      });
    });

    describe('when at least one row has an value', function() {
      beforeEach(function() {
        this.model.get('rows').first().set('columnOrFreeTextValue', 'col');
        this.model.onChangeRows();
      });

      it('should set formatter to to the value', function() {
        expect(this.model.get('formatter')).toEqual('{col}');
      });

      it('should set canContinue to true', function() {
        expect(this.model.get('canContinue')).toBe(true);
      });

      describe('when a row has a free text value', function() {
        beforeEach(function() {
          this.model.get('rows').last().set({
            columnOrFreeTextValue: ' foo bar   ',
            isFreeText: true
          });
          this.model.onChangeRows();
        });

        it('should set formatter as a comma separated list with the free text value trimmed', function() {
          expect(this.model.get('formatter')).toEqual('{col}, foo bar');
        });

        it('should set canContinue to true', function() {
          expect(this.model.get('canContinue')).toBe(true);
        });
      });
    });
  });
});
