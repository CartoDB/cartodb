var cdb = require('cartodb.js');
var EditVisMetadataDialogView = require('../../../../javascripts/cartodb/common/dialogs/edit_vis_metadata/edit_vis_metadata_dialog_view');


describe("common/dialogs/edit_vis_metadata_dialog", function() {

  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      name: 'hello vis',
      description: 'hello hello description',
      source: 'http://foobar.com',
      attributions: 'CC',
      tags: ['hello', 'hey', 'howdy'],
      privacy: 'PUBLIC'
    });
    this.dataLayer = new cdb.admin.CartoDBTableMetadata({ name: 'test' });
    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
    });
    this.view = new EditVisMetadataDialogView({
      user: this.user,
      dataLayer: this.dataLayer,
      vis: this.vis,
      clean_on_hide: false
    });
    this.model = this.view.model;
    this.view.render();
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
      expect(this.model.get('source')).toBe(this.vis.get('source'));
      expect(this.model.get('attributions')).toBe(this.vis.get('attributions'));
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
          name: 'hello_dataset'
        });
      });

      it("should let edit name and rest of attributes when vis is table", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        expect(this.model.isNameEditable()).toBeTruthy();
        expect(this.model.isMetadataEditable()).toBeTruthy();
      });

      it("shouldn't let edit name and rest of attributes when dataLayer has a query applied", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(true);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(true);
        expect(this.model.isNameEditable()).toBeFalsy();
        expect(this.model.isMetadataEditable()).toBeFalsy();
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
      expect(this.view.$('.js-source').length).toBe(1);
      expect(this.view.$('.js-source').val()).toBe('http://foobar.com');
      expect(this.view.$('.js-attributions').length).toBe(1);
      expect(this.view.$('.js-attributions').val()).toBe('CC');
      expect(this.view.$('.js-tags').length).toBe(1);
      expect(this.view.$('.js-tagsList .tagit-choice').length).toBe(3);
      expect(this.view.$('.js-privacy').length).toBe(1);
      expect(this.view.$('.js-privacy').text()).toBe('public');
    });

    describe('with table change', function() {
      beforeEach(function() {
        this.vis.set({
          type: 'table',
          name: 'hello_dataset'
        });
      })

      it("should let edit name and rest of attributes when vis is table", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(false);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(false);
        this.view.render();
        expect(this.view.$('.js-name').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-description').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-source').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-attributions').is('[readonly]')).toBeFalsy();
        expect(this.view.$('.js-tags').hasClass('is-disabled')).toBeFalsy();
        expect(this.view.$('.js-privacy').length).toBe(1);
      });

      it("shouldn't let edit name and rest of attributes when dataLayer has a query applied", function() {
        spyOn(this.dataLayer, 'isInSQLView').and.returnValue(true);
        spyOn(this.dataLayer, 'isReadOnly').and.returnValue(true);
        this.view.render();
        expect(this.view.$('.js-name').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-description').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-source').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-attributions').is('[readonly]')).toBeTruthy();
        expect(this.view.$('.js-tags').hasClass('is-disabled')).toBeTruthy();
        expect(this.view.$('.js-privacy').length).toBe(0);
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
    })

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
