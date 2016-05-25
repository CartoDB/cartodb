var AddLayerView = require('../../../../../../javascripts/cartodb/common/dialogs/map/add_layer_view');
var AddLayerModel = require('../../../../../../javascripts/cartodb/common/dialogs/map/add_layer_model');

describe('common/dialogs/map/add_layer_view', function() {
  beforeEach(function() {
    cdb.config.set('data_library_enabled', true);
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'https://cartodb.com'
    });

    this.model = new AddLayerModel({
    }, {
      user: this.user
    });

    spyOn(AddLayerView.prototype, 'close');

    this.view = new AddLayerView({
      model: this.model,
      user: this.user
    });
    this.view.render();
  });

  it('should render the view as expected', function() {
    expect(this.view._contentPane.getActivePane()).toBe(this.view._contentPane.getPane('listing'));
    expect(this.innerHTML()).toContain('Add a new layer');
    expect(this.innerHTML()).toContain('Connect dataset');
    expect(this.innerHTML()).toContain('Data library');
    expect(this.innerHTML()).toContain('Add an empty layer');
  });

  it('should render the view without data library if disabled', function() {
    cdb.config.set('data_library_enabled', false);
    this.view.render();

    expect(this.view._contentPane.getActivePane()).toBe(this.view._contentPane.getPane('listing'));
    expect(this.innerHTML()).toContain('Add a new layer');
    expect(this.innerHTML()).toContain('Connect dataset');
    expect(this.innerHTML()).not.toContain('Data library');
    expect(this.innerHTML()).toContain('Add an empty layer');
  });

  describe('when model is adding new layer', function() {
    beforeEach(function() {
      this.model.set('contentPane', 'addingNewLayer');
    });

    it('should show the adding-layer view instead', function() {
      expect(this.view._contentPane.getActivePane()).toBe(this.view._contentPane.getPane('addingNewLayer'));
      expect(this.view._contentPane.getActivePane()).not.toBe(this.view._contentPane.getPane('listing'));
    });
  });

  describe('when adding layer is done', function() {
    beforeEach(function() {
      this.model.trigger('addLayerDone');
    });

    it('should close the dialog', function() {
      expect(AddLayerView.prototype.close).toHaveBeenCalled();
    });
  });

  describe('when selecting a remote dataset', function() {
    beforeEach(function() {
      cdb.god.trigger('importByUploadData');
    });

    it('should close the dialog', function() {
      expect(AddLayerView.prototype.close).toHaveBeenCalled();
    });
  });

  describe('when clicking ok', function() {
    beforeEach(function() {
      this.model.set('listing', 'import');
      spyOn(this.model, 'finish');
    });

    describe('when no import is selected', function() {
      beforeEach(function() {
        this.view.$('.js-ok').click();
      });

      it('should do nothing until there is some upload data ', function() {
        expect(this.model.finish).not.toHaveBeenCalled();
      });
    });

    describe('when there is a upload data set', function() {
      beforeEach(function() {
        this.model.upload.set('value', 'foobar');
        this.model.finish.and.callThrough();
        this.view.$('.js-ok').click();
      });

      it('should add layer from import', function() {
        expect(this.model.finish).toHaveBeenCalled();
      });

      it('should close the view', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
