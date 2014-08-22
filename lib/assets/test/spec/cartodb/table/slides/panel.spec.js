
describe('cdb.admin.SlidesPanel', function() {

  var map, slides, ciew;
  beforeEach(function() {
    map = new cdb.admin.Map({ id: 'map_0' });
    slides = new cdb.admin.Slides(null, {
      map: map
    });

    view = new cdb.admin.SlidesPanel({
      slides: slides
    });
  });


  it("should reset slides", function() {
    slides.reset([{}, {}, {}]);
    expect(view.$('.slide_view').length).toEqual(3);
  });

  it("should add slide", function() {
    slides.add({});
    expect(view.$('.slide_view').length).toEqual(1);
  });

  it("should remove slide", function() {
    slides.add({});
    slides.add({});
    slides.remove(slides.at(0));
    expect(view.$('.slide_view').length).toEqual(1);
  });

  it("should active on click", function() {
    slides.reset([{}, {}, {}]);
    $(view.$('.slide_view')[0]).click();
    expect(slides.at(0).isActive()).toEqual(true);
    expect(slides.at(1).isActive()).toEqual(false);
    expect(slides.at(2).isActive()).toEqual(false);
    $(view.$('.slide_view')[1]).click();
    expect(slides.at(0).isActive()).toEqual(false);
    expect(slides.at(1).isActive()).toEqual(true);
    expect(slides.at(2).isActive()).toEqual(false);
  });




});
