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

  it("should contain an input with a specific type", function() {
    var view = new cdb.admin.ImportDropboxPane();
    view.render();
    expect(view.$('input[type="dropbox-chooser"]').length).toBe(1);
    view.clean();
  });

  it("should contain an input with specific valid file extensions", function() {
    var view = new cdb.admin.ImportDropboxPane({
      acceptFileTypes: ['jam', 'on']
    });
    view.render();
    expect(view.$('input[type="dropbox-chooser"]').attr("data-extensions")).toBe(".jam .on");
    view.clean();
  });

  it("should contain a dropbox button when script is loaded", function() {
    var view = new cdb.admin.ImportDropboxPane();
    $('body').append(view.render().el);
    
    waitsFor(function() {
      return window.Dropbox && Dropbox._dropinsjs_loaded;
    }, "Dropbox script never loaded", 4000);
    
    runs(function() {
      expect($('body').find('a.dropbox-dropin-btn').length).toBe(1);
      view.clean();
    })
  });

  // it("should send the trigger when Dropbox callback is success", function() {
  //   if (canRunTest()) {
  //     var view = new cdb.admin.ImportDropboxPane();
  //     $('body').append(view.render().el);
  //     var error = false;
  //     var success = false;

  //     waitsFor(function() {
  //       return Dropbox._dropinsjs_loaded;
  //     }, "Dropbox script never loaded", 4000);

  //     runs(function() {
  //       $("input#db-chooser").bind('DbxChooserSuccess', function() {
  //         success = true;
  //       });

  //       waitsFor(function() {
  //         return success;
  //       }, "Dropbox file never selected", 20000);

  //       runs(function() {
  //         expect(success).toBeTruthy();
  //         view.clean();
  //       });
  //     });      

  //   } else {
  //     console.log('You can\'t run Dropbox chooser tests due to the fact that your domain is not development.localhost.lan...');
  //   }
  // });


  function canRunTest() {
    if (
      window.location.origin.search('development.localhost.lan') != -1 ||
      window.location.origin.search('dev.localhost.lan') != -1
    ) return true
    return false
  }

});
