var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
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
      options: {
        type: 'url',
        fileEnabled: true,
        acceptSync: true
      }
    });

    this.view.render();
  });

  it('should be rendered properly', function() {
    expect(this.view.$('.ImportTwitterPanel-cagetories').length).toBe(1);
    expect(this.view.$('.ImportTwitterPanel-datePicker').length).toBe(1);
    expect(this.view.$('.ImportTwitterPanel-creditsUsage').length).toBe(1);
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});