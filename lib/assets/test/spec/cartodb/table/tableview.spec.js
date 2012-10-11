/**
 * test for table view
 */
describe("tableview", function() {

  describe("headerview", function() {
    var view;
    var model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
    });
    beforeEach(function() {
      view = new cdb.admin.HeaderView({
        el: $('<div>'),
        column: ['name', 'type'],
        table: model
      });
    });

    it('should render', function() {
      view.render();
      expect(view.$('label > a').html().trim()).toEqual('name');
      expect(view.$('p > a').html()).toEqual('type');
    });

    it("when click on column name a menu should be opened", function() {
      runs(function() {
        view.render();
        view.$('.coloptions').trigger('click');
      });
      //WTF i need to wait this time to click to be triggered? <- in fact it probably doesn't have anything to do with time, but with the way the Browser UI thread choose what's going to execute next
      waits(400);
      runs(function() {
        expect(cdb.admin.HeaderView.colOptions.$el.css('display')).toEqual('block');
      });
    });
  });

  describe('TableView', function() {
    var tview;
    var model;
    beforeEach(function() {
      this.server = sinon.fakeServer.create();


      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test',
        schema: [
          ['id', 'integer'],
          ['col1', 'integer'],
          ['col2', 'integer'],
          ['col3', 'integer']
        ]
      });

      tview = new cdb.admin.TableView({
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

    it('should a table', function() {
      model.set({
        columns: [['test', 'integer']]
      });
      tview.render();
      expect(tview.$('thead').length).toEqual(1);
    });

    it("should edit cell", function() {
      spyOn(tview, '_getEditor');
      tview.render();
      tview.getCell(0, 0).trigger('dblclick');
      expect(tview._getEditor).toHaveBeenCalled();
    });

    it("should not edit cell", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      model.useSQLView(sqlView);
      sqlView.reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3},
        {'id': 2, 'col1': 4, 'col2': 5, 'col3': 6}
      ]);

      spyOn(tview, '_getEditor');
      tview.getCell(0, 0).trigger('click');
      expect(tview._getEditor).not.toHaveBeenCalled();
    });


    it("should be able to add an empty row", function() {
      var prevSize = tview._models[0].table.data().length;
      tview.addEmptyRow();
      this.server.requests[0].respond(200,{ "Content-Type": "application/json" },"");
      expect(prevSize+1).toEqual(tview._models[0].table.data().length);
    })

    it("should show the empty table layout when there's no data", function() {
      model.data().reset();
      model.data().trigger('dataLoaded');

      expect(tview.$('.placeholder.noRows').length).toBe(2);
      expect(tview.$('.placeholder.noRows.decoration').length).toBe(1);
      expect(tview.$('tfoot').length).toBe(1);

    })

    it("should notify the model when a row changes", function() {
      var notified = 0;
      model.bind('notice', function() { notified++});
      tview.rowChanged();
      expect(notified).toEqual(1);
    });

    it("should notify the model when a row is synched", function() {
      var notified = 0;
      model.bind('notice', function() { notified++});
      tview.rowSynched();
      expect(notified).toEqual(1);
    });

    it("should notify the model when a row synch fails", function() {
      var notified = 0;
      model.bind('notice', function() { notified++});
      tview.rowFailed();
      expect(notified).toEqual(1);
    });

    it("should notify the model when a row is deleted", function() {
      var notified = 0;
      model.bind('notice', function() { notified++});
      tview.rowDestroyed();
      expect(notified).toEqual(1);
    });


    it("should not show the empty table layout after an empty row insertion", function() {
      model.data().reset();
      tview.render();
      tview.addEmptyRow()
      expect(tview.$('.placeholder.noRows').length).toBe(0);
      expect(tview.$('.placeholder.noRows.decoration').length).toBe(0);
      expect(tview.$('tfoot').length).toBe(0);
    })

    xit("should show the empty table layout after the deletion of the last row", function() {
      // @todo (Xabel) this is not working, I'm not sure why, because in the app everything goes fine
      model.data().reset();
      tview = new cdb.admin.TableView({
        el: $('<table>'),
        dataModel: model.data(),
        model: model,
        row_header: true
      });
      tview.render();
      tview.addEmptyRow();
      spyOn(tview, 'rowDestroyed');
      spyOn(tview, 'emptyTable');
      var rowOptions =  tview.rowViews[0]._getRowOptions();
      rowOptions.setRow(tview.rowViews[0].model);
      rowOptions.deleteRow();

      waits(100);

      expect(tview.emptyTable).toHaveBeenCalled();
      expect(tview.$('.placeholder.noRows').length).toBe(2);
      expect(tview.$('.placeholder.noRows.decoration').length).toBe(1);
      expect(tview.$('tfoot').length).toBe(1);
    })


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


  describe('HeaderDropdown', function() {
    var view;
    var model;

    beforeEach(function() {
      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
      });
      view = new cdb.admin.HeaderDropdown({
        position: 'position',
        template_base: "table/views/table_header_options"
      });
    });

    it("should render all options for normal fields", function() {
      view.setTable(model, 'normal');
      expect(view.$('li').length).toEqual(7);
    });

    it("should not render all options for reserved column", function() {
      view.setTable(model, 'cartodb_id');
      expect(view.$('li').length).toEqual(2);
      view.setTable(model, 'normal');
      expect(view.$('li').length).toEqual(7);
    });

    it("should not render all options for read only data", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      model.useSQLView(sqlView);

      view.setTable(model, 'cartodb_id');
      expect(view.$('li').length).toEqual(2);
      view.setTable(model, 'normal');
      expect(view.$('li').length).toEqual(2);
    });

  });

});
