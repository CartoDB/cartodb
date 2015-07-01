var cdb = require('cartodb.js');
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
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.cartodb.com'
    });
    this.model = new GeoreferenceModel({
      table: this.table,
      user: this.user
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
