var cdb = require('cartodb.js-v3');
var FeatureDataDialogView = require('../../../../../javascripts/cartodb/common/dialogs/feature_data/feature_data_dialog_view');

describe('common/dialogs/feature_data_dialog', function() {

  beforeEach(function() {

    this.rowModel = new cdb.admin.Row({
      cartodb_id: 1,
      test: 'test',
      test1: 1,
      test2: null,
      test3: null,
      the_geom: '{ "type": "Point", "coordinates": [100.0, 0.0] }'
    });

    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'testTable',
      name: 'testTable',
      schema: [ ['cartodb_id', 'number'], ['test', 'string'], ['test1', 'number'], ['test2', 'boolean'], ['test3', 'date'], ['the_geom', 'geometry']],
      geometry_types: ['ST_MultiPoint']
    });

    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });

    this.view = new FeatureDataDialogView({
      row: this.rowModel,
      provider: "leaflet",
      baseLayer: new cdb.geo.TileLayer({ id: 'baselayer_0' }),
      dataLayer: new cdb.admin.CartoDBLayer({ id: 'layer_0' }),
      currentZoom: 8,
      enter_to_confirm: false,
      table: this.table,
      user: this.user,
      clean_on_hide: true
    });
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('.js-map').length).toBe(1); // map
    expect(this.view.$('.js-form').length).toBe(1);
    expect(this.view.$('.js-addField').length).toBe(1); // Add column
    expect(this.view.$('.IntermediateInfo').length).toBe(2); // Loading and error divs
    expect(this.view.$('.Spinner').length).toBe(1); // Loading
    expect(this.view.$('.LayoutIcon.LayoutIcon--negative').length).toBe(1); // Error
  });

  it("should create panes and needed form", function() {
    expect(this.view._panes).not.toBeUndefined();
    expect(_.size(this.view._panes._subviews)).toBe(3);
  });

  describe('form view', function() {

    beforeEach(function() {
      this.form = this.view.form;
      this.firstFieldView = this.form._subviews[Object.keys(this.form._subviews)[1]];
    });

    it('should render as many fields as row model has', function() {
      expect(this.form.collection.size(4));
      expect(this.form.$('.Form-row').length).toBe(5); // cartodb_id and the_geom excluded, add-column element added
      expect(this.form.$('.Form-row textarea').length).toBe(1);
      expect(this.form.$('.Form-row input.is-number').length).toBe(1);
      expect(this.form.$('.Form-row .RadioButton').length).toBe(3);
      expect(this.form.$('.Form-row .DatePicker').length).toBe(1);
      expect(this.form.$('.Form-row .TimeInput').length).toBe(1);
      expect(this.form.$('.EditField-select').length).toBe(4);
    });

    describe('change column name', function() {

      beforeEach(function() {
        this.$columnNameInput = this.firstFieldView.$('.js-columnName');
      });

      it('should change the name of the column if it is valid', function() {
        cdb.admin.Column.prototype.sync = function(a,b,opts) {
          opts.success(
            new cdb.core.Model({
              _name: 'paco'
            })
            , { _name: 'paco' }
          );
        };
        this.$columnNameInput
          .val('paco')
          .focusout();

        expect(this.$columnNameInput.val()).toBe('paco');
        expect(this.$columnNameInput.hasClass('has-failed')).toBeFalsy();
      });

      it('shouldn\'t change the name of the column if it is invalid', function() {
        cdb.admin.Column.prototype.sync = function(a,b,opts) {
          opts.error('{"errors": ["this is an error"]}');
        };
        this.$columnNameInput
          .val('paco')
          .focusout();

        expect(this.firstFieldView.fieldModel.get('value')).toBe('test');
      });

    });

    describe('change column type', function() {

      beforeEach(function() {
        this.$columnTypeSelect = this.firstFieldView.$('.select2-container');
      });

      it('should change the type of the column if it works', function() {
        var self = this;
        cdb.admin.Column.prototype.sync = function(a,b,opts) {
          opts.success(
            new cdb.core.Model({
              _name: 'paco'
            })
            , { _name: 'paco' }
          );
        };

        spyOn(this.firstFieldView,'_refreshRecordData').and.returnValue(function() {
          self.firstFieldView.fieldModel.set('readOnly', false);
        });

        expect(this.firstFieldView.$('textarea').length).toBe(1);

        this.firstFieldView.fieldModel.set({
          value: null,
          type: 'date'
        });

        expect(this.firstFieldView.$('textarea').length).toBe(0);
        expect(this.firstFieldView.$('.DatePicker').length).toBe(1);
        expect(this.firstFieldView.$('.TimeInput').length).toBe(1);
      });

      it('shouldn\'t change the column type if it fails', function() {
        var self = this;
        cdb.admin.Column.prototype.sync = function(a,b,opts) {
          opts.error('{"errors": ["this is an error"]}');
        };

        spyOn(this.firstFieldView,'_refreshRecordData').and.returnValue(function() {
          self.firstFieldView.fieldModel.set('readOnly', false);
        });

        expect(this.firstFieldView.$('textarea').length).toBe(1);

        this.firstFieldView.fieldModel.set({
          value: null,
          type: 'date'
        });

        expect(this.firstFieldView.$('textarea').length).toBe(1);
        expect(this.firstFieldView.$('.DatePicker').length).toBe(0);
        expect(this.firstFieldView.$('.TimeInput').length).toBe(0);
      });
    });

    describe('add column', function() {

      it('should add a column when link is clicked', function() {
        var columnName = '';
        cdb.admin.Column.prototype.sync = function(a,b,opts) {
          columnName = b.get('_name');
          opts.success(b)
        };
        this.form.$('.js-addColumn').click();
        expect(this.form.collection.size(5));
        expect(this.form.$('.Form-row').length).toBe(6);
        expect(this.form.collection.last().get('attribute')).toBe(columnName);
        expect(this.form.collection.last().get('value')).toBeNull();
        expect(this.form.collection.last().get('type')).toBe('string');
      });

      it('should not add a new column when it fails', function() {
        cdb.admin.Column.prototype.sync = function(a,b,opts) {
          opts.error()
        };
        this.form.$('.js-addColumn').click();
        expect(this.form.collection.size(4));
        expect(this.form.$('.Form-row').length).toBe(5);
        expect(this.form.$('.DefaultParagraph.DefaultParagraph--error').length).toBe(1);
        expect(this.form.$('.DefaultParagraph .js-addColumn').length).toBe(1);
      });

    });

  });

  describe('saving state', function() {

    it('should not save if attributes have not changed', function(){
      var called = false;
      this.rowModel.sync = function(a,b,opts) { called = true };
      this.view._changeAttributes({});
      expect(called).toBeFalsy();
    });

    it('should save if attributes have changed', function(){
      var called = false;
      this.rowModel.sync = function(a,b,opts) { called = true };
      this.view._changeAttributes([{ attribute: 'test', value: 'phew' }]);
      expect(called).toBeTruthy();
    });

    it('should not unset reserved columns or model id if attributes have changed', function(){
      var data = {};
      this.rowModel.save = function(d,opts) { data = d };
      this.view._changeAttributes([{ attribute: 'test', value: 'phew' }]);
      expect(data.id).toBeUndefined();
      expect(data.cartodb_id).toBeUndefined();
      expect(data.the_geom).toBeUndefined();
      expect(data.the_geom_webmercator).toBeUndefined();
      expect(data.updated_at).toBeUndefined();
      expect(data.created_at).toBeUndefined();
    });

    it('should show loading when model is saving', function(){
      var self = this;
      this.rowModel.sync = function(a,b,opts) {};
      this.view._changeAttributes([{ attribute: 'test', value: 'paco' }]);
      expect(this.view._panes.activeTab).toBe('loading');
    });

    it('should show error state when model save has failed', function(){
      var self = this;
      this.rowModel.sync = function(a,b,opts) { opts.error() };
      this.view._changeAttributes([{ attribute: 'test', value: '1' }]);
      expect(this.view._panes.activeTab).toBe('error');
      expect(this.rowModel.get('test')).not.toBe('1');
    });

    it('should trigger onDone when save worked', function(){
      var self = this;
      var called = false;
      this.view.options.onDone = function() {
        called = true;
      }
      this.rowModel.sync = function(a,b,opts) { opts.success() };
      this.view._changeAttributes([{ attribute: 'test2', value: 'lol' }]);
      expect(called).toBeTruthy();
    });

  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});
