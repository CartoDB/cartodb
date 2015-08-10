describe("export_image_result_view", function() {
  beforeEach(function() {
    this.url = "http://www.cartodb.com";

    this.view = new cdb.editor.ExportImageResultView({
      clean_on_hide: true,
      enter_to_confirm: false,
      user: TestUtil.createUser('jamon'),
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });

    spyOn(this.view, '_loadMapImage').and.callFake(function(value, callback) {return callback(value);}); 
    spyOn(this.view, 'mergeAnnotations').and.returnValue("url")

    this.view.render();
  });

  afterEach(function() {
    this.view.clean();
  })

  it("should render the result view", function() {
    this.view.generateImage(this.url);
    expect(this.view.$(".js-open-image").length).toBe(1);
    expect(this.innerHTML()).toContain("Your image has been generated correctly");
    expect(this.innerHTML()).toContain('<p class="Dialog-headerText">It\'s now available in: <a href="http://www.cartodb.com" target="_blank" class="ExportImageResult--url">' + this.url + '</a></p>');
  });

  it("should close the dialog when clicking on the view image link", function() {
    this.view.generateImage(this.url);
    var hidden = false;
    this.view.bind("hide", function() {
      hidden = true;
    });
    this.view.$(".js-open-image").click();
    expect(hidden).toBe(true);
  });
});
