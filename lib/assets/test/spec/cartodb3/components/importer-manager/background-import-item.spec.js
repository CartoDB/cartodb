// var Backbone = require('backbone');
// var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
// var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
// var ImportsModel = require('../../../../../javascripts/cartodb3/data/background-importer/imports-model');
// var BackgroundImporter = require('../../../../../javascripts/cartodb3/components/importer-manager/background-importer');
// var BackgroundImportItemView = require('../../../../../javascripts/cartodb3/components/importer-manager/background-import-item-view');

// describe('editor/components/importer-manager/background-import-item', function () {
//   beforeEach(function () {
//     this.userModel = new UserModel({
//       username: 'pepe',
//       actions: {
//         private_tables: true
//       }
//     }, {
//       configModel: 'c'
//     });

//     this.configModel = new ConfigModel({
//       base_url: '/u/pepe'
//     });

//     this.model = new ImportsModel({}, {
//       userModel: this.userModel,
//       configModel: this.configModel
//     });

//     spyOn(this.model, 'bind').and.callThrough();

//     var collection = new Backbone.Collection();

//     this.importer = new BackgroundImportItem({
//       modals: {},
//       createVis: false,
//       importModel: this.model,
//       userModel: this.userModel,
//       configModel: this.configModel,
//       collection: collection
//     });

//     collection.add(this.importer);
//   });

//   it('should create notification properly', function () {
//     expect(this.importer._notification).toBeDefined();
//   });

//   it('should bind model changes', function () {
//     spyOn(this.importer, 'updateNotification');
//     this.model.trigger('change');
//     expect(this.importer.updateNotification).toHaveBeenCalled();
//   });

//   it('should stop upload and remove it when upload is aborted', function () {
//     spyOn(this.importer, 'clean');
//     this.model.set('state', 'uploading');
//     this.importer._notification.trigger('notification:close');
//     expect(this.importer.clean).toHaveBeenCalled();
//   });

//   it('should show display_name when it is available from import model', function () {
//     this.model._importModel.set({ item_queue_id: 'hello-id', type: '' });
//     this.model.set('state', 'importing');
//     expect(this.importer._getInfo()).toContain('hello-id');
//     this.model._importModel.set('display_name', 'table_name_test');
//     this.model.set('state', 'geocoding');
//     expect(this.importer._getInfo()).toContain('table_name_test');
//     expect(this.importer._getInfo()).not.toContain('hello-id');
//   });
// });
