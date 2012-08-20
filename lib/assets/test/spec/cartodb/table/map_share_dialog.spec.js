
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
    expect(view.$('h1').html()).toEqual('test');
    expect(view.$('p').html()).toEqual('test description');
  });

}); 
