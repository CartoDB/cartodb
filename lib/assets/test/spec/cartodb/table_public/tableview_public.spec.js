/**
 * test for table view
 */
describe("tableview_public", function() {


  describe('TableView', function() {
    var tview;
    var model;
    beforeEach(function() {
      this.server = sinon.fakeServer.create();


      model = new cdb.open.PublicCartoDBTableMetadata({
        name: 'test',
        schema: [
          ['id', 'integer'],
          ['col1', 'integer'],
          ['col2', 'integer'],
          ['col3', 'integer']
        ]
      });

      tview = new cdb.open.PublicTableView({
        el: $('<table>'),
        dataModel: model.data(),
        model: model,
        row_header: true
      });
      model.data().reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3},
        {'id': 2, 'col1': 4, 'col2': 5, 'col3': 6}
      ]);
    });

    it("should show the empty table layout when there's no data", function() {
      model.data().reset();
      expect(tview.$('tfoot').length).toBe(1);
    });

    it("should show the public empty table warning, not the private one", function() {
      model.data().reset();
      model.data().trigger('dataLoaded');
      tview.render();

      expect(tview.$('.placeholder.noRows').length).toBe(0);
      expect(tview.$('.placeholder.noRows.decoration').length).toBe(0);

    })

    it("should not show the empty table layout after an empty row insertion", function() {
      model.data().reset();
      tview.render();
      tview.addEmptyRow()
      expect(tview.$('tfoot').length).toBe(0);
    })

  });

  describe('TableTab', function() {
    var tview;
    var model;
    beforeEach(function() {
      model = new cdb.open.PublicCartoDBTableMetadata({
        name: 'test'
      });

      tview = new cdb.open.PublicTableTab({
        model: model
      });
    });

    it('should render a div', function() {
      tview.render();
      expect(tview.$el.hasClass('table')).toBeTruthy();
    });

  });


});
