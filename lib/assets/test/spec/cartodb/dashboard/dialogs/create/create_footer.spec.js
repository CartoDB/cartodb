var CreateFooterView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_footer');
var CreateModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var MapTemplates = require('../../../../../../javascripts/cartodb/common/map_templates');

describe('common/dialogs/create/create_footer_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });

    this.model = new CreateModel({
      type: "dataset",
      option: "listing"
    }, {
      user: this.user
    });

    this.view = new CreateFooterView({
      user: this.user,
      createModel: this.model,
      currentUserUrl: this.currentUserUrl
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view.render();
  });

  it('should bind createModel attribute changes', function() {
    this.view._initBinds();
    var args = this.model.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    var args0 = this.model.bind.calls.argsFor(1);
    expect(args0[0]).toEqual('change:upload');
    var args1 = this.model.bind.calls.argsFor(2);
    expect(args1[0]).toEqual('change:option');
    var args2 = this.model.bind.calls.argsFor(3);
    expect(args2[0]).toEqual('change:listing');
  });

  describe('guessing toggler', function() {
    it('should not change guessing model when upload changes', function() {
      expect(this.view.guessingModel.get('guessing')).toBeTruthy();
      expect(this.model.upload.get('type_guessing')).toBeTruthy();
      expect(this.model.upload.get('content_guessing')).toBeTruthy();
      this.model.upload.setGuessing(false);
      expect(this.view.guessingModel.get('guessing')).toBeTruthy();
      expect(this.model.upload.get('type_guessing')).toBeFalsy();
      expect(this.model.upload.get('content_guessing')).toBeFalsy();
    });

    it('should change guessing values when upload is ready to start', function() {
      this.view.guessingModel.set('guessing', true);
      this.model.upload.set({
        type: 'url',
        value: 'https://carto.com/csv.example'
      });
      this.model.upload.setGuessing(false);
      this.view._connectDataset();
      expect(this.model.upload.get('type_guessing')).toBeTruthy();
      expect(this.model.upload.get('content_guessing')).toBeTruthy();
    });
  });

  describe('privacy toggler', function() {

    beforeEach(function() {
      this.model.set({
        listing: 'import',
        type: 'datasets'
      });
    });

    it('should not change privacy model when upload changes', function() {
      expect(this.view.privacyModel.get('privacy')).toBe('PUBLIC');
      this.model.upload.set('privacy', 'PRIVATE');
      expect(this.view.privacyModel.get('privacy')).toBe('PUBLIC');
      expect(this.model.upload.get('privacy')).toBe('PRIVATE');
    });

    it('should change privacy value when upload is ready to start', function() {
      this.view.privacyModel.set('privacy', 'PRIVATE');
      this.model.upload.set({
        type: 'url',
        value: 'https://carto.com/csv.example',
        privacy: 'PUBLIC'
      });
      this.view._connectDataset();
      expect(this.model.upload.get('privacy')).toBe('PRIVATE');
    });

    it('should not change privacy value if create model is not in import state', function() {
      this.model.set({
        listing: '',
        type: 'maps'
      });
      this.view.privacyModel.set('privacy', 'PRIVATE');
      this.model.upload.set({
        type: 'url',
        value: 'https://carto.com/csv.example',
        privacy: 'PUBLIC'
      });
      this.view._connectDataset();
      expect(this.model.upload.get('privacy')).not.toBe('PRIVATE');
    });

  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
