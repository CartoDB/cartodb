// WARNING: This test need things that are not migrated yet, or won't be migrated

// const $ = require('jquery');
// const RowView = require('dashboard/views/public-dataset/table-view/row-view');
// const RowModel = require('dashboard/data/table/row-model');
// const SQLViewDataModel = require('dashboard/data/table/sqlviewdata-model');
// const TableView = require('dashboard/views/public-dataset/table-view/table-view');
// const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
// const configModel = require('fixtures/dashboard/config-model.fixture');

// describe('RowView', function () {
//   let tableview, view, model, sqlView;

//   beforeEach(function () {
//     model = new CartoTableMetadata({
//       name: 'test',
//       schema: [['cartodb_id', 'number'], ['test', 'string'], ['test2', 'number'], ['the_geom', 'geometry']],
//       geometry_types: ['ST_MultiPoint'],
//       configModel
//     });

//     model.data().create();

//     view = new RowView({
//       el: $('<div>'),
//       model: new RowModel({
//         cartodb_id: 1,
//         test: 'test',
//         test2: 1,
//         the_geom: '{ "type": "Point", "coordinates": [100.0, 0.0] }'
//       }, { configModel }),
//       row_header: true
//     });

//     sqlView = new SQLViewDataModel(null, { sql: 'select * from test', configModel });

//     tableview = new TableView({
//       model: model,
//       // geocoder: new cdb.admin.Geocodings(),
//       dataModel: model.data(),
//       sqlView,
//       vis: VisualizationModel(configModel),
//       configModel
//     });

//     view.tableView = tableview;
//     view._getRowOptions().$el.css('display', 'none');
//   });

//   it('should render properly', function () {
//     view.render();
//     expect(view.$('td').length).toBe(5);

//     expect(view.$('td:eq(0) div.cell').text()).toBe('');
//     expect(view.$('td:eq(1) div.cell').text()).toBe('1');
//     expect(view.$('td:eq(2) div.cell').text()).toBe('test');
//     expect(view.$('td:eq(3) div.cell').text()).toBe('1');
//     expect(view.$('td:eq(4) div.cell').text()).toBe(' 100.0000,0.0000');
//   });

//   it('should render properly a row with point geometry but no data', function () {
//     view.model.set({ cartodb_id: 1, test: 'test', test2: 1, the_geom: null });
//     view.render();
//     expect(view.$('td:eq(4) div.cell').text()).toBe('null');
//   });

//   it('should render properly a row with polygon geometry', function () {
//     model.set('geometry_types', ['ST_MultiPolygon'], { silent: true });
//     view.model.set({ cartodb_id: 1, test: 'test', test2: 1, the_geom: '{ "type": "Polygon", "coordinates": [[ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]]}' });
//     view.render();
//     expect(view.$('td').length).toBe(5);
//     expect(view.$('td:eq(4) div.cell').text()).toBe('Polygon');
//   });

//   it('should render properly a row with polygon geometry without data', function () {
//     model.set('geometry_types', ['ST_MultiPolygon'], { silent: true });
//     view.model.set({ cartodb_id: 1, test: 'test', test2: 1, the_geom: null });
//     view.render();
//     expect(view.$('td:eq(4) div.cell').text()).toBe('null');
//   });

//   it('should render properly a row with polyline geometry', function () {
//     model.set('geometry_types', ['ST_MultiLineString'], { silent: true });
//     view.model.set({ cartodb_id: 1, test: 'test', test2: 1, the_geom: '{ "type": "LineString", "coordinates": [ [100.0, 0.0], [101.0, 1.0] ]}' });
//     view.render();
//     expect(view.$('td').length).toBe(5);
//     expect(view.$('td:eq(4) div.cell').text()).toBe('Line');
//   });

//   it('should render properly a row with polyline geometry but no data', function () {
//     model.set('geometry_types', ['ST_MultiLineString'], { silent: true });
//     view.model.set({ cartodb_id: 1, test: 'test', test2: 1, the_geom: null });
//     view.render();
//     expect(view.$('td:eq(4) div.cell').text()).toBe('null');
//   });

//   it('should open row menu', function () {
//     view.render();
//     view.$('.row_header').trigger('click');
//     expect(view._getRowOptions().$el.css('display')).toEqual('block');
//   });
// });
