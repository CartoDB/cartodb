var _ = require('underscore');
var Backbone = require('backbone');

module.exports = function(Template, log) {
  if (!Template) throw new Error('Template is required');
  if (!log) throw new Error('log (cdb.log) is required');

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
