var cdb = require('cartodb.js-v3');
var EstimationView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/estimation_view');
var UserGeocodingModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/user_geocoding_model');

describe('common/dialog/georeference/street_addresses/estimation_view', function() {
  beforeEach(function() {
    this.model = new cdb.admin.Geocodings.Estimation();
    this.userGeocoding = new UserGeocodingModel({
      quota: 1234,
      block_price: 1000,
      monthly_use: 0,
      hard_limit: false
    });
    this.view = new EstimationView({
      model: this.model,
      userGeocoding: this.userGeocoding,
      hasHardLimit: false
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render text about estimating cost', function() {
    expect(this.innerHTML()).toContain('Estimating possible cost');
  });

  describe('when has an estimation', function() {
    beforeEach(function() {
      this.model.set({
        estimation: 1234.0,
        rows: 101
      });
    });

    it('should show estimated price', function() {
      expect(this.innerHTML()).toContain('$13'); // rounded upward
      expect(this.innerHTML()).toContain('1234 extra credits');
    });

    it('should show block price', function() {
      expect(this.innerHTML()).toContain('$10/1,000 credits');
    });

    describe('when estimated price is 0', function() {
      beforeEach(function() {
        this.model.set('estimation', 0.0);
      });

      it('should state that the geocoding operation has no cost', function() {
        expect(this.innerHTML()).toContain('will have no cost');
        expect(this.innerHTML()).not.toContain('But');
      });

      it('should state soft limit cost', function() {
        expect(this.innerHTML()).toContain('$10/1,000 credits');
      });

      it('should state that there is nothing to geocode if has no rows', function() {
        this.model.set('rows', 0);
        expect(this.innerHTML()).toContain('No rows will be geocoded');
      });
    });

    describe('when hard limit is set', function() {
      beforeEach(function() {
        this.view.options.hasHardLimit = true;
        this.view.render();
      });

      it('should state that the geocoding operation has no cost', function() {
        expect(this.innerHTML()).toContain('will have no cost for you');
        expect(this.innerHTML()).toContain('But');
        expect(this.innerHTML()).not.toContain('$10/1,000 credits');
      });

      it('should state that there is nothing to geocode if has no rows', function() {
        this.model.set('rows', 0);
        expect(this.innerHTML()).toContain('No rows will be geocoded');
      });
    });

    describe('when estimation price is unknown', function() {
      beforeEach(function() {
        this.model.set('estimation', null);
      });

      it('should state that could not estimate price', function() {
        expect(this.innerHTML()).toContain('problem estimating cost');
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
