var _ = require('underscore');
var Backbone = require('backbone');
var log = require('cdb.log');
var Template = require('./template');

var TemplateList = Backbone.Collection.extend({
  model: Template,

  getTemplate: function (templateName) {
    if (this.namespace) {
      templateName = this.namespace + templateName;
    }

    var t = this.find(function (t) {
      return t.get('name') === templateName;
    });

    if (t) {
      return _.bind(t.render, t);
    }

    log.error(templateName + ' not found');

    return null;
  }
});

module.exports = TemplateList;
