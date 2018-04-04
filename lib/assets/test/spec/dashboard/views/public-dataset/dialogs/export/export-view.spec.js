const ExportView = require('dashboard/views/public-dataset/dialogs/export/export-view');
const CartoTableMetadataFixture = require('fixtures/dashboard/carto-table-metadata.fixture');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

// Just duplicated from old modal to maintain the exiting tests at least.
// describe('dashboard/views/public-dataset/dialogs/export/export-view', function () {
//   let view, modalsServiceModel;

//   beforeEach(function () {
//     modalsServiceModel = new ModalsServiceModel();
//     modalsServiceModel.create(modalModel => {
//       view = new ExportView({
//         model: CartoTableMetadataFixture({}, configModel),
//         api_key: 'testapikey',
//         configModel,
//         modalModel
//       });
//     })
//   });

//   it('should contain username in export url', function () {
//     view.dataGeoreferenced = true;
//     view.render();

//     const url = view.$('form').attr('action');
//     expect(url).toEqual('http://test.localhost.lan/api/v2/sql');
//   });

//   it('should include api key if provided', function () {
//     view.render();
//     spyOn(view, '_fetchGET');
//     view._fetch({ format: 'csv', api_key: 'testapikey', filename: 'test' }, 'select * from table');
//     expect(view._fetchGET).toHaveBeenCalled();
//     expect(view._fetchGET.calls.argsFor(0)[0].indexOf('api_key=testapikey') !== -1).toEqual(true);
//   });
// });
