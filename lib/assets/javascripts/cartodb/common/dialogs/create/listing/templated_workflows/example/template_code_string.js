
// Example of template code


module.exports = "{"+
" steps: ["+
"   {"+
"     title: 'Choose city',"+
"     forms: [{"+
"       name: 'CartoDB ID',"+
"       form: {"+
"         'cartodb_id': {"+
"           type: 'select',"+
"           query: 'select cartodb_id from guys_guys'," + // 
"           validate: function(attr) {"+
"             if (!attrs.cartodb_id) {"+
"               return 'City name is empty'"+
"             }"+
"           }"+
"         }"+
"       }"+
"     }],"+
"     validate: function(attrs) {"+
"       if (!attrs.cartodb_id) {"+
"         return 'City name is empty'"+
"       }"+
"     }"+
"   },"+
"   {"+
"     title: 'Select date range',"+
"     forms: [{"+
"       name: 'City name',"+
"       form: {"+
"         'city_name': {"+
"           type: 'select',"+
"           extra: ['Madrid'],"+
"           value: 'Madrid'"+
"         }"+
"       },"+
"       validate: function(attrs) {"+
"         if (attrs.date_start > attrs.date_end) {"+
"           return 'date start should be...'"+
"         }"+
"         return null;"+
"       }"+
"     }]"+
"   }"+
" ],"+
" onStepFinished: function(step, attributes, done) {"+
"   done(null);"+
" },"+
" onWizardFinished: function(visualization, attributes, done) {"+
"   var style = {}; style['text-align'] = 'left'; style['box-color'] = 'red'; style['box-opacity'] = 0.1; style['line-color'] = 'black';"+
"   var overlay = new cdb.admin.models.Overlay({"+
"     type: 'annotation',"+
"     extra: { latlng: [40.766940, -73.976859], text: 'Santana gay', rendered_text: 'Santana <strong>gay</strong>' },"+
"     text: 'Santana gay',"+
"     style: style"+
"   });"+
"   visualization.overlays.add(overlay);"+
"   var opts = { complete: function() { done(); }};"+
"   overlay.save(null, opts);"+
" },"+
" getStep: function(i) { return this.steps[i] },"+
" getStepNames: function() { return _.pluck(this.steps, 'title') }"+
"}";