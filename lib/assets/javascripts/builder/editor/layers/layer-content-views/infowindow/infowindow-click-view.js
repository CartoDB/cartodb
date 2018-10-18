var InfowindowBaseView = require('./infowindow-base-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowBaseView.extend({

  _initTemplates: function () {
    this._templates = [
      {
        value: '',
        infowindowIcon: require('./infowindow-icons/infowindow-none.tpl'),
        label: _t('editor.layers.infowindow.style.none'),
        tooltip: _t('editor.layers.infowindow.tooltips.none')
      }, {
        value: 'infowindow_light',
        infowindowIcon: require('./infowindow-icons/infowindow-light.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_light'),
        tooltip: _t('editor.layers.infowindow.tooltips.infowindow_light')
      }, {
        value: 'infowindow_dark',
        infowindowIcon: require('./infowindow-icons/infowindow-dark.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_dark'),
        tooltip: _t('editor.layers.infowindow.tooltips.infowindow_dark')
      }, {
        value: 'infowindow_color',
        infowindowIcon: require('./infowindow-icons/infowindow-color.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_color'),
        tooltip: _t('editor.layers.infowindow.tooltips.infowindow_color')
      }, {
        value: 'infowindow_header_with_image',
        infowindowIcon: require('./infowindow-icons/infowindow-image.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_header_with_image'),
        tooltip: _t('editor.layers.infowindow.tooltips.infowindow_header_with_image')
      }
    ];
  }

});
