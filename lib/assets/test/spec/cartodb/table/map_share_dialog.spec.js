
describe("", function() {

  var view;
  beforeEach(function() {
    var map = new cdb.admin.Map();
    var table = TestUtil.createTable('test');
    view = new cdb.admin.ShareMapDialog({
      map: map,
      table: table
    });

  });

  it("shold render a map with controls", function() {
    view.render().show();
    //expect(view.$('.leaflet-container').length).toEqual(1);
    expect(view.$('#zoom').length).toEqual(1);
    expect(view.$('.header_title').html()).toEqual('test');
    expect(view.$('.header_description').html()).toEqual('test description');

    expect(view.$('.form_switch').length).toEqual(3);
  });

  it("should set url", function() {
    view.render().show();
    expect(view.$('.url').html().indexOf('title=true')).not.toEqual(-1);
    view.mapOptions.set({title: false});
    expect(view.$('.url').html().indexOf('title=false')).not.toEqual(-1);
  });

  it("should hide title when change options", function() {
    view.render().show();
    view.mapOptions.set({title: false});
    expect(view.$('.header_title').css('display')).toEqual('none');
  });

});
