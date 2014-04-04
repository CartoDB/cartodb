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
        table: model,
        vis: TestUtil.createVis('jam')
      });
    });

    it('should render', function() {
      view.render();
      expect(view.$('label > a').html().trim()).toEqual('name');
      expect(view.$('p > a').html()).toEqual('type');
    });


    it("when click on column name a menu should be opened", function(done) {
        view.render();
        view.$('.coloptions').trigger('click');
      //WTF i need to wait this time to click to be triggered? <- in fact it probably doesn't have anything to do with time, but with the way the Browser UI thread choose what's going to execute next
      setTimeout(function() {
        expect(cdb.admin.HeaderView.colOptions.$el.css('display')).toEqual('block');
        done();
      }, 400);
    });

    it("when click on column type a menu should be opened", function(done) {
      view.render();
      view.$('.coltype').trigger('click');
      setTimeout(function() {
        expect(cdb.admin.HeaderView.colTypeOptions.$el.css('display')).toEqual('block');
        done()
      }, 800);
    });


    it("when click on column type, being in a SQL view should not open anything", function(done) {
      view.render();
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      model.useSQLView(sqlView);
      view.$('.coltype').trigger('click');
      setTimeout(function() {
        expect(cdb.admin.HeaderView.colTypeOptions.$el.css('display')).toEqual('none');
        done()
      }, 800);
    });

    // it("when render a geometry column, you shouldn't be able to georeference data if it is a visualization view", function() {
    //   var done = false, new_view;

    //   var new_vis = TestUtil.createVis('jam');
    //   new_vis.set('type', 'derived');
    //   new_view = new cdb.admin.HeaderView({
    //     el: $('<div>'),
    //     column: ['the_geom', 'geometry'],
    //     table: model,
    //     vis: new_vis
    //   });
    //   new_view.render();
    //   new_view.bind('georeference', function() {
    //     done = true;
    //   })
    //   new_view.$('span.geo').click();

    //   waits(2000);
    //   runs(function() {
    //     expect(done).toBeFalsy();
    //     expect(new_view.warning_dlg).toBeDefined();
    //     new_view.warning_dlg.clean();
    //     new_view.clean();
    //   });
    // });
  });

  describe('TableView', function() {
    var tview;
    var model;
    var globalErrorDummy;
    beforeEach(function() {
      this.server = sinon.fakeServer.create();

      globalErrorDummy = {
        "showError": function(a,b,c) {
          this.params = {
            "first": a,
            "second": b,
            "third": c
          }
          return true;
        }
      }

      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test',
        schema: [
          ['id', 'number'],
          ['col1', 'number'],
          ['col2', 'number'],
          ['col3', 'number'],
          ['the_geom', 'geometry']
        ]
      });

      tview = new cdb.admin.TableView({
        el: $('<table>'),
        dataModel: model.data(),
        model: model,
        row_header: true,
        vis: TestUtil.createVis('jam'),
        geocoder: new cdb.admin.Geocoding(),
        globalError: globalErrorDummy
      });
      model.data().reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3, 'the_geom': null},
        {'id': 2, 'col1': 4, 'col2': 5, 'col3': 6, 'the_geom': null}
      ]);
    });

    it('should render a table', function() {
      model.set({
        columns: [['test', 'number']]
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

    it ("should change table class if sync is enabled", function() {
      model.synchronization.set('id', 'test');
      tview.render();
      expect(tview.$el.hasClass('synced')).toEqual(true);
      model.synchronization.unset('id');
      expect(tview.$el.hasClass('synced')).toEqual(false);
      model.synchronization.set('id', 'test');
      expect(tview.$el.hasClass('synced')).toEqual(true);
      model.synchronization.destroy();
      expect(tview.$el.hasClass('synced')).toEqual(false);
    });

    it("should show the type when the_Geom is a point", function() {
      model.data().reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3, 'the_geom':
          '{"type":"Point", "coordinates": [45.32111111,-33.3312312312]}'}
      ]);
      model.set('geometry_types', ["st_point"]);
      tview.render();

      expect(tview.$('td .cell').eq(5).html()).toEqual(" 45.3211,-33.3312");

    })

    it("should show the type when the_Geom is a line", function() {
      model.data().reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3, 'the_geom':
          '{"type":"Linestring", "coordinates": [[1,1],[2,3],[6,6]]}'}
      ]);
      model.set('geometry_types', ["st_linestring"]);
      tview.render();

      expect(tview.$('td .cell').eq(5).html()).toEqual("Line");

    })

    it("should show 'null' on the_geom cell when there is not a value for it", function() {
      model.data().reset([
        {'id': 1, 'col1': 1, 'col2': 2, 'col3': 3, 'the_geom': null}
      ]);
      tview.render();

      expect(tview.$('td .cell').eq(5).html()).toEqual("null");
    })

    it("should be able to add an empty row", function() {
      var prevSize = tview._models[0].table.data().length;
      tview.addEmptyRow();
      this.server.requests[1].respond(200,{ "Content-Type": "application/json" },"");
      expect(prevSize+1).toEqual(tview._models[0].table.data().length);
    })

    it("should show the empty table layout when there's no data", function() {
      model.data().reset();
      //model.data().trigger('dataLoaded');

      expect(tview.$('.placeholder.noRows').length).toBe(2);
      expect(tview.$('.placeholder.noRows.decoration').length).toBe(1);
      expect(tview.$('tfoot').length).toBe(1);

    })

    it("should NOT show a notice when nothing happens", function() {
      expect(globalErrorDummy.params).toBeFalsy();
    });

    it("should show a notice when a row is being saved", function() {
      tview.rowSaving();
      expect(globalErrorDummy.params).toBeTruthy();
    });

    it("should show a notice when the model when a row is synched", function() {
      tview.rowSynched();
      expect(globalErrorDummy.params).toBeTruthy();
    });

    it("should show a notice the model when a row synch fails", function() {
      tview.rowFailed();
      expect(globalErrorDummy.params).toBeTruthy();
    });

    it("should show a notice the model when a row is deleted", function() {
      tview.rowDestroyed();
      expect(globalErrorDummy.params).toBeTruthy();
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
        geocoder: new cdb.admin.Geocoding(),
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
    });

    it("should have a geocoding binding each time table view is rendered", function() {
      tview.render();
      spyOn(tview.model.data(), 'fetch');
      tview.options.geocoder.trigger('geocodingComplete');
      expect(tview.model.data().fetch).toHaveBeenCalled();
      tview.clean();
      tview.render();
      tview.options.geocoder.trigger('geocodingComplete');
      expect(tview.model.data().fetch).toHaveBeenCalled();
      expect(tview.model.data().fetch.calls.count()).toBe(1);
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
        model: model,
        vis: TestUtil.createVis('jam')
      });
    });

    it('should render a div', function() {
      tview.render();
      expect(tview.$el.hasClass('table')).toBeTruthy();
    });

  });


  describe('HeaderColumnOptionsDropdown', function() {
    var view;
    var model;

    beforeEach(function() {
      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
      });
      view = new cdb.admin.HeaderDropdown({
        position: 'position',
        template_base: "table/views/table_header_options",
        vis: TestUtil.createVis('jam')
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


  describe('HeaderColumnTypeDropdown', function() {
    var view;
    var model;

    beforeEach(function() {
      model = new cdb.admin.CartoDBTableMetadata({
        name: 'test'
      });
      view = new cdb.admin.ColumntypeDropdown({
        position: 'position',
        template_base: "table/views/table_column_type_options"
      });
    });

    it("should render all available column types", function() {
      view.setTable(model, 'normal');
      expect(view.render().$el.find('li').length).toEqual(4);
    });
  });

});
