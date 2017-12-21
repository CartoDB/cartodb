
  /**
   *  Tooltip tab pane
   *
   *  - Extending infowindow tab.
   */

  cdb.admin.mod.TooltipTab = cdb.admin.mod.InfoWindowTab.extend({

    _CUSTOM_TEMPLATES_PATH: 'table/views/tooltip/custom_templates',

    _THEMES: [
      ['light', 'tooltip_light'],
      ['dark',  'tooltip_dark']
    ],

    _renderComponents: function() {
      // Themes combo
      this.themes = new cdb.forms.Combo({
        className: 'form_combo left',
        property: 'template_name',
        extra: this._THEMES,
        model: this.model
      });
      this.$('.header').append(this.themes.render().el);
      this.addView(this.themes);

      // Remove controls label
      this.$('.controls').remove();
    }

  })