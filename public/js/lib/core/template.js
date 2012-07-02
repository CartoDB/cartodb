/**
 * template system
 */


cdb.core.Template = Backbone.Model.extend({

  initialize: function() {
    this.bind('change:template', this._invalidate);
  },

  _invalidate: function() {
    this.compiled = null;
  },

  /**
   * renders the template with specified vars
   */
  render: function(vars) {
    var c = this.compiled = this.compiled || _.template(this.get('template'));
    var r = cdb.core.Profiler.get('template_render');
    r.start();
    var rendered = c(vars);
    r.end();
    return rendered;
  }

});

cdb.core.TemplateList = Backbone.Collection.extend({

  model: cdb.core.Template,

  getTemplate: function(template_name) {
    var t = this.find(function(t) { 
        return t.get('name') === template_name; 
    });
    if(t) {
        return _.bind(t.render, t);
    }
    return null;
  }
});

/**
 * global variable
 */
cdb.templates = new cdb.core.TemplateList();
