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

  describe('.quotaLeftThisMonth', function() {
    describe('when has quota left', function() {
      beforeEach(function() {
        this.model.set({quota: 1000, monthly_use: 750});
      });

      it('should return the calculated quota left for this month', function() {
        expect(this.model.quotaLeftThisMonth()).toEqual(250);
      });
    });

    describe('when monthly usage exceeds quota', function() {
      beforeEach(function() {
        this.model.set({quota: 10, monthly_use: 1000});
      });

      it('should return a 0', function() {
        expect(this.model.quotaLeftThisMonth()).toEqual(0);
      });
    });

    describe('when has no quota info', function() {
      it('should return a 0', function() {
        this.model.set({quota: undefined, monthly_use: 10});
        expect(this.model.quotaLeftThisMonth()).toEqual(0);
        this.model.set({quota: 10, monthly_use: undefined});
        expect(this.model.quotaLeftThisMonth()).toEqual(0);
      });
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

    describe('when user has no quota', function() {
      beforeEach(function() {
        this.model.set({
          quota: 0,
          monthly_use: 0,
          hard_limit: true
        });
      });

      it('should return true unless has soft limit', function() {
        expect(this.model.hasReachedMonthlyQuota()).toBe(true);
        this.model.set('hard_limit', false);
        expect(this.model.hasReachedMonthlyQuota()).toBe(false);
      });
    });
  });
});
