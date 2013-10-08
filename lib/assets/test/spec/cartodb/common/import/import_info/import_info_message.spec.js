describe("ImportInfoMessage", function() {

  var view;

  beforeEach(function() {
    view = new cdb.admin.ImportInfo.Message({ msg: '' });
  });

  it("should render properly", function() {
    view.render();
    expect(view.$('p').length).toBe(1);
    expect(view.$('p').text()).toBe('')
  });

  it("should let you to set a new message", function() {
    view.render();
    view.setMessage('come on dude!');
    expect(view.$('p').text()).toBe("come on dude!");
  });

  it("should let you click and trigger an event", function() {
    view.render();
    view.setMessage('come on dude <a href="#/test">oe</a>!');
    var called = false;
    view.bind('test', function() {
      called = true;
    })

    view.$('a').click();
    expect(called).toBeTruthy();
  });

});
