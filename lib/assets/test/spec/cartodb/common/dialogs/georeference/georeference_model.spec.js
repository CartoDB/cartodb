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

  describe('.selectedTabModel', function() {
    it('should return the currently selected item', function() {
      expect(this.model.selectedTabModel()).toBe(this.model.get('options').first());

      var newOpt = this.model.get('options').last();
      newOpt.set('selected', true);
      this.model.changedSelectedTab(newOpt);
      expect(this.model.selectedTabModel()).toBe(this.model.get('options').last());
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
        ['lon', 'number'],
        ['lat', 'number'],
        ['foobar', 'boolean']
      ]);
    });
  });
});
