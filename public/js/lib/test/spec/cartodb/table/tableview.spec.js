/**
 * test for table view
 */
describe("tableview", function() {

  describe("headerview", function() {
    var view;
    beforeEach(function() {
      view = new cdb.admin.HeaderView({
        column: ['name', 'type'],
        template: "<label><a><%= col_name %></a></label><p><a><%= col_type %></a></p>"
      });
    });

    it('should render', function() {
      view.render();
      expect(view.$('label > a').html()).toEqual('name');
      expect(view.$('p > a').html()).toEqual('type');
    });
  });

  describe('TableView', function() {
    var tview;
    var model;
    beforeEach(function() {
      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
      });

      tview = new cdb.admin.TableView({
        dataModel: model.data(),
        model: model
      });
    });

    it('should a table', function() {
      model.set({
        columns: [['test', 'integer']]
      });
      tview.render();
      expect(tview.$('thead').length).toEqual(1);
    });

  });

  describe('TableTab', function() {
    var tview;
    var model;
    beforeEach(function() {
      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
      });

      tview = new cdb.admin.TableTab({
        model: model
      });
    });

    it('should render a div', function() {
      tview.render();
      expect(tview.$el.hasClass('table')).toBeTruthy();
    });

  });
});
