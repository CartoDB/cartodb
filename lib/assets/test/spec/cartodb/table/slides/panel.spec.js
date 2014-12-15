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

  it("should render a fake slide when there are no slides", function() {
    expect(view.$('.slide_view:not(".add")').length).toEqual(1); 
  });
  it("should remove a fake slide there are slides", function() {
    expect(view.$('.slide_view:not(".add")').length).toEqual(1); 
    slides.add({});
    expect(view.$('.slide_view:not(".add")').length).toEqual(1); 
  });

  it("should remove slide", function(done) {
    slides.add({});
    slides.add({});
    slides.at(0).destroy();

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add")').length).toEqual(1);
      done();
    }, 500)

  });

  it("should activate the first slide after a remove", function(done) {
    slides.add({});
    slides.add({});
    slides.add({});

    $(view.$('.slide_view:not(".add") .count')[0]).click(); // activate the first slide
    slides.remove(slides.at(0)); // remove the first slide

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add"):nth-child(1)').hasClass("active")).toEqual(true);
      done();
    }, 500)

  });

  it("should activate the last slide after a remove", function(done) {
    slides.add({});
    slides.add({});
    slides.add({});

    $(view.$('.slide_view:not(".add") .count')[2]).click(); // activate the last slide
    slides.remove(slides.at(2)); // remove the last slide

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add"):nth-child(2)').hasClass("active")).toEqual(true);
      done();
    }, 500)

  });

  it("should activate the next slide after a remove", function(done) {
    slides.add({});
    slides.add({});
    slides.add({});
    slides.add({});

    $(view.$('.slide_view:not(".add") .count')[1]).click(); // activate the second slide
    slides.remove(slides.at(1)); // remove the second slide

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add"):nth-child(2)').hasClass("active")).toEqual(true);
      done();
    }, 500)

  });
  
  it("should mantain the same activated slide after a remove", function(done) {
    slides.add({});
    slides.add({});
    slides.add({});
    slides.add({});

    $(view.$('.slide_view:not(".add") .count')[0]).click(); // activate the first slide
    slides.remove(slides.at(2)); // remove the third slide

    setTimeout(function() {
      expect(view.$('.slide_view:not(".add"):nth-child(1)').hasClass("active")).toEqual(true);
      done();
    }, 500)

  });

  it("should active on click", function() {
    slides.reset([{}, {}, {}]);
    $(view.$('.slide_view:not(".add") .count')[0]).click();
    expect(slides.at(0).isActive()).toEqual(true);
    expect(slides.at(1).isActive()).toEqual(false);
    expect(slides.at(2).isActive()).toEqual(false);

    $(view.$('.slide_view:not(".add") .count')[1]).click();
    expect(slides.at(0).isActive()).toEqual(false);
    expect(slides.at(1).isActive()).toEqual(true);
    expect(slides.at(2).isActive()).toEqual(false);
  });

  it("should show transition dropdown on click", function() {
    slides.reset([{}, {}, {}]);
    $(view.$('.slide_view .info')[0]).click();
  });
});
