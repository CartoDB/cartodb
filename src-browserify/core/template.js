var _ = require('underscore');
var Backbone = require('backbone');
var Mustache = require('mustache');
var log = require('cdb.log');

/**
 * template system
 * usage:
   var tmpl = new Template({
     template: "hi, my name is {{ name }}",
     type: 'mustache' // undescore by default
   });
   console.log(tmpl.render({name: 'rambo'})));
   // prints "hi, my name is rambo"


   you could pass the compiled tempalte directly:

   var tmpl = new Template({
     compiled: function() { return 'my compiled template'; }
   });
 */
var Template = Backbone.Model.extend({

  initialize: function() {
    this.bind('change', this._invalidate);
    this._invalidate();
  },

  url: function() {
    return this.get('template_url');
  },

  parse: function(data) {
    return {
      'template': data
    };
  },

  _invalidate: function() {
    this.compiled = null;
    if(this.get('template_url')) {
      this.fetch();
    }
  },

  compile: function() {
    var tmpl_type = this.get('type') || 'underscore';
    var fn = Template.compilers[tmpl_type];
    if(fn) {
      return fn(this.get('template'));
    } else {
      log.error("can't get rendered for " + tmpl_type);
    }
    return null;
  },

  /**
   * renders the template with specified vars
   */
  render: function(vars) {
    var c = this.compiled = this.compiled || this.get('compiled') || this.compile();
    var rendered = c(vars);
    return rendered;
  },

  asFunction: function() {
    return _.bind(this.render, this);
  }

}, {
  compilers: {
    'underscore': _.template,
    'mustache': typeof(Mustache) === 'undefined' ?
      null :
      // Replacement for Mustache.compile, which was removed in version 0.8.0
      function compile(template) {
        Mustache.parse(template);
        return function (view, partials) {
          return Mustache.render(template, view, partials);
        };
      }
  },
  compile: function(tmpl, type) {
    var t = new Template({
      template: tmpl,
      type: type || 'underscore'
    });
    return _.bind(t.render, t);
  }
});

module.exports = Template;
