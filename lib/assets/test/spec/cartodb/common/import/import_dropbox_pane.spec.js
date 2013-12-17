describe("ImportDropboxPane", function() {

  var view;

  beforeEach(function() {
    // Cartodb testing dropbox api
    // it needs -> development.localhost.lan
    // if not, all tests will pass :D
    cdb.config.set('dropbox_api_key',"6duyvwlhtdtyyfj");
  });

  it("should contain a label with the valid file extensions and a link", function() {
    var view = new cdb.admin.ImportDropboxPane();
    expect(view.$('label').length).toBe(1);
    expect(view.$('label a').attr('href')).toBe("http://developers.cartodb.com/documentation/using-cartodb.html#formats_accepted");
  });

  it("should contain a button with a specific id", function() {
    var view = new cdb.admin.ImportDropboxPane();
    view.render();
    expect(view.$('a#dropbox-chooser').length).toBe(1);
    view.clean();
  });

  it("should have a function preventing a button click", function() {
    var called = false;
    window.Dropbox = {};
    window.Dropbox.choose = function(obj){
      called = true;
    };

    var view = new cdb.admin.ImportDropboxPane({
      acceptFileTypes: ['jam', 'on']
    });

    view.render();
    spyOn(view, '_onDropboxClick');
    view.$('#dropbox-chooser').click();
    expect(called).toBeTruthy();
    view.clean();
  });

});
