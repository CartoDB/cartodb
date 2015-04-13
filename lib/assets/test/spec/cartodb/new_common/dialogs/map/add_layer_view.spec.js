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

    this.view = new AddLayerView({
      model: this.model,
      user: this.user
    });
    this.view.render();
  });

  it('should render the view', function() {
    expect(this.innerHTML()).toContain('Add a new layer');
    expect(this.innerHTML()).toContain('Connect dataset');
    expect(this.innerHTML()).toContain('Data library');
  });

  afterEach(function() {
    this.view.clean();
  });
});
