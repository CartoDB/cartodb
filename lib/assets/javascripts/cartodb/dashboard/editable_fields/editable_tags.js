var cdb = require('cartodb.js-v3');

/**
 *  Editable tags
 */
module.exports = cdb.core.View.extend({

  events: {
    "click .js-add-btn": "_edit",
    "click .js-field-input": "killEvent",
    "keydown .js-field-input": "_keyPressed",
    "blur .js-field-input": "_cancelEditing"
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/editable_fields/editable_tags');
    this.editable = this.options.editable;

    // Backbone's className won't work here because we are providing an el
    this.$el.addClass('EditableField');
  },

  render: function() {
    var self = this;
    var tags = this.model.get('tags') || [];
    this.$el.html(this.template({
      tags: _.compact(tags),
      tagsCount: tags.length,
      editable: this.editable,
      router: this.options.router
    }));

    return this;
  },

  _edit: function(ev) {
    this.killEvent(ev);
    this.$el.addClass('is-editing');
    this.$('.js-field-input').val('').focus();
  },

  _keyPressed: function(ev) {
    var enterPressed = (ev.keyCode == $.ui.keyCode.ENTER);
    var escapePressed = (ev.keyCode == $.ui.keyCode.ESCAPE);
    if (enterPressed) {
      this._save();
    } else if (escapePressed) {
      this._cancelEditing();
    }
  },

  _save: function() {
    var tags = this.$('.js-field-input').val().split(',').map(function(tag){
      return cdb.Utils.stripHTML(tag.trim());
    })
    tags = _.chain(tags).compact().uniq().value();
    this.model.save({
      tags: tags
    });
    this.$el.removeClass('is-editing');
    this.render();
  },

  _cancelEditing: function(ev) {
    this.$el.removeClass('is-editing');
  }
});
