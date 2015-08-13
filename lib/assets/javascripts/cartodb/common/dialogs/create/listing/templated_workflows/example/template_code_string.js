
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
"           value: '#A53ED5'," + // 
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
"           value: '#5CA2D1'," + // 
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
"   visualization.map.layers.fetch({"+
"     success: function(layers) {"+
"       layers.at(2).destroy({ wait: true, error: function(){}, success: function(){} });"+
"     }"+
"   });"+
"   var importedVis = imports[0].importedVis();"+
"   var tableName = importedVis.get('table').name;"+
"   var cartoCSS = '#twitter_burgerking_mcdonalds{'+"+
"   '  polygon-fill: transparent;'+"+
"   '  polygon-opacity: 0.3;'+"+
"   '  line-color: black;'+"+
"   '  line-width: 0;'+"+
"   '  line-opacity: 1;'+"+
"   '  [leaning < 0]{'+"+
"   '    polygon-fill: magenta;'+"+
"   '    line-width: 0.5;'+"+
"   '  }'+"+
"   '  [leaning > 0]{'+"+
"   '    polygon-fill: aqua;'+"+
"   '    line-width: 0.5;'+"+
"   '  }'+"+
"   '  [leaning < -5],[leaning > 5]{'+"+
"   '    polygon-opacity: 0.3;'+"+
"   '  }'+"+
"   '  [leaning < -10],[leaning > 10]{'+"+
"   '    polygon-opacity: 0.5;'+"+
"   '  }'+"+
"   '  [leaning < -15],[leaning > 15]{'+"+
"   '    polygon-opacity: 0.7;'+"+
"   '  }'+"+
"   '  [leaning < -20],[leaning > 20]{'+"+
"   '    polygon-opacity: 0.9;'+"+
"   '  }'+"+
"   '}';"+
"   cartoCSS = cartoCSS.replace(/twitter_burgerking_mcdonalds/g,tableName);"+
"   var sql = 'SELECT a.the_geom_webmercator, sum(floor(t.category_name::numeric*1.5)-2) as leaning '+"+
"   'FROM (SELECT CDB_HexagonGrid(ST_SetSRID((SELECT ST_Extent(the_geom_webmercator) FROM '+"+
"   'twitter_burgerking_mcdonalds),3857), 100000) as the_geom_webmercator) a, twitter_burgerking_mcdonalds'+"+
"   ' t WHERE ST_Intersects(a.the_geom_webmercator, t.the_geom_webmercator) GROUP BY a.the_geom_webmercator';"+
"   sql = sql.replace(/twitter_burgerking_mcdonalds/g,tableName);"+
"   var startDate = new Date(attributes.date_range.fromDate + ' ' + attributes.date_range.fromHour + ':' + attributes.date_range.fromMin);"+
"   var endDate = new Date(attributes.date_range.toDate + ' ' + attributes.date_range.toHour + ':' + attributes.date_range.toMin);"+
"   visualization.set({"+
"     name: attributes.category_1 + ' vs ' + attributes.category_2,"+
"     description: 'From ' + startDate + ' to ' + endDate"+
"   });"+
"   var style = {}; style['text-align'] = 'left'; style['box-color'] = 'red'; style['box-opacity'] = 0.1; style['line-color'] = 'black';"+
"   var overlay = new cdb.admin.models.Overlay({"+
"     device: 'desktop',"+
"     display: true,"+
"     type: 'annotation',"+
"     minZoom: 0,"+
"     maxZoom: 40,"+
"     extra: { latlng: [40.76, -73.97], text: 'Santana', rendered_text: 'Santana' },"+
"     style: {"+
"       'z-index': 4,"+
"       color: '#ffffff',"+
"       'text-align': 'left',"+
"       'font-size': '13',"+
"       'font-family-name': 'Helvetica',"+
"       'box-color': '#000000',"+
"       'box-opacity': .7,"+
"       'box-padding': 5,"+
"       'line-color': '#000000',"+
"       'line-width': 50,"+
"       'min-zoom': 0,"+
"       'max-zoom': 40"+
"     }"+
"   });"+
"   visualization.overlays.add(overlay);"+
"   overlay.save();"+
"   visualization.save();"+
"   visualization.map.save({"+
"     view_bounds_sw: [-14.093957177836224, 220.60546875],"+
"     view_bounds_ne: [66.30220547599842, 386.71875]"+
"   });"+
"   visualization.map.addCartodbLayerFromTable(tableName, '', {"+
"     vis: visualization,"+
"     success: function(layer) {"+
"       layer.legend = new cdb.geo.ui.LegendModel();"+
"       layer.legend.set({"+
"         type: 'custom',"+
"         visible: true,"+
"         title: '',"+
"         template: '',"+
"         show_title: false,"+
"         items: [{"+
"           name: attributes.category_1,"+
"           value: attributes.category_color_1,"+
"           visible: true"+
"         },{"+
"           name: attributes.category_2,"+
"           value: attributes.category_color_2,"+
"           visible: true"+
"         }]"+
"       });"+
"       layer.set({"+
"         query: sql,"+
"         tile_style: cartoCSS,"+
"         tile_style_custom: true"+
"       });"+
"       layer.save();"+
"       setTimeout(done, 5000);"+
"     },"+
"     error: function() {"+
"       debugger;"+
"     }"+
"   })"+
" },"+
" getStep: function(i) { return this.steps[i] },"+
" getStepNames: function() { return _.pluck(this.steps, 'title') }"+
"}";