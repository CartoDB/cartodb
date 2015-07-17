var UserGeocodingModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/user_geocoding_model');

describe('common/dialog/georeference/user_geocoding_model', function() {
  beforeEach(function() {
    this.model = new UserGeocodingModel({
      quota: null,
      block_price: null,
      monthly_use: 0,
      hard_limit: false
    });
  });

  describe('.hasQuota', function() {
    it('should return true if there is a quota value', function() {
      this.model.set('quota', 0);
      expect(this.model.hasQuota()).toBe(true);
      this.model.set('quota', 1000);
      expect(this.model.hasQuota()).toBe(true);
      this.model.set('quota', '0');
      expect(this.model.hasQuota()).toBe(true);
      this.model.set('quota', '1000');
      expect(this.model.hasQuota()).toBe(true);
    });

    it('should return false if quota is not set or such', function() {
      this.model.unset('quota');
      expect(this.model.hasQuota()).toBe(false);
      this.model.set('quota', null);
      expect(this.model.hasQuota()).toBe(false);
      this.model.set('quota', undefined);
      expect(this.model.hasQuota()).toBe(false);
      this.model.set('quota', '');
      expect(this.model.hasQuota()).toBe(false);
    });
  });

  describe('.hasReachedMonthlyQuota', function() {
    beforeEach(function() {
      this.model.set('quota', 10);
    });

    describe('when hard_limit is set to false', function() {
      beforeEach(function() {
        this.model.set('hard_limit', false);
      });

      it('should always return false', function() {
        this.model.set('monthly_use', 9000);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
        this.model.set('monthly_use', 11);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
        this.model.set('monthly_use', 10);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
        this.model.set('monthly_use', 9);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
      });
    });

    describe('when hard_limit is set to true', function() {
      beforeEach(function() {
        this.model.set('hard_limit', true);
      });

      it('should return true or false depending on monthly usage', function() {
        this.model.set('monthly_use', 9000);
        expect(this.model.hasReachedMonthlyQuota()).toBe(true);
        this.model.set('monthly_use', 11);
        expect(this.model.hasReachedMonthlyQuota()).toBe(true);
        this.model.set('monthly_use', 10);
        expect(this.model.hasReachedMonthlyQuota()).toBe(true);

        this.model.set('monthly_use', 0);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
        this.model.set('monthly_use', 9);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
      });
    });
  });
});
