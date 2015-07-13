
// Example of template code


module.exports = "{"+
" steps: ["+
"   {"+
"     title: 'Choose Twitter categories',"+
"     description: 'Enter twitter search terms split in 2 categories and assign them a color. The terms will match exactly.',"+
"     forms: [{"+
"       name: 'Category 1',"+
"       form: {"+
"         'category_text_1': {"+
"           type: 'category',"+
"           validate: function(attrs) {"+
"             if (!attrs.category_text_1 || attrs.category_text_1.length > 1024) {"+
"               return 'Category text cannot be null or bigger than 1024 characters'"+
"             }"+
"           }"+
"         },"+
"         'category_color_1': {"+
"           type: 'color',"+
"           value: 'orange'," + // 
"           validate: function(attrs) {"+
"             if (!attrs.category_color_1) {"+
"               return 'Category color is needed'"+
"             }"+
"           }"+
"         }"+
"       }"+
"     },{"+
"       name: 'Category 2',"+
"       form: {"+
"         'category_text_2': {"+
"           type: 'category',"+
"           validate: function(attrs) {"+
"             if (!attrs.category_text_2 || attrs.category_text_2.length > 1024) {"+
"               return 'Category text cannot be null or bigger than 1024 characters'"+
"             }"+
"           }"+
"         },"+
"         'category_color_2': {"+
"           type: 'color',"+
"           value: 'orange'," + // 
"           validate: function(attrs) {"+
"             if (!attrs.category_color_2) {"+
"               return 'Category color is needed'"+
"             }"+
"           }"+
"         }"+
"       }"+
"     },{"+
"       name: 'From / to',"+
"       form: {"+
"         'date_range': {"+
"           type: 'date_range',"+
"           validate: function(attrs) {"+
"             if (!attrs.date_range) {"+
"               return 'hello'"+
"             }"+
"           }"+
"         },"+
"       }"+
"     },{"+
"       name: 'Use',"+
"       form: {"+
"         'twitter_credits': {"+
"           type: 'user_slider',"+
"           validate: function(attrs) {"+
"             return "+
"           }"+
"         },"+
"       }"+
"     }],"+
"     validate: function(attrs) {"+
"       return true"+
"     }"+
"   }"+
" ],"+
" onStepFinished: function(step, attributes, done) {"+
"   done(null);"+
" },"+
" onWizardFinished: function(visualization, attributes, done) {"+
"   var style = {}; style['text-align'] = 'left'; style['box-color'] = 'red'; style['box-opacity'] = 0.1; style['line-color'] = 'black';"+
"   var overlay = new cdb.admin.models.Overlay({"+
"     type: 'annotation',"+
"     extra: { latlng: [40.766940, -73.976859], text: 'Santana', rendered_text: 'Santana' },"+
"     text: 'Santana',"+
"     style: style"+
"   });"+
"   visualization.overlays.add(overlay);"+
"   var opts = { complete: function() { done(); }};"+
"   overlay.save(null, opts);"+
" },"+
" getStep: function(i) { return this.steps[i] },"+
" getStepNames: function() { return _.pluck(this.steps, 'title') }"+
"}";