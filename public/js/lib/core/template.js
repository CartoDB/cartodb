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

  get_template: function(template_name) {
    return this.find(function(t) { return t.get('name') === template_name; });
  }
});

/**
 * global variable
 */
cdb.templates = new cdb.core.TemplateList();
