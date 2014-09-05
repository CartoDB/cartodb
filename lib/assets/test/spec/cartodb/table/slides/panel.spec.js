describe('cdb.admin.SlidesPanel', function() {

  var vis, slides, view;

  beforeEach(function() {
    vis = new cdb.admin.Visualization();

    slides = new cdb.admin.Slides(null, {
      visualization: vis
    });

    view = new cdb.admin.SlidesPanel({
      slides: slides
    });

    view.render();

  });

  it("should reset slides", function() {
    slides.reset([{}, {}, {}]);
    expect(view.$('.slide_view:not(".add")').length).toEqual(3); 
  });

  it("should add slide", function() {
    slides.add({});
    expect(view.$('.slide_view:not(".add")').length).toEqual(1); 
  });

  it("should remove slide", function(done) {
    slides.add({});
    slides.add({});
    slides.remove(slides.at(0));

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add")').length).toEqual(1);
      done();
    }, 500)

  });

  it("should activate the first slide after a remove", function(done) {
    slides.add({});
    slides.add({});
    slides.add({});

    $(view.$('.slide_view:not(".add")')[2]).click();
    slides.remove(slides.at(0));

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add"):first-child').hasClass("active")).toEqual(true);
      done();
    }, 500)

  });

  it("should active on click", function() {
    slides.reset([{}, {}, {}]);
    $(view.$('.slide_view:not(".add")')[0]).click();
    expect(slides.at(0).isActive()).toEqual(true);
    expect(slides.at(1).isActive()).toEqual(false);
    expect(slides.at(2).isActive()).toEqual(false);

    $(view.$('.slide_view:not(".add")')[1]).click();
    expect(slides.at(0).isActive()).toEqual(false);
    expect(slides.at(1).isActive()).toEqual(true);
    expect(slides.at(2).isActive()).toEqual(false);
  });
});
