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
    var c = this.compiled = this.compiled || this.get('compiled') || _.template(this.get('template'));
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
    cdb.log.error(template_name+" not found");
    return null;
  }
});

/**
 * global variable
 */
cdb.templates = new cdb.core.TemplateList();

/**
 * load JST templates.
 * rails creates a JST variable with all the templates.
 * This functions loads them as default into cbd.template
 */
cdb._loadJST = function() {
  if(typeof(window.JST) !== undefined) {
      cdb.templates.reset(
        _(JST).map(function(tmpl, name) {
          return { name: name, compiled: tmpl };
        })
      );
  }
}

