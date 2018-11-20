const $ = require('jquery');
const markdown = require('markdown');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const template = require('./editable-description.tpl');

/**
 *  Editable description
 */
module.exports = CoreView.extend({

  events: {
    'click .js-add-btn': '_edit',
    'click .js-field-input': 'killEvent',
    'blur .js-field-input': '_cancelEditing',
    'keydown .js-field-input': '_keyPressed'
  },

  options: {
    editable: true,
    maxLength: 200
  },

  initialize: function () {
    // Backbone's className won't work here because we are providing an el
    this.$el.addClass('EditableField');
  },

  render: function () {
    const safeHTML = Utils.sanitizeHtml(markdown.toHTML(this.model.get('description') || ''));
    const value = {
      safeHTML: safeHTML,
      clean: Utils.stripHTML(safeHTML)
    };
    this.$el.html(template({
      value: value,
      editable: this.options.editable,
      maxLength: this.options.maxLength
    }));

    return this;
  },

  _edit: function (event) {
    this.killEvent(event);

    this.$el.addClass('is-editing');
    this.$('.js-field-input').val('').focus();
  },

  _keyPressed: function (event) {
    // TODO: Check that both args of comparison are of equal types
    const escPressed = event.keyCode === $.ui.keyCode.ESCAPE;
    // TODO: Check that both args of comparison are of equal types
    const cmdEnterPressed = ((event.metaKey || event.ctrlKey) && event.keyCode === $.ui.keyCode.ENTER);
    const enterPressed = event.keyCode === $.ui.keyCode.ENTER;
    const currentText = this.$('.js-field-input').val();

    if (cmdEnterPressed) {
      event.preventDefault();
      this._addNewLine();
    } else if (enterPressed && currentText.trim() !== '') {
      event.preventDefault();
      this._save();
    } else if (escPressed) {
      this._cancelEditing();
    }
  },

  _addNewLine: function () {
    const $input = this.$('.js-field-input');
    $input.val($input.val() + '\n');

    // Scroll to bottom of the textarea
    $input[0].scrollTop = $input[0].scrollHeight;
  },

  _save: function () {
    const attributes = {
      description: this.$('.js-field-input').val()
    };
    this.model.save(attributes);
    this.$el.removeClass('is-editing');
    this.render();
  },

  _cancelEditing: function () {
    this.$el.removeClass('is-editing');
  }
});
