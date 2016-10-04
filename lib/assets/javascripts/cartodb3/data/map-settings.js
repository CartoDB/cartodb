module.exports = function (overlaysCollection, mapDefModel, userModel) {
  var overlays = overlaysCollection.pluck('type');

  var accountType = userModel.get('account_type').toLowerCase();
  var isClient = accountType !== 'free';
  var embedOptions = mapDefModel.get('embed_options');

  return [{
    setting: 'search',
    label: _t('editor.settings.preview.options.elements.search'),
    related: 'overlays',
    disabled: false,
    active: overlays.indexOf('search') > 0
  },
  {
    setting: 'zoom',
    label: _t('editor.settings.preview.options.elements.zoom'),
    related: 'overlays',
    disabled: false,
    active: overlays.indexOf('zoom') > 0
  },
  {
    setting: 'fullscreen',
    label: _t('editor.settings.preview.options.elements.fullscreen'),
    related: 'overlays',
    disabled: true,
    active: overlays.indexOf('fullscreen') > 0
  },
  {
    setting: 'logo',
    label: _t('editor.settings.preview.options.elements.logo'),
    related: 'overlays',
    disabled: !isClient,
    active: overlays.indexOf('logo') > 0
  },
  {
    setting: 'legends',
    label: _t('editor.settings.preview.options.elements.legends'),
    related: 'map',
    disabled: false,
    active: embedOptions.legends === true
  },
  {
    setting: 'dashboard_menu',
    label: _t('editor.settings.preview.options.elements.dashboard_menu'),
    related: 'map',
    disabled: false,
    active: embedOptions.dashboard_menu === true
  },
  {
    setting: 'scrollwheel',
    label: _t('editor.settings.preview.options.elements.scrollwheel'),
    related: 'map',
    disabled: false,
    active: embedOptions.scrollwheel === true
  }];
};

