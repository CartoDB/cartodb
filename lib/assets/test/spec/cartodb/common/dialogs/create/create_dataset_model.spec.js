var cdb = require('cartodb.js-v3');
var CreateDataModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_dataset_model');
var sharedForCreateListingViewModel = require('./shared_for_create_listing_view_model');
var sharedForCreateListingImportViewModel = require('./listing/shared_for_import_view_model');

describe('common/dialogs/create/create_dataset_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'paco',
      base_url: 'http://url.com'
    });

    this.model = new CreateDataModel({
    }, {
      user: this.user
    });
  });

  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);

  it('should have default values', function() {
    expect(this.model.get('type')).toBeDefined();
    expect(this.model.get('option')).toBeDefined();
  });

  it('should define several local models', function() {
    expect(this.model.upload).toBeDefined();
  });

  describe('.createFromScratch', function() {
    it('should change state when dataset creation starts', function() {
      spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save');
      this.model.createFromScratch();
      expect(this.model.get('option')).toBe('loading');
    });

    it('should trigger datasetCreated when it is created', function() {
      spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save').and.callFake(function(a, opts){
        opts.success();
      });
      var called = false;
      this.model.bind('datasetCreated', function(){ called = true });
      this.model.createFromScratch();
      expect(called).toBeTruthy();
    });

    it('should trigger datasetError when it fails', function() {
      spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save').and.callFake(function(a, opts){
        opts.error();
      });
      var called = false;
      this.model.bind('datasetError', function(){ called = true });
      this.model.createFromScratch();
      expect(called).toBeTruthy();
    });
  });

  describe('when listing', function () {
    it('should detect which', function () {
      this.model.set('listing', 'import');
      expect(this.model._atImportPane()).toBe(true);

      this.model.set('listing', 'datasets');
      expect(this.model._atImportPane()).toBe(false);
      expect(this.model._atDatasetsPane()).toBe(true);

      this.model.set('listing', 'scratch');
      expect(this.model._atDatasetsPane()).toBe(false);
      expect(this.model._atScratchPane()).toBe(true);
    });

    it('should detect "twitter import pane"', function () {
      this.model.set('listing', 'import');

      this.model.set('option', 'listing.import.twitter');
      expect(this.model._atTwitterImportPane()).toBe(true);

      this.model.set('option', '*whatever-else*');
      expect(this.model._atTwitterImportPane()).toBe(false);
    });

    describe('and deciding on togglers', function () {
      it('should decide to show "guessing toggler" if at import', function () {
        this.model.set('listing', 'import');
        expect(this.model.showGuessingToggler()).toBe(true);

        this.model.set('listing', 'datasets');
        expect(this.model.showGuessingToggler()).toBe(true); // it seems to be the desired behaviour
      });

      it('should decide to show "privacy toggler" if at import (unless deprecated twitter)', function () {
        this.model.set('listing', 'import');

        this.model.set('option', '*whatever-but-twitter*');
        expect(this.model.showPrivacyToggler()).toBe(true);

        this.model.set('option', 'listing.import.twitter');
        var spy = spyOn(this.user, 'hasOwnTwitterCredentials');
        spy.and.returnValue(true);
        expect(this.model.showPrivacyToggler()).toBe(true);

        spy.and.returnValue(false);
        expect(this.model.showPrivacyToggler()).toBe(false);
      });
    });
  });

});
