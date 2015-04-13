var cdb = require('cartodb.js');

/**
 *  Editable text field
 */
module.exports = cdb.core.View.extend({

  events: {
    "click .js-add-btn": "_edit",
    "click .js-field-input": "killEvent",
    "blur .js-field-input": "_cancelEditing",
    "keydown .js-field-input": "_keyPressed"
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_common/views/editable_field');
    this.fieldName = this.options.fieldName;
    this.maxLength = this.options.maxLength || 255;
    this.editable = this.options.editable;
  },

  render: function() {
    var safeHTML = cdb.core.sanitize.html(markdown.toHTML(this.model.get(this.fieldName) || ''))
    var value = {
      safeHTML: safeHTML,
      clean: cdb.Utils.stripHTML(safeHTML)
    };
    this.$el.html(this.template({
      name: this.fieldName,
      value: value,
      editable: this.editable
    }));
    this.$el.addClass('EditableField');

    return this;
  },

  _edit: function(event) {
    this.killEvent(event);

    this.$el.addClass('is-editing');
    this.$('.js-field-input').focus();
  },

  _keyPressed: function(event) {
    var escPressed = (event.keyCode == 27);
    var cmdEnterPressed = ((event.metaKey || event.ctrlKey) &&  event.keyCode == 13);
    var enterPressed = (event.keyCode == 13);
    var currentText = this.$('.js-field-input').val();

    if (cmdEnterPressed) {
      event.preventDefault();
      this._addNewLine();
    } else if (enterPressed && currentText.trim() != '') {
      event.preventDefault();
      this._save();
    } else if (escPressed) {
      this._cancelEditing();
    } else if (currentText.length === this.maxLength) {
      event.preventDefault();
    }
  },

  _addNewLine: function() {
    this.$('.js-field-input').val(this.$('.js-field-input').val() + "\n");
    var attributes = {};
    attributes[this.fieldName] = this.$('.js-field-input').val();
  },

  _save: function() {
    var attributes = {};
    attributes[this.fieldName] = this.$('.js-field-input').val();
    this.model.save(attributes);
    this.render();
  },

  _cancelEditing: function() {
    this.$el.removeClass('is-editing');
    this.$('.js-field-input').val(this.model.get(this.fieldName));
  }
});
