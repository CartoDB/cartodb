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
      //WTF i need to wait this time to click to be triggered?
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

    it("should render all options for reserved column", function() {
      view.setTable(model, 'cartodb_id');
      expect(view.$('li').length).toEqual(2);
      view.setTable(model, 'normal');
      expect(view.$('li').length).toEqual(7);
    });
  });

});
