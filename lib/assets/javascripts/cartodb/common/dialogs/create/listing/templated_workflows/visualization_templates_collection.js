var cdb = require('cartodb.js');
var VisualizationTemplateModel = require('./visualization_template_model');

// TEST -> template code
var TemplateCode = require('./example/template_code_string');

/**
 *  Visualization templates collection
 *
 *  - A bunch of visualization templates
 *
 */

module.exports = Backbone.Collection.extend({

  model: VisualizationTemplateModel,

  fetch: function() {
    this.trigger("loading", this);
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },

  sync: function(a,b,opts) {
    // WARNING!
    // Getting current maps and using them
    // as faking templates (PUT, DELETE AND POST are
    // not available)
    var maps = new cdb.admin.Visualizations({ type: "derived" });
    
    maps.options.set({
      page: 1,
      per_page: 2,
      tags: 'template'
    });

    maps.fetch({
      success: function(collection) {
        var array = [];
        collection.each(function(mdl) {
          array.push({
            source_visualization_id: mdl.get('id'),
            name: mdl.get('name'),
            description: mdl.get('description'),
            times_used: Math.ceil(Math.random()*100),
            code: TemplateCode
          });
        });
        opts.success(array);
      }
    })
  },

  parse: function(r) {
    return r
  }

})