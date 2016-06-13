var InfowindowView = require('./infowindow-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowView.extend({

  _initTemplates: function () {
    this._templates = [
      {
        value: '',
        label: _t('editor.layers.infowindow.style.none')
      }, {
        value: 'tooltip_light',
        infowindowIcon: require('./infowindow-icons/infowindow-light.tpl'),
        label: _t('editor.layers.infowindow.style.light')
      }, {
        value: 'tooltip_dark',
        infowindowIcon: require('./infowindow-icons/infowindow-dark.tpl'),
        label: _t('editor.layers.infowindow.style.dark')
      }
    ];
  }

});
