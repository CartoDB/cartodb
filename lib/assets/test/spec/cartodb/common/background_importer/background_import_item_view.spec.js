var cdb = require('cartodb.js-v3');
var ImportsModel = require('../../../../../javascripts/cartodb/common/background_polling/models/imports_model');
var BackgroundImportItemView = require('../../../../../javascripts/cartodb/common/background_polling/views/imports/background_import_item_view');

describe('common/background_polling/background_import_item_view', function() {

  beforeEach(function() {
    var user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });
    this.model = new ImportsModel();

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new BackgroundImportItemView({
      createVis: false,
      model: this.model,
      user: user
    });
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('ImportItem')).toBeTruthy();
    expect(this.view.$('.ImportItem-text').length).toBe(1);
  });

  it('should bind model changes', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('remove');
  });

  it('should stop upload and remove it when upload is aborted', function() {
    this.view.render();
    spyOn(this.view, 'clean');
    this.model.set('state', 'uploading');
    this.view.$('.js-abort').click();
    expect(this.view.clean).toHaveBeenCalled();
  });

  it('should show display_name when it is available from import model', function() {
    this.model.imp.set({ item_queue_id: 'hello-id', type: '' });
    this.model.set('state', 'importing');
    expect(this.view.$('.ImportItem-text').text()).toContain('hello-id');
    this.model.imp.set('display_name', 'table_name_test');
    this.model.set('state', 'geocoding');
    expect(this.view.$('.ImportItem-text').text()).toContain('table_name_test');
    expect(this.view.$('.ImportItem-text').text()).not.toContain('hello-id');
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});
