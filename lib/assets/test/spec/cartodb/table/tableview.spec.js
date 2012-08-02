/**
 * test for table view
 */
describe("tableview", function() {

  describe("headerview", function() {
    var view;
    beforeEach(function() {
      cdb.templates.add(new cdb.core.Template({
        name: 'table/views/table_header_view',
        compiled: _.template("<label><a><%= col_name %></a></label><p><a><%= col_type %></a></p>")
      }));

      cdb.templates.add(new cdb.core.Template({
        name: 'table/views/table_header_options',
        compiled: _.template("<ul></ul>")
      }));

      view = new cdb.admin.HeaderView({
        column: ['name', 'type']
      });
    });

    it('should render', function() {
      view.render();
      expect(view.$('label > a').html().trim()).toEqual('name');
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
