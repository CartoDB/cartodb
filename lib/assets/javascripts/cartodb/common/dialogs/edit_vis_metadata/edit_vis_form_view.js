var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Utils = require('cdb.Utils');


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
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/dialogs/edit_vis_metadata/edit_vis_form');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._destroyTags();
    this.$el.html(
      this.template({
        isDataset: this.model.isDataset(),
        isDataLibraryEnabled: this.user.featureEnabled('data_library'),
        visValue: this.model.get('name'),
        visDescription: this.model.get('description'),
        visPrivacy: this.model.get('privacy').toLowerCase(),
        visSource: this.model.get('source'),
        visAttributions: this.model.get('attributions'),
        visDisplayName: this.model.get('display_name'),
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
        html: true,
        title: function() {
          return $(this).data('title');
        }
      })
    );

    // Name error tooltip
    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.js-name'),
        title: function() {
          return self.model.getError();
        }
      })
    );

    // Tags
    _.each(this.model.get('tags'), function(li) {
      this.$(".js-tagsList").append("<li>" + cdb.core.sanitize.html(li) + "</li>");
    }, this);

    var tagsPlaceholder = (!this.model.isMetadataEditable() && this.model.get('tags').length === 0) ? 'No tags' : 'Add tags';

    this.$(".js-tagsList").tagit({
      allowSpaces: true,
      placeholderText: tagsPlaceholder,
      readOnly: !this.model.isMetadataEditable(),
      onBlur: function() {
        if (self.model.isMetadataEditable()) {
          self.$('.js-tags').removeClass('is-focus')
        }
      },
      onFocus: function() {
        if (self.model.isMetadataEditable()) {
          self.$('.js-tags').addClass('is-focus')
        }
      },
      onSubmitTags: function(ev, tagList) {
        ev.preventDefault();
        self._onSubmit();
        return false;
      }
    });

    // Licenses dropdown
    if (this.model.isDataset()) {
      this._licenseDropdown = new cdb.forms.Combo({
        className: 'Select',
        width: '100%',
        property: 'license',
        model: this.model,
        disabled: !this.model.isMetadataEditable(),
        extra: this._getLicensesForFormsCombo()
      });
      this.addView(this._licenseDropdown);
      this.$('.js-license').append(this._licenseDropdown.render().el);
    }
  },

  _getLicensesForFormsCombo: function() {
    var items = cdb.config.get('licenses');
    var emptyOption = [{
      id: '',
      name: '-'
    }];
    return _.chain(emptyOption.concat(items))
      .compact()
      .map(function(d) {
        return [d.name, d.id];
      })
      .value();
  },

  _setFields: function() {
    // for the moment only name input is required
    this.$('.js-name').toggleClass('is-invalid', !!this.model.getError());
  },

  _showPrivacy: function(ev) {
    this.killEvent(ev);
    this.trigger('onPrivacy', this);
  },

  // Form events

  _onNameKeyDown: function(ev) {
    if (ev.keyCode === $.ui.keyCode.ENTER) {
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
      attrs['name'] = Utils.stripHTML(this.$('.js-name').val());
    }
    if (this.model.isMetadataEditable()) {
      attrs['description'] = Utils.removeHTMLEvents(this.$('.js-description').val());
      attrs['tags'] = this.$('.js-tagsList').tagit("assignedTags");

      if (this.model.isDataset()) {
        attrs.source = this.$('.js-source').val();
        attrs.attributions = this.$('.js-attributions').val();
        attrs.display_name = this.$('.js-displayName').val();
        // license is set through dropdown view, so no need to do an explicit set here
      }
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
