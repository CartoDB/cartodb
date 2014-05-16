
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
    ]

  })