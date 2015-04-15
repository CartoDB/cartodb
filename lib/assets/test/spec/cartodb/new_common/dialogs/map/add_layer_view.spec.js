var AddLayerView = require('../../../../../../javascripts/cartodb/new_common/dialogs/map/add_layer_view');
var AddLayerModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/map/add_layer_model');

describe('new_common/dialogs/map/add_layer_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://cartodb.com'
    });

    this.model = new AddLayerModel({
    }, {
      user: this.user
    });

    spyOn(AddLayerView.prototype, 'hide');
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

  describe('when model is adding new layer', function() {
    beforeEach(function() {
      this.model.set('contentPane', 'loading');
    });

    it('should show the adding-layer view instead', function() {
      expect(this.view._contentPane.getActivePane()).toBe(this.view._contentPane.getPane('loading'));
      expect(this.view._contentPane.getActivePane()).not.toBe(this.view._contentPane.getPane('listing'));
    });
  });

  describe('when adding layer is done', function() {
    beforeEach(function() {
      this.model.trigger('addLayerDone');
    });

    it('should hide the dialog', function() {
      expect(AddLayerView.prototype.hide).toHaveBeenCalled();
    });
  });

  describe('when selecting a remote dataset', function() {
    beforeEach(function() {
      cdb.god.trigger('remoteSelected');
    });

    it('should close the dialog', function() {
      expect(AddLayerView.prototype.close).toHaveBeenCalled();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
