var _ = require('underscore');
var Template = require('../../core/template');
var Model = require('../../core/model');
var View = require('../../core/view');

var SlidesControllerItem = View.extend({

  tagName: "li",

  events: {
    "click a": "_onClick",
  },

  template: Template.compile('<a href="#" class="<%- transition_trigger %>"></a>'),

  initialize: function() {

    this.model = new Model(this.options);
    this.model.bind("change:active", this._onChangeActive, this);

  },

  _onChangeActive: function(e) {

    if (this.model.get("active")) {
      this.$el.find("a").addClass("active");
    } else {
      this.$el.find("a").removeClass("active");
    }

  },

  _onClick: function(e) {
    if (e) this.killEvent(e);
    this.trigger("onClick", this)
  },

  render: function() {

    var options = _.extend({ transition_trigger: "click" }, this.options.transition_options);

    this.$el.html(this.template(options));

    this._onChangeActive();

    return this;
  }

});

module.exports = SlidesControllerItem;
