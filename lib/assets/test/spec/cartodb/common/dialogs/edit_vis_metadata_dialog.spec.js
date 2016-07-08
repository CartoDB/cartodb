var cdb = require('cartodb.js-v3');
var EditVisMetadataDialogView = require('../../../../../javascripts/cartodb/common/dialogs/edit_vis_metadata/edit_vis_metadata_dialog_view');


describe("common/dialogs/edit_vis_metadata_dialog", function() {

  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      name: 'hello vis',
      description: 'hello hello description',
      tags: ['hello', 'hey', 'howdy'],
      privacy: 'PUBLIC'
    });
    this.dataLayer = new cdb.admin.CartoDBTableMetadata({ name: 'test' });
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });
    this.initView = function() {
      if (this.view) {
        this.view.clean();
      }
      this.view = new EditVisMetadataDialogView({
        user: this.user,
        dataLayer: this.dataLayer,
        vis: this.vis,
        clean_on_hide: false
      });
      this.model = this.view.model;
      this.view.render();
    };
    this.initView();
  });

  it('should render properly', function() {
    expect(this.view.$('.js-content').length).toBe(1);
    expect(this.view.$('.js-form').length).toBe(1);
    expect(this.view._panes).toBeDefined();
    expect(this.view._panes.size()).toBe(3);
  });

  describe("model", function() {

    it("should generate a proper model", function() {
      expect(this.model.get('name')).toBe(this.vis.get('name'));
      expect(this.model.get('description')).toBe(this.vis.get('description'));
      expect(this.model.get('tags')).toBe(this.vis.get('tags'));
      expect(this.model.get('privacy')).toBe(this.vis.get('privacy'));
    });

    it('should not have the datasets-only attrs', function() {
      expect(this.model.get('source')).toBeUndefined();
      expect(this.model.get('attributions')).toBeUndefined();
      expect(this.model.get('license')).toBeUndefined();
    });

    describe('vis type derived', function() {
      it("should let edit name and rest of attributes when vis is derived", function() {
        expect(this.model.isNameEditable()).toBeTruthy();
        expect(this.model.isMetadataEditable()).toBeTruthy();
      });
    });

    describe('vis type table', function() {

      beforeEach(function() {
        this.vis.set({
          type: 'table',
          name: 'hello_dataset',
          source: 'http://foobar.com',
          display_name: 'Hello Dataset',
          attributions: 'CC',
          license: 'mit'
        });
        this.initView();
      });

      it('should have additional props on view model', function() {
        expect(this.model.get('source')).toBe(this.vis.get('source'));
        expect(this.model.get('attributions')).toBe(this.vis.get('attributions'));
        expect(this.model.get('license')).toBe(this.vis.get('license'));
        expect(this.model.get('display_name')).toBe(this.vis.get('display_name'));
      });

      it('should have additional props on view model with fallback values', function() {
        this.vis.unset('source');
        this.vis.unset('attributions');
        this.vis.unset('license');
        this.vis.unset('display_name');
        this.initView();
        expect(this.model.get('source')).toEqual('');
        expect(this.model.get('attributions')).toEqual('');
        expect(this.model.get('license')).toEqual('');
        expect(this.model.get('display_name')).toEqual('');
      });

      it("should let edit name and rest of attributes when vis is table", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        expect(this.model.isNameEditable()).toBeTruthy();
        expect(this.model.isMetadataEditable()).toBeTruthy();
      });

      it("shouldn't let edit name but it is possible to edit rest of attributes when dataLayer is synced", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(true);
        expect(this.model.isNameEditable()).toBeFalsy();
        expect(this.model.isMetadataEditable()).toBeTruthy();
      });

      it("shouldn't let edit anything when table owner is different", function() {
        spyOn(this.dataLayer.permission, 'isOwner').and.returnValue(false);
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        expect(this.model.isNameEditable()).toBeFalsy();
        expect(this.model.isMetadataEditable()).toBeFalsy();
      });

    });

    it('should send set an error when name is blank', function() {
      var signal = false;
      this.model.bind('error', function() {
        signal = true;
      })
      this.model.set('name', '');
      expect(this.model.getError()).toBe('Name can\'t be blank');
      expect(signal).toBeTruthy();
    });

    it('should send a valid signal when attributes are valid', function() {
      var signal = false;
      this.model.bind('valid', function() {
        signal = true;
      })
      this.model.set('name', '');
      expect(this.model.getError()).toBe('Name can\'t be blank');
      expect(signal).toBeFalsy();
      this.model.set('name', 'paco');
      expect(signal).toBeTruthy();
      expect(this.model.getError()).toBe('');
    });
  });

  describe('form view', function() {

    it('should render properly', function() {
      expect(this.view.$('.js-name').length).toBe(1);
      expect(this.view.$('.js-name').val()).toBe('hello vis');
      expect(this.view.$('.js-description').length).toBe(1);
      expect(this.view.$('.js-description').val()).toBe('hello hello description');
      expect(this.view.$('.js-tags').length).toBe(1);
      expect(this.view.$('.js-tagsList .tagit-choice').length).toBe(3);
      expect(this.view.$('.js-privacy').length).toBe(1);
      expect(this.view.$('.js-privacy').text()).toBe('public');
    });

    it('should not render dataset-only fields', function() {
      expect(this.view.$('.js-license').length).toBe(0);
      expect(this.view.$('.js-source').length).toBe(0);
      expect(this.view.$('.js-attributions').length).toBe(0);
      expect(this.view.$('.js-displayName').length).toBe(0);
    });

    describe('with table change', function() {
      beforeEach(function() {
        this.vis.set({
          type: 'table',
          name: 'hello_dataset',
          source: 'http://foobar.com',
          attributions: 'CC',
          licence: 'mit',
          display_name: 'Hello Dataset'
        });
        this.initView();
      });

      it("should let edit name and rest of attributes", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        this.view.render();
        expect(this.view.$('.js-source').length).toBe(1);
        expect(this.view.$('.js-source').val()).toBe('http://foobar.com');
        expect(this.view.$('.js-attributions').length).toBe(1);
        expect(this.view.$('.js-attributions').val()).toBe('CC');
        expect(this.view.$('.js-name').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-description').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-source').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-attributions').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-license').length).toBe(1);
        expect(this.view.$('.js-tags').hasClass('is-disabled')).toBeFalsy();
        expect(this.view.$('.js-privacy').length).toBe(1);
      });

      it("shouldn't let edit name but it is possible to edit rest of attributes when dataLayer is synced", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(true);
        this.view.render();
        expect(this.view.$('.js-name').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-description').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-source').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-attributions').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-tags').hasClass('is-disabled')).toBeFalsy();
        expect(this.view.$('.js-privacy').length).toBe(1);
      });

      it("shouldn't let edit anything when table owner is different", function() {
        spyOn(this.dataLayer.permission, 'isOwner').and.returnValue(false);
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        this.view.render();
        expect(this.view.$('.js-name').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-description').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-source').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-attributions').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-tags').hasClass('is-disabled')).toBeTruthy();
        expect(this.view.$('.js-privacy').length).toBe(0);
      });

      it("should render display name when user has data_library enabled", function() {
        spyOn(this.dataLayer.permission, 'isOwner').and.returnValue(true);
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        this.view.render();
        expect(this.view.$('.js-displayName').length).toBe(0);
        spyOn(this.user, 'featureEnabled').and.returnValue(true);
        this.view.render();
        expect(this.view.$('.js-displayName').length).toBe(1);
      });
    });

  });

  describe('saving state', function() {

    it('should not save if attributes have not changed', function(){
      var called = false;
      this.vis.sync = function(a,b,opts) {
        called = true;
      };
      this.view._saveAttributes();
      expect(called).toBeFalsy();
    });

    it('should save if attributes have changed', function(){
      var called = false;
      this.vis.sync = function(a,b,opts) {
        called = true;
      };
      this.model.set('tags', ['hey', 'howdy']);
      this.view._saveAttributes();
      expect(called).toBeTruthy();
    });

    it('should show loading when model is saving', function(){
      var self = this;

      this.vis.sync = function(a,b,opts) {};

      this.model.set('description', 'paco');
      this.view._saveAttributes();
      expect(this.view._panes.activeTab).toBe('loading');
    });

    it('should show error state when model save has failed', function(){
      var self = this;

      this.vis.sync = function(a,b,opts) {
        opts.error();
      };

      this.model.set('description', 'paco');
      this.view._saveAttributes();
      expect(this.view._panes.activeTab).toBe('error');
      expect(this.vis.get('description')).not.toBe('paco');
    });

    it('should hide the dialog when save worked', function(){
      var self = this;

      spyOn(this.view, 'hide');
      this.vis.sync = function(a,b,opts) {
        opts.success({});
      };

      this.model.set('description', 'paco');
      this.view._saveAttributes();
      expect(this.view.hide).toHaveBeenCalled();
    });

  });

  it('should not have any leak', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean()
  })

});
