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

    this.view.render();
  });

  it('should be rendered properly', function() {
    expect(this.view.$('.ImportPanel-header').length).toBe(1);
    expect(this.view.$('.ImportPanel-form').length).toBe(1);
    expect(this.view.$('.DatasetSelected').length).toBe(1);
    expect(_.size(this.view._subviews)).toBe(3);
  });

  describe('header view', function() {

  });

  describe('data form', function() {
    
    it('should render file input if option is enabled', function() {
      expect(this.view.$('.js-dropzone').length).toBe(1);
      this.view.options.fileEnabled = false;
      this.view.render();
      expect(this.view.$('.ImportPanel-form .Form-file').length).toBe(0);
    });

  });

  describe('selected file', function() {

  });



  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});