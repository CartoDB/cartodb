describe("ImportArcgisPane", function() {

  var view, user;

  beforeEach(function() {
    user = TestUtil.createUser('test');
    var actions = user.get('actions');
    actions.sync_tables = true;
    user.set('actions', actions);

    view = new cdb.admin.ImportArcGISPane({
      user: user
    });
  });

  it("should render properly", function() {
    expect(view.$('input.url-input').length).toBe(1);
    expect(view.$('.message').length).toBe(1)
    expect(view.import_info).toBeDefined();
  });

  it("should add an active class when input is focus", function() {
    view.$('input.url-input').focusin();
    expect(view.$('div.upload').hasClass('active')).toBeTruthy();
    view.$('input.url-input').focusout();
    expect(view.$('div.upload').hasClass('active')).toBeFalsy();
  });

  it("should appear sync options when url is valid", function(done) {
    view.$('input.url-input')
      .val('http://har.es/jar')
      .trigger(jQuery.Event( 'keydown', { which: 11 } ));
    
    setTimeout(function() {
      expect(view.$('.info.sync').hasClass('active')).toBeTruthy();

      view.$('input.url-input')
        .val('uh')
        .trigger(jQuery.Event( 'keydown', { which: 11 } ));
      expect(view.$('.info.sync').hasClass('active')).toBeFalsy();
      
      done();
    },200);
  });

  it("should show error module if user submit the form with a non valid url", function(done) {
    view.$('input.url-input')
      .val('non-valid-url')
      .trigger(jQuery.Event( 'keydown', { which: 13 } ));
    
    setTimeout(function() {
      expect(view.$('.info.error').css('display')).toBe('block');
      done();
    },200);
  });

  it("should send attributes when ENTER is pressed within text input", function(done) {
    var sent = false;

    view.bind('fileChosen', function() {
      sent = true;
    });

    view.$('input.url-input')
      .val('http://test-url.org/huh')
      .trigger(jQuery.Event( 'keydown', { which: 11 } ));

    setTimeout(function() {
      view.$('input.url-input').trigger(jQuery.Event( 'keydown', { which: 13 } ));
      expect(sent).toBeTruthy();   
      done();
    }, 200);
  });

});
