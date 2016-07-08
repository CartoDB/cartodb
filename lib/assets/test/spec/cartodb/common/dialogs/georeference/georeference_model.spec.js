var cdb = require('cartodb.js-v3');
var GeoreferenceModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/georeference_model');
var UserGeocodingModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/user_geocoding_model');

describe('common/dialog/georeference/georeference_model', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('a', [
      ['cartodb_id', 'string'],
      ['the_geom', 'geometry'],
      ['other_geom', 'geometry'],
      ['lon', 'number'],
      ['lat', 'number'],
      ['cartodb_georef_status', 'string'],
      ['foobar', 'boolean'],
      ['updated_at', 'date'],
      ['created_at', 'date']
    ]);
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com',
      actions: {},
      geocoding: { foo: 'bar' }
    });
    this.attrs = {
      table: this.table,
      user: this.user
    };
    spyOn(UserGeocodingModel.prototype, 'initialize').and.callThrough();
    spyOn(UserGeocodingModel.prototype, 'hasQuota').and.returnValue(true);
    spyOn(UserGeocodingModel.prototype, 'hasReachedMonthlyQuota').and.returnValue(false);
    this.model = new GeoreferenceModel(this.attrs);
  });

  it('should selected 1st lon/lat tab', function() {
    var options = this.model.get('options');
    var selected = options.where({ selected: true });
    expect(selected.length).toEqual(1);
    expect(selected[0]).toBe(options.first());
  });

  describe('when georef_disabled is set for user', function() {
    beforeEach(function() {
      this.user.set('feature_flags', ['georef_disabled']);
      this.model.initialize(this.attrs);
    });

    it('should disabled all items except 1st tab (lon/lat)', function() {
      var options = this.model.get('options');
      var disabled = options.filter(function(m) {
        return m.get('disabled');
      });
      expect(disabled.length).toEqual(options.length - 1);
      expect(disabled[0]).not.toBe(options.first());
    });
  });

  it('should check user geocoding', function() {
    expect(UserGeocodingModel.prototype.initialize).toHaveBeenCalled();
    expect(UserGeocodingModel.prototype.initialize).toHaveBeenCalledWith(jasmine.objectContaining({
      foo: 'bar'
    }));
  });

  it('should disable street addr tab under some circumstances', function() {
    var expectToBeDisabled = function() {
      this.model.initialize(this.attrs); // to reset state
      var res = this.model.get('options').last().get('disabled');
      expect(res).toBeTruthy();
      expect(res).toEqual(jasmine.any(String));
    };

    // user has no quota
    UserGeocodingModel.prototype.hasQuota.calls.reset();
    UserGeocodingModel.prototype.hasQuota.and.returnValue(false);
    expectToBeDisabled.call(this);

    // Google maps is enabled but GME geocoder isn't
    this.user.get('actions').google_maps_enabled = true;
    this.user.get('actions').google_maps_geocoder_enabled = false;
    expectToBeDisabled.call(this);

    // This setup should (in theory) be impossible, but just in case disable the tab and inform user about the misconfiguration
    this.user.get('actions').google_maps_enabled = false;
    this.user.get('actions').google_maps_geocoder_enabled = true;
    expectToBeDisabled.call(this);
  });

  describe('when user has google maps enabled', function() {
    beforeEach(function() {
      // Google maps enabled we use the google geocoder, so no credits checked
      this.user.get('actions').google_maps_enabled = true;
      this.user.get('actions').google_maps_geocoder_enabled = true;
      UserGeocodingModel.prototype.hasReachedMonthlyQuota.calls.reset();
      UserGeocodingModel.prototype.hasQuota.calls.reset();
      this.model.initialize(this.attrs);
    });

    it('should not check any geocoding limits', function() {
      expect(UserGeocodingModel.prototype.hasReachedMonthlyQuota).not.toHaveBeenCalled();
      expect(UserGeocodingModel.prototype.hasQuota).not.toHaveBeenCalled();
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      this.selectedTabModel = this.model.get('options').first();
      spyOn(this.selectedTabModel, 'continue');
      this.model.continue();
    });

    it('should call continue on the currently selected tab model', function() {
      expect(this.selectedTabModel.continue).not.toHaveBeenCalled();

      this.selectedTabModel.set('canContinue', true);
      this.model.continue();
      expect(this.selectedTabModel.continue).toHaveBeenCalled();
    });
  });

  describe('._columnsNames', function() {
    beforeEach(function() {
      this.results = this.model._columnsNames();
    });

    it('should return an array with only valid column names to be selectable in UI', function() {
      expect(this.results).toEqual(['other_geom', 'lon', 'lat', 'foobar']);
    });
  });

  describe('._filteredColumns', function() {
    beforeEach(function() {
      this.results = this.model._filteredColumns();
    });

    it('should return an array with only valid column names to be selectable in UI', function() {
      expect(this.results).toEqual([
        ['number', 'lon'],
        ['number', 'lat'],
        ['boolean', 'foobar']
      ]);
    });
  });
});
