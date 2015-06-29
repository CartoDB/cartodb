var GeoreferenceModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/georeference_model');

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
    this.model = new GeoreferenceModel({
      table: this.table
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

  describe('.decorateGeocodeData', function() {
    it('should add the table name', function() {
      this.results = this.model.decorateGeocodeData({});
      expect(this.results.table_name).toEqual('a');
    });

    it('should set location to World and text to true when there is no location or using free text and contains world', function() {
      this.results = this.model.decorateGeocodeData({
        location: ''
      });
      expect(this.results.location).toEqual('world');
      expect(this.results.text).toBe(true);

      this.results = this.model.decorateGeocodeData({
        text: true,
        location: 'for some reason if this contains world it should change it'
      });
      expect(this.results.location).toEqual('world');
      expect(this.results.text).toBe(true);
    });

    it('should change kind to admin0 if it is admin1 and is world', function() {
      this.results = this.model.decorateGeocodeData({
        kind: 'admin1',
        text: true,
        location: 'for some reason if this contains world it should change it'
      });
      expect(this.results.kind).toEqual('admin0');

      // isWorld === false
      this.results = this.model.decorateGeocodeData({
        kind: 'admin1',
        location: 'some place',
        text: false
      });
      expect(this.results.kind).toEqual('admin1');
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
