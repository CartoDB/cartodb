var cdb = require('cartodb.js');

/**
 *  Editable tags
 */
module.exports = cdb.core.View.extend({

  events: {
    "click .js-add-btn": "_edit",
    "keydown .tagit-new input": "_keyPressed",
    "blur .tagit-new input": "_cancelEditing"
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_common/views/editable_tags');
    this.editable = this.options.editable;

    // Backbone's className won't work here because we are providing an el
    this.$el.addClass('EditableTags');
  },

  render: function() {
    var self = this;

    var tags = this.model.get('tags');
    this.$el.html(this.template({
      tags: tags,
      tags_count: tags.length,
      editable: this.editable,
      router: this.options.router
    }));

    this.$(".tags").tagit({
      allowSpaces: true,
      onSubmitTags: function() {
        self._save();
      }
    });

    return this;
  },

  _edit: function(ev) {
    this.killEvent(ev);
    this.$el.addClass('is-editing');
    this.$('.tags').data('tagit').tagInput.focus();
    this.$('.tags').tagit("removeAll");
  },

  _keyPressed: function(ev) {
    var escapePressed = (ev.keyCode == $.ui.keyCode.ESCAPE);
    if (escapePressed) {
      this._cancelEditing();
    }
  },

  _save: function() {
    this.model.save({
      tags: this.$('.tags').tagit("assignedTags")
    });
    this.render();
  },

  _cancelEditing: function(ev) {
    this.$el.removeClass('is-editing');
  }
});
