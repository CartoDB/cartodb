
// Example of template code


module.exports = "{"+
" steps: ["+
"   {"+
"     title: 'Choose Twitter categories',"+
"     description: 'Enter twitter search terms split in 2 categories and assign them a color. The terms will match exactly.',"+
"     forms: [{"+
"       name: 'Category 1',"+
"       form: {"+
"         'category_1': {"+
"           type: 'twitter_category',"+
"           validate: function(attrs) {"+
"             if (attrs.category_1.length === 0) {"+
"               return 'Category cannot be empty'"+
"             }"+
"             if (attrs.category_1.length > 29) {"+
"               return 'Category terms cannot be greater than 29 terms'"+
"             }"+
"             if (attrs.category_1.concat('').length > (1024 - 28)) {"+
"               return 'Category text cannot be greater of 1024 characters'"+
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
"         'category_2': {"+
"           type: 'twitter_category',"+
"           validate: function(attrs) {"+
"             if (attrs.category_2.length === 0) {"+
"               return 'Category cannot be empty'"+
"             }"+
"             if (attrs.category_2.length > 29) {"+
"               return 'Category terms cannot be greater than 29 terms'"+
"             }"+
"             if (attrs.category_2.concat('').length > (1024 - 28)) {"+
"               return 'Category text cannot be greater of 1024 characters'"+
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
"             var startDate = new Date(attrs.date_range.fromDate + ' ' + attrs.date_range.fromHour + ':' + attrs.date_range.fromMin);"+
"             var endDate = new Date(attrs.date_range.toDate + ' ' + attrs.date_range.toHour + ':' + attrs.date_range.toMin);"+
"             if (startDate >= endDate) {"+
"               return 'Start date should not be greater than the end date'"+
"             }"+
"           }"+
"         }"+
"       }"+
"     },{"+
"       name: 'Use',"+
"       form: {"+
"         'twitter_credits': {"+
"           type: 'twitter_credits_usage',"+
"           validate: function(attrs) {"+
"             return"+
"           }"+
"         },"+
"       }"+
"     }],"+
"     validate: function(attrs) {"+
"       return"+
"     }"+
"   }"+
" ],"+
" imports: function(attrs){"+
"   return [{"+
"     name: 'Twitter categories',"+
"     type: 'service',"+
"     service_name: 'twitter_search',"+
"     service_item_id: { "+
"       categories: [{"+
"         category: '1',"+
"         terms: attrs.category_1"+
"       },{"+
"         category: '2',"+
"         terms: attrs.category_2"+
"       }],"+
"       dates: {"+
"         fromDate: attrs.date_range.fromDate,"+
"         fromHour: attrs.date_range.fromHour,"+
"         fromMin: attrs.date_range.fromMin,"+
"         toDate: attrs.date_range.toDate,"+
"         toHour: attrs.date_range.toHour,"+
"         toMin: attrs.date_range.toMin"+
"       }"+
"     }," +
"     user_defined_limits: {"+
"       twitter_credits_limit: attrs.twitter_credits"+
"     }"+
"   }]"+
" },"+
" onStepFinished: function(step, attributes, done) {"+
"   done(null);"+
" },"+
" onWizardFinished: function(visualization, attributes, imports, done) {"+
"   var importedVis = imports[0].importedVis();"+
"   var tableName = importedVis.get('table').name;"+
"   visualization.map.addCartodbLayerFromTable(tableName, '', {"+
"     vis: visualization,"+
"     success: function(layer) {"+
"       var CATEGORY_SEPARATOR = ', ';" +
"       var categories = [];" +
"       categories.push({" +
"         color: attributes.category_color_1," +
"         title: attributes.category_1.join(CATEGORY_SEPARATOR)," +
"         title_type: 'string'," +
"         value_type: 'color'" +
"       });" +
"       categories.push({" +
"         color: attributes.category_color_2," +
"         title: attributes.category_2.join(CATEGORY_SEPARATOR)," +
"         title_type: 'string'," +
"         value_type: 'color'" +
"       });" +
"       layer.wizard_properties.active('category', { property: 'category_terms', categories: categories, metadata: {} });" +
"       done();"+
"     },"+
"     error: function() {"+
"       debugger;"+
"     }"+
"   })"+
" },"+
" getStep: function(i) { return this.steps[i] },"+
" getStepNames: function() { return _.pluck(this.steps, 'title') }"+
"}";