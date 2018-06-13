// var Backbone = require('backbone');
// require('builder/components/form-components/editors/size/size.js');

// describe('/components/form-components/editors/size/size', function () {
//   var size;

//   function createSize (opts) {
//     opts = opts || {};
//     var modelOptions = {};
//     if (opts.fillSize) {
//       modelOptions.fillSize = {
//         fixed: opts.fillSize
//       };
//     }

//     var options = {
//       model: new Backbone.Model(modelOptions),
//       key: 'fillSize',
//       schema: {
//         validators: [ 'required' ],
//         editorAttrs: {
//           geometryName: 'point',
//           hidePanes: []
//         }
//       }
//     };

//     if (opts.hidePanes) {
//       options.schema.editorAttrs.hidePanes = opts.hidePanes;
//     }
//     if (opts.columns) {
//       options.schema.options = opts.columns;
//     }
//     return new Backbone.Form.editors.Size(options);
//   }

//   describe('render', function () {
//     it('both fixed and value if no options passed about it', function () {
//       size = createSize();

//       expect(size.$('.js-menu').children().length).toBe(2);
//       var labels = size.$('.js-menu > li label');
//       expect(labels.length).toBe(2);
//       expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.fixed');
//       expect(labels[1].textContent.trim()).toContain('form-components.editors.fill.input-number.by-value');
//     });

//     it('only fixed if hidePanes set with `value`', function () {
//       size = createSize({
//         hidePanes: ['value'],
//         fillSize: 7
//       });

//       // Menu
//       expect(size.$('.js-menu').children().length).toBe(1);
//       var labels = size.$('.js-menu > li label');
//       expect(labels.length).toBe(1);
//       expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.fixed');

//       // Form content
//       expect(size.$('.js-content form').length).toBe(1);
//       expect(size.$('.js-content form .js-input').val()).toEqual('7');
//     });

//     it('only by value if hidePanes set with `fixed`', function () {
//       size = createSize({
//         hidePanes: ['fixed'],
//         columns: [{
//           val: 'cartodb_id',
//           label: 'cartodb_id',
//           type: 'number'
//         },
//         {
//           val: 'the_geom',
//           label: 'the_geom',
//           type: 'geometry'
//         }]
//       });

//       // Menu
//       expect(size.$('.js-menu').children().length).toBe(1);
//       var labels = size.$('.js-menu > li label');
//       expect(labels.length).toBe(1);
//       expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.by-value');

//       // Form content
//       expect(size.$('.js-content .Form-StyleByValue').length).toBe(1); // SizeByValueView has been rendered
//     });
//   });
// });
