var _ = require('underscore');
var Backbone = require('backbone');

// NOTE this does not return a TemplateList directly, but a wrapper, to inject the dependencies
// e.g. var TemplateList = require('./template-list')(cdb.core.Template, cdb.log);
// @param {Object} Template class defintion of core/Template
// @param {Object} log an instance of core/log
module.exports = function(Template, log) {
  if (!Template) throw new Error('Template is required');
  if (!log) throw new Error('log is required');

  var TemplateList = Backbone.Collection.extend({
    model: Template,

    getTemplate: function(template_name) {
      if (this.namespace) {
        template_name = this.namespace + template_name;
      }

      var t = this.find(function(t) {
          return t.get('name') === template_name;
      });

      if(t) {
        return _.bind(t.render, t);
      }

      log.error(template_name + " not found");

      return null;
    }
  });

  return TemplateList;
};
