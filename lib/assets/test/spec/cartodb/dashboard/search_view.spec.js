describe("SearchView", function() {

  var search;

  afterEach(function() {
    search.$el.remove();
  });

  beforeEach(function() {

    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    search = new cdb.ui.common.SearchView({
      el: this.el
    });

    $("body").append(search.render().$el);

  });

  it("should allow to update the input field through the model", function() {

    search.render();
    search.model.set("q", "bien");
    expect(search.$el.find('input[type="text"]').val()).toEqual("bien");

  });

  it("should have a public method to update the input field", function() {

    search.render();
    search.setQuery("awesome");
    expect(search.$el.find('input[type="text"]').val()).toEqual("awesome");

    search.setQuery();
    expect(search.$el.find('input[type="text"]').val()).toEqual("");

  });

  it("should trigger an event on submit", function() {

    search.render();

    var submitted = false;
    var what = "";

    search.bind('search', function(q) {
      submitted = true;
      what = q;
    });

    search.$el.find('input[type="text"]').val("hola");
    search.$el.find('form').submit();
    expect(submitted).toBeTruthy();
    expect(what).toEqual("hola");

  });

});
