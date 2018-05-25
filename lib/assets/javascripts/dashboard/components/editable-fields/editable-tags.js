const _ = require('underscore');
const $ = require('jquery');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const template = require('./editable-tags.tpl');

/**
 *  Editable tags
 */
module.exports = CoreView.extend({
  events: {
    'click .js-add-btn': '_edit',
    'click .js-field-input': 'killEvent',
    'keydown .js-field-input': '_keyPressed',
    'blur .js-field-input': '_cancelEditing'
  },

  initialize: function () {
    this.editable = this.options.editable;

    // Backbone's className won't work here because we are providing an el
    this.$el.addClass('EditableField');
  },

  render: function () {
    const tags = this.model.get('tags') || [];

    this.$el.html(template({
      tags: _.compact(tags),
      tagsCount: tags.length,
      editable: this.editable,
      router: this.options.routerModel
    }));

    return this;
  },

  _edit: function (event) {
    this.killEvent(event);
    this.$el.addClass('is-editing');
    this.$('.js-field-input').val('').focus();
  },

  _keyPressed: function (event) {
    const enterPressed = event.keyCode === $.ui.keyCode.ENTER;
    const escapePressed = event.keyCode === $.ui.keyCode.ESCAPE;

    if (enterPressed) {
      this._save();
    } else if (escapePressed) {
      this._cancelEditing();
    }
  },

  _save: function () {
    let tags = this.$('.js-field-input')
      .val()
      .split(',')
      .map(tag => Utils.stripHTML(tag.trim()));

    tags = _.chain(tags).compact().uniq().value();

    this.model.save({
      tags: tags
    });
    this.$el.removeClass('is-editing');
    this.render();
  },

  _cancelEditing: function (ev) {
    this.$el.removeClass('is-editing');
  }
});
