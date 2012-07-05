/**
 * test for table view
 */
describe("tableview", function() {

  describe("headerview", function() {
    var view;
    beforeEach(function() {
      view = new cdb.admin.HeaderView({
        column: ['name', 'type']
      });
    });

    it('should render', function() {
      view.render();
      expect(view.$('label > a').html()).toEqual('name');
      expect(view.$('p > a').html()).toEqual('type');
    });
  });

  it('ok', function() {

  });
});
