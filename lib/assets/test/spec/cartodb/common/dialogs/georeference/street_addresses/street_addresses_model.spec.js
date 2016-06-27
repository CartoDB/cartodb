var cdb = require('cartodb.js-v3');
var moment = require('moment');
var StreetAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/street_addresses_model');
var GeocodeStuffModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff_model');
var UserGeocoding = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/user_geocoding_model');

describe('common/dialog/georeference/street_addresses/street_addresses_model', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuffModel({
      tableName: 'table_id'
    });
    this.userGeocoding = new UserGeocoding();
    this.model = new StreetAddressesModel({
      geocodeStuff: this.geocodeStuff,
      isGoogleMapsUser: false,
      userGeocoding: this.userGeocoding,
      estimation: new cdb.admin.Geocodings.Estimation(),
      lastBillingDate: '2015-07-08',
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
  });

  describe('.daysLeftToNextBilling', function() {
    beforeEach(function() {
      var today = moment();
      this.model.set('lastBillingDate', today);
    });

    it('should return the days left to next billing period', function() {
      expect(this.model.daysLeftToNextBilling()).toEqual(30);
    });
  });

  describe('.isDisabled', function() {
    it('should return true if not gmaps user and has reached monthly quota', function() {
      expect(this.model.isDisabled()).toBe(false);

      spyOn(this.userGeocoding, 'hasReachedMonthlyQuota').and.returnValue(true);
      expect(this.model.isDisabled()).toBe(true);

      this.model.set('isGoogleMapsUser', true);
      expect(this.model.isDisabled()).toBe(false);
    });
  });

  describe('.showCostsInfo', function() {
    it('should return true as long as user is not a gmaps user', function() {
      expect(this.model.showCostsInfo()).toBe(true);

      this.model.set('isGoogleMapsUser', true);
      expect(this.model.showCostsInfo()).toBe(false);
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      this.model.set({
        type: 'address',
        kind: 'high-resolution',
        formatter: 'search for something'
      });

      this.expectDesiredGeocodeData = function() {
        var geocodeData = this.model.get('geocodeData');
        expect(geocodeData.type).toEqual('address');
        expect(geocodeData.kind).toEqual('high-resolution');
        expect(geocodeData.formatter).toEqual('search for something');
        expect(geocodeData.location).toBeUndefined();
        expect(geocodeData.text).toBeUndefined();
      };
    });

    describe('when do not have to agree to terms-of-service', function() {
      beforeEach(function() {
        this.model.set('mustAgreeToTOS', false);
        this.model.continue();
      });

      it('should set the geocodeData directly', function() {
        this.expectDesiredGeocodeData();
      });
    });

    describe('when must agree to terms-of-service', function() {
      beforeEach(function() {
        expect(this.model.get('confirmTOS')).toBeFalsy();
        this.model.set('mustAgreeToTOS', true);
        this.model.continue();
      });

      it('should set that the user must agree terms-of-service first', function() {
        expect(this.model.get('confirmTOS')).toBe(true);
        expect(this.model.get('geocodeData')).toBeUndefined();
      });

      describe('when user agreed to terms-of-service', function() {
        beforeEach(function() {
          expect(this.model.get('hasAgreedToTOS')).toBeFalsy();
          this.model.set('hasAgreedToTOS', true);
          this.model.continue();
        });

        it('should set the geocodeData', function() {
          this.expectDesiredGeocodeData();
        });
      });
    });
  });
});
