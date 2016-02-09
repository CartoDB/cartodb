 var $ = require('jquery');
 var WidgetsFormContentView = require('../../../../javascripts/cartodb3/widgets-form/widgets-form-content-view');
 var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data/widget-definition-model');

 describe('widgets-form/widgets-content-view', function () {
   beforeEach(function () {
     this.widgetDefinitionModel = new WidgetDefinitionModel({
       type: 'formula',
       title: 'AVG districts homes',
       options: {
         column: 'areas'
       }
     }, {
       layerDefinitionModel: new cdb.core.Model(),
       dashboardWidgetsService: new cdb.core.Model()
     });

     this.view = new WidgetsFormContentView({
       widgetDefinitionModel: this.widgetDefinitionModel
     });
   });

   describe('render', function () {
     beforeEach(function () {
       this.view.render();
     });

     it('should render', function () {
       expect(this.view.$('form').length).not.toBe(0);
     });
   });

   describe('on change type', function () {
     beforeEach(function () {
       this.view.render();
       this.widgetDefinitionModel.set({
         type: 'category',
         title: 'Category widget'
       });
     });

     it('should render', function () {
       expect(this.view.$('input[name="title"]').val()).toBe('Category widget');
     });
   });
 });
