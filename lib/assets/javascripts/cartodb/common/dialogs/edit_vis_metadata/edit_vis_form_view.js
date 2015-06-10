var cdb = require('cartodb.js');
var _ = require('underscore');


/**
 *  Edit visualization (dataset or map) dialog
 *
 */


module.exports = cdb.core.View.extend({

  options: {
    maxLength: 200
  },

  events: {
    'keydown .js-name': '_onNameKeyDown',
    'click .js-privacy': '_showPrivacy',
    'submit': '_onSubmit'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/edit_vis_metadata/edit_vis_form');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._destroyTags();
    var visType = this.model.getVisType();
    this.$el.html(
      this.template({
        visType: visType,
        visTypeCapitalized: visType.charAt(0).toUpperCase() + visType.slice(1),
        visValue: this.model.get('name'),
        visDescription: this.model.get('description'),
        visPrivacy: this.model.get('privacy').toLowerCase(),
        isNameEditable: this.model.isNameEditable(),
        isMetadataEditable: this.model.isMetadataEditable(),
        maxLength: this.options.maxLength
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('error', this._setFields, this);
    this.model.bind('valid', this._setFields, this);
  },

  _initViews: function() {
    var self = this;

    // Markdown tooltip
    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.js-markdown'),
        title: function(e) {
          return $(this).data('title');
        }
      })
    );

    // Name error tooltip
    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.js-name'),
        title: function(e) {
          return self.model.getError();
        }
      })
    );

    // Tags
    _.each(this.model.get('tags'), function(li) {
      this.$(".js-tagsList").append("<li>" + li + "</li>");
    }, this);

    var tagsPlaceholder = (!this.model.isMetadataEditable && this.model.get('tags').length === 0) ? 'No tags' : 'Add tags';

    this.$(".js-tagsList").tagit({
      allowSpaces: true,
      placeholderText: tagsPlaceholder,
      readOnly: !this.model.isMetadataEditable(),
      onBlur: function() {
        self.$('.js-tags').removeClass('is-focus')
      },
      onFocus: function() {
        self.$('.js-tags').addClass('is-focus')
      },
      onSubmitTags: function() {
        self._onSubmit();
      }
    });
  },

  _setFields: function() {
    // for the moment only name input is required
    this.$('.js-name')[ this.model.getError() ? 'addClass' : 'removeClass' ]('is-invalid');
  },

  _showPrivacy: function(ev) {
    this.killEvent(ev);
    this.trigger('onPrivacy', this);
  },

  // Form events

  _onNameKeyDown: function(ev) {
    if (ev.keyCode === 13) {
      ev.preventDefault();
      this._onSubmit();
      return false;
    }
  },

  _onSubmit: function(ev) {
    if (ev) {
      this.killEvent(ev);
    }

    // values
    var attrs = {};
    if (this.model.isNameEditable()) {
      attrs['name'] = this.$('.js-name').val();
    }
    if (this.model.isMetadataEditable()) {
      attrs['description'] = this.$('.js-description').val();
      attrs['tags'] = this.$('.js-tagsList').tagit("assignedTags");
    }
    
    this.model.set(attrs);

    if (this.model.isValid()) {
      this.trigger('onSubmit', this.model, this);
    }
  },

  // Clean functions

  _destroyTags: function() {
    this.$('.js-tagsList').tagit('destroy');
  },

  clean: function() {
    this._destroyTags();
    this.elder('clean');
  }

});
