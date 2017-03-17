/* global $:false, _:false */

/**
 *  Edit visualization (dataset or map) dialog
 *
 */


cdb.admin.MetadataForm = cdb.core.View.extend({
  className: 'metadata-form',

  options: {
    maxLength: 200
  },

  events: {
    'blur input': '_queueSubmit',
    'blur textarea': '_onSubmit'
  },

  _categoryTree: undefined,
  _DATASETS_CATEGORY: 1,
  _MAPS_CATEGORY: 2,

  initialize: function () {
    this._categoryTree = new cdb.admin.CategoryTree({user: this.options.user, rootId: this._DATASETS_CATEGORY}),

    this.user = this.options.user;
    this.vis = this.options.vis;
    this.template = cdb.templates.getTemplate('table/menu_modules/edit_vis_metadata/edit_vis_form');
    this.model = new cdb.core.MetadataModel({
      vis: this.vis,
      user: this.user,
      dataLayer: this.options.dataLayer
    });

    this._initBinds();
  },

  render: function () {
    this._categoryTree.load(this, this._initCategoryCombos);

    this.clearSubViews();
    this._destroyTags();
    this.$el.html(
      this.template({
        isDataset: this.model.isDataset(),
        isDataLibraryEnabled: this.user.featureEnabled('data_library'),
        visDescription: this.model.get('description'),
        visPrivacy: this.model.get('privacy').toLowerCase(),
        visSource: this.model.get('source'),
        visAttributions: this.model.get('attributions'),
        isMetadataEditable: this.model.isMetadataEditable(),
        maxLength: this.options.maxLength
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.bind('error', this._setFields, this);
    this.model.bind('valid', this._setFields, this);
  },

  _initViews: function () {
    var self = this;

    // Markdown tooltip
    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.js-markdown'),
        html: true,
        title: function () {
          return $(this).data('title');
        }
      })
    );

    // Tags
    _.each(this.model.get('tags'), function (li) {
      this.$('.js-tagsList').append('<li>' + cdb.core.sanitize.html(li) + '</li>');
    }, this);

    var tagsPlaceholder = (!this.model.isMetadataEditable() && this.model.get('tags').length === 0) ? 'No tags' : 'Add tags';

    this.$('.js-tagsList').tagit({
      allowSpaces: true,
      placeholderText: tagsPlaceholder,
      readOnly: !this.model.isMetadataEditable(),
      onBlur: function () {
        if (self.model.isMetadataEditable()) {
          self.$('.js-tags').removeClass('is-focus');
        }
      },
      onFocus: function () {
        if (self.model.isMetadataEditable()) {
          self.$('.js-tags').addClass('is-focus');
        }
      },
      onSubmitTags: function (ev, tagList) {
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

    if (this.model.isDataset()) {
      this._exportableSwitch = new cdb.forms.Switch({
        model: this.model,
        property: 'exportable'
      }).bind('switched', function (ev) {
        if (!this.model.get('exportable')) {
          this.model.set('export_geom', false);
          this._exportGeomSwitch._change();
          this._exportGeomSwitch.$el.addClass('inactive');
        } else {
          this._exportGeomSwitch.$el.removeClass('inactive');
        }
        self._onSubmit(ev);
      }, self);
      this.addView(this._exportableSwitch);
      this.$('.exportable-switch').append(this._exportableSwitch.render().el);

      this._exportGeomSwitch = new cdb.forms.Switch({
        model: this.model,
        property: 'export_geom'
      }).bind('switched', self._onSubmit, self);
      this.addView(this._exportGeomSwitch);
      this.$('.export_geom-switch').append(this._exportGeomSwitch.render().el);

      if (!this.model.get('exportable')) {
        this.model.set('export_geom', false);
        this._exportGeomSwitch._change();
        this._exportGeomSwitch.$el.addClass('inactive');
      }
    }
  },

  _initCategoryCombos: function() {
    var self = this;
    var category = this._categoryTree.getCategory(this.model.get('category'));
    this.model.set('parent_category', category ? category.parent_id : -1);
    this._categoryDropdown = new cdb.forms.Combo({
      className: 'Select',
      width: '200px',
      property: 'parent_category',
      model: this.model,
      disabled: !this.model.isMetadataEditable(),
      extra: this._getCategoriesForFormsCombo(this._DATASETS_CATEGORY)
    }).bind("change", self._onCategorySelectionChanged, self);
    this.addView(this._categoryDropdown);
    this.$('.category-list').append(this._categoryDropdown.render().el);

    this._subCategoryDropdown = new cdb.forms.Combo({
      className: 'Select',
      width: '200px',
      property: 'category',
      model: this.model,
      disabled: !this.model.isMetadataEditable(),
      extra: this._getCategoriesForFormsCombo(category ? category.parent_id : -1, 'Select a sub-category...')
    }).bind("change", self._onSubcategorySelectionChanged, self);
    this.addView(this._subCategoryDropdown);
    this.$('.subcategory-list').append(this._subCategoryDropdown.render().el);
  },

  _onCategorySelectionChanged: function(ev) {
    var self = this;

    this._subCategoryDropdown.unbind("change", self._onSubcategorySelectionChanged);
    this._subCategoryDropdown.remove();

    var parentCategoryId = this.model.get('parent_category');

    this._subCategoryDropdown = new cdb.forms.Combo({
      className: 'Select',
      width: '100%',
      property: 'category',
      model: this.model,
      disabled: !this.model.isMetadataEditable(),
      extra: this._getCategoriesForFormsCombo(parentCategoryId, 'Select a sub-category...')
    }).bind("change", self._onSubcategorySelectionChanged, self);
    this.addView(this._subCategoryDropdown);
    this.$('.subcategory-list').append(this._subCategoryDropdown.render().el);
  },

  _onSubcategorySelectionChanged: function(ev) {
    this._onSubmit(ev);
  },

  _getLicensesForFormsCombo: function () {
    var items = cdb.config.get('licenses');
    var emptyOption = [{
      id: '',
      name: 'Select a license...'
    }];
    return _.chain(emptyOption.concat(items))
      .compact()
      .map(function (d) {
        return [d.name, d.id];
      })
      .value();
  },

  _getCategoriesForFormsCombo: function(parentId, placeholderTitle) {
    var childCategories = this._categoryTree.getChildCategories(parentId);
    var items = [[placeholderTitle || 'Select a category...', -1]];
    var i, category, numCategories = childCategories.length;
    for (i = 0; i < numCategories; ++i) {
      category = childCategories[i];
      items.push([category.name, category.id]);
    }
    
    return items;
  },

  _showPrivacy: function (ev) {
    this.killEvent(ev);
    this.trigger('onPrivacy', this);
  },

  // Form events

  _queueSubmit: function (ev) {
    // By adding a new event, we guarentee that this will execute after the
    // current event resolves.
    // See http://stackoverflow.com/a/7760544
    window.setTimeout(this._onSubmit.bind(this), 0);
  },

  _onSubmit: function (ev) {
    if (ev) {
      this.killEvent(ev);
    }

    // values
    var attrs = {};
    if (this.model.isMetadataEditable()) {
      // collect changed attributes
      attrs['name'] = this.vis.get('name');
      attrs['description'] = cdb.Utils.removeHTMLEvents(this.$('.js-description').val());
      attrs['tags'] = this.$('.js-tagsList').tagit('assignedTags');

      if (this.model.isDataset()) {
        attrs.source = this.$('.js-source').val();
        attrs.attributions = this.$('.js-attributions').val();
        attrs.exportable = this.model.get('exportable');
        attrs.export_geom = this.model.get('export_geom');
        attrs.category = this.model.get('category');
      // license is set through dropdown view, so no need to do an explicit set here
      }
    }

    // Set and save attributes
    this.model.set(attrs);
    var oldAttrs = this.vis.attributes;
    if (!_.isEmpty(this.vis.changedAttributes(attrs))) {
      this.vis.set(attrs);
      this.vis.save({}, {
        error: function () {
          this.vis.set(oldAttrs);
        }
      });
    }
  },

  // Clean functions

  _destroyTags: function () {
    this.$('.js-tagsList').tagit('destroy');
  },

  clean: function () {
    this._destroyTags();
    this.elder('clean');
  }

});
