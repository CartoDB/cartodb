describe("cdb.admin.dashboard.Messages", function() {

  var view;

  beforeEach(function() {

    $("body").append("<div class='subheader'></div>");

    var config = { custom_com_hosted: false };

    view = new cdb.admin.dashboard.Messages({
      el:    $(".subheader"),
      config: config,
      localStorageKey: "test_user_storage"
    });

  });

  afterEach(function() {

    delete localStorage['test_user_storage'];
    $(".subheader").remove();

  });


  it("should have a message widget", function() {
    expect(view).toBeDefined();
  })

  it("should have a list of default messages", function() {
    expect(view._MESSAGES).toBeDefined();
  })

  it("should allow to add messages with a key", function() {

    view.addMessage("limits_exceeded", { username: "Santana", upgrade_url: "http://www.cartodb.com" });

    expect(view.messages.length).toBe(1);

    var msg = view.messages.at(0);

    expect(msg.get("sticky")).toBeTruthy();
    expect(msg.get("message")).toEqual('Hey <strong>Santana</strong>, looks like you\'re about to reach your account limit. Start thinking about <a href="http://www.cartodb.com" class ="underline">upgrading your plan</a>.');

  });

  it("should allow to remove messages with a key", function() {

    view.addMessage("limits_exceeded", { username: "Santana", upgrade_url: "http://www.cartodb.com" });
    view.removeMessage("limits_exceeded");

    expect(view.messages.length).toBe(0);

  });

  it("should allow to add messages", function() {

    view.add("This is a message");
    view.add("This is another message", { sticky: true });
    view.add("This is yet another message");

    expect(view.messages.length).toBe(3);

    var msg = view.messages.at(0);
    expect(msg.get("sticky")).toBeFalsy();

    var msg2 = view.messages.at(1);
    expect(msg2.get("sticky")).toBeTruthy();
    expect(msg2.get("message")).toEqual("This is another message");

  });

  xit("should hide when there are no messages", function() {

    view.render();

    view.add("This is a message");
    view.add("This is another message");

    expect(view.messages.length).toEqual(2);

    var m1 = view.messages.at(0);
    var m2 = view.messages.at(1);

    view.messages.remove(m1)
    view.messages.remove(m2)

    expect(view.messages.length).toEqual(0);
    expect(view.$el.hasClass("hidden")).toBeTruthy();

  });

  it("should allow to remove items", function() {

    view.add("This is a message.");
    view.add("This is another message.", { sticky: true });
    view.add("This is yet another message.");

    view.render();

    view.$el.find("li:last-child .close").click();

    waits(300);

    runs(function() {
      expect(view.messages.length).toEqual(2);
      expect(view.$el.find("li").length).toEqual(2);
    });

  });

  it("shouldn't allow to remove sticky items", function() {

    view.add("This is a message.");
    view.add("This is another message.", { sticky: true });
    view.add("This is yet another message.");

    view.render();
    view.$el.find("li:nth-child(2).close").click();

    waits(300);

    runs(function() {
      expect(view.messages.length).toEqual(3);
      expect(view.$el.find("li").length).toEqual(3);
    });

  });

  it("shouldn't allow to add the same message twice", function() {

    view.add("This is a message.");
    view.add("This is another message.", { sticky: true });
    view.add("This is another message.");
    view.add("This is another message.");

    expect(view.messages.length).toEqual(2);

  });

  it("should render the messages", function() {

    view.add("This is a message.");
    view.add("This is another message.", { sticky: true });
    view.add("This is yet another message.");

    view.render();

    var c0 = view.messages.at(0);
    var c1 = view.messages.at(1);
    var c2 = view.messages.at(2);

    var messagesHTML  = '<ul>';
    messagesHTML      += '<li class="'+c0.cid+'"><div class="inner">This is a message.<a href="#close" class="smaller close">x</a></div></li>';
    messagesHTML      += '<li class="'+c1.cid+'"><div class="inner">This is another message.</div></li>';
    messagesHTML      += '<li class="'+c2.cid+'"><div class="inner">This is yet another message.<a href="#close" class="smaller close">x</a></div></li>';
    messagesHTML      += '</ul>';

    expect(view.$el.html()).toEqual(messagesHTML);

  });

  it("should render the list again when the list is changed", function() {

    view.add("This is a message.");
    view.add("This is another message.");
    view.add("This is yet another message.");

    view.render();

    var c0 = view.messages.at(0);
    var c1 = view.messages.at(1);
    var c2 = view.messages.at(2);

    var messagesHTML  = '<ul>';
    messagesHTML      += '<li class="'+c0.cid+'"><div class="inner">This is a message.<a href="#close" class="smaller close">x</a></div></li>';
    messagesHTML      += '<li class="'+c1.cid+'"><div class="inner">This is another message.<a href="#close" class="smaller close">x</a></div></li>';
    messagesHTML      += '</ul>';

    view.messages.remove(view.messages.at(2))

    waits(300);

    runs(function() {
      expect(view.messages.length).toEqual(2);
      expect(view.$el.html()).toEqual(messagesHTML);
    });

  });

  it("shouldn't render the messages when the installation is custom hosted", function() {

    var config = { custom_com_hosted: true };

    var view2 = new cdb.admin.dashboard.Messages({
      el:    $(".subheader"),
      config: config,
      localStorageKey: "test_user_storage"
    });

    view2.add("This is a message.");
    view2.add("This is another message.", { sticky: true });
    view2.add("This is yet another message.");

    view2.render();

    var c0 = view2.messages.at(0);
    var c1 = view2.messages.at(1);
    var c2 = view2.messages.at(2);

    expect(view2.$el.html()).toEqual('<ul></ul>');

  });

  it("should store messages", function() {

    view.add("This is a message", { store: true });
    view.add("This is another message");

    view.messages.reset();

    view.loadMessages();

    expect(view.messages.length).toBe(1);

  });

  it("should remove the message from the storage on remove", function() {

    view.add("This is a stored message", { store: true });
    view.add("This is a on time message");

    expect(view.messages.length).toBe(2);

    view.messages.remove(view.messages.at(0));
    expect(view.messages.length).toBe(1);

    view.loadMessages();

    expect(view.messages.length).toBe(0);

  });



});


