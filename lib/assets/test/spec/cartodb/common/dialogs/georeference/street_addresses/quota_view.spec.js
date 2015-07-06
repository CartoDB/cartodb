var QuotaView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/quota_view');
var UserGeocoding = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/user_geocoding_model');

describe('common/dialog/georeference/street_addresses/quota_view', function() {
  beforeEach(function() {
    this.model = new UserGeocoding({
      quota: 2250,
      monthly_use: 1000
    });
    this.view = new QuotaView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should show the credits left', function() {
    expect(this.innerHTML()).toContain('1,250 credits left');
  });

  it('should a progress bar', function() {
    expect(this.innerHTML()).toContain('width: 44');
  });

  afterEach(function() {
    this.view.clean();
  });
});
