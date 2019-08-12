module.exports = function (overlaysCollection, mapDefModel, userModel) {
  var overlays = overlaysCollection.pluck('type');
  var canRemoveLogo = userModel.get('actions').remove_logo;

  return [{
    setting: 'search',
    label: _t('editor.settings.preview.options.elements.search'),
    related: 'overlays',
    disabled: false,
    enabler: overlays.indexOf('search') > 0
  },
  {
    setting: 'zoom',
    label: _t('editor.settings.preview.options.elements.zoom'),
    related: 'overlays',
    disabled: false,
    enabler: overlays.indexOf('zoom') > 0
  },
  {
    setting: 'logo',
    label: _t('editor.settings.preview.options.elements.logo'),
    related: 'overlays',
    disabled: false,
    hidden: !canRemoveLogo,
    enabler: overlays.indexOf('logo') > 0
  },
  {
    setting: 'legends',
    label: _t('editor.settings.preview.options.elements.legends'),
    related: 'map',
    disabled: false,
    enabler: mapDefModel.get('legends') === true
  },
  {
    setting: 'layer_selector',
    label: _t('editor.settings.preview.options.elements.layer_selector'),
    related: 'map',
    disabled: false,
    enabler: mapDefModel.get('layer_selector') === true
  },
  {
    setting: 'dashboard_menu',
    label: _t('editor.settings.preview.options.elements.dashboard_menu'),
    related: 'map',
    disabled: false,
    enabler: mapDefModel.get('dashboard_menu') === true
  },
  {
    setting: 'scrollwheel',
    label: _t('editor.settings.preview.options.elements.scrollwheel'),
    related: 'map',
    disabled: false,
    enabler: mapDefModel.get('scrollwheel') === true
  }];
};
