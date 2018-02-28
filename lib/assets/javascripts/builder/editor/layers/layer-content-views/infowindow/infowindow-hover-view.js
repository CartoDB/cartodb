var InfowindowBaseView = require('./infowindow-base-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowBaseView.extend({

  _initTemplates: function () {
    this._templates = [
      {
        value: '',
        infowindowIcon: require('./tooltip-icons/tooltip-none.tpl'),
        label: _t('editor.layers.infowindow.style.none'),
        tooltip: _t('editor.layers.infowindow.tooltips.none')
      }, {
        value: 'tooltip_light',
        infowindowIcon: require('./tooltip-icons/tooltip-light.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_light'),
        tooltip: _t('editor.layers.infowindow.tooltips.infowindow_light')
      }, {
        value: 'tooltip_dark',
        infowindowIcon: require('./tooltip-icons/tooltip-dark.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_dark'),
        tooltip: _t('editor.layers.infowindow.tooltips.infowindow_dark')
      }
    ];
  }

});
