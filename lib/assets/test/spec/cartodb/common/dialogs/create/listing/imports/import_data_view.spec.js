var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');
var ImportDataView = require('../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/imports/import_data_view');


describe('common/dialogs/create/imports/import_data_view', function() {

  beforeEach(function() {
    
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.cartodb.com'
    });

    this.view = new ImportDataView({
      user: this.user,
      name: 'file',
      title: 'Data file',
      type: 'url',
      fileEnabled: true,
      acceptSync: true
    });

    spyOn(this.view.model, 'bind').and.callThrough();

    this.view.render();
  });

  it('should be rendered properly', function() {
    expect(this.view.$('.ImportPanel-header').length).toBe(1);
    expect(this.view.$('.ImportPanel-form').length).toBe(1);
    expect(this.view.$('.DatasetSelected').length).toBe(1);
    expect(_.size(this.view._subviews)).toBe(3);
  });

  it('should have change state binding', function() {
    expect(this.view.model.bind.calls.argsFor(0)[0]).toEqual('change:state');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});