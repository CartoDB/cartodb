var linkIconTemplate = require('./icon-link.tpl');
var cartodbjsIconTemplate = require('./icon-cartodbjs.tpl');
var embedIconTemplate = require('./icon-embed.tpl');
var mobileIconTemplate = require('./icon-mobile.tpl');

module.exports = function (visDefinitionModel) {
  return [{
    createIcon: function () {
      return linkIconTemplate();
    },
    type: 'get-link',
    content: visDefinitionModel.embedURL()
  }, {
    createIcon: function () {
      return embedIconTemplate();
    },
    type: 'embed',
    content: '<iframe width="100%" height="520" frameborder="0" src="' + encodeURI(visDefinitionModel.embedURL()) + '" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>',
    url: encodeURI(visDefinitionModel.embedURL())
  }, {
    createIcon: function () {
      return cartodbjsIconTemplate();
    },
    type: 'cartodbjs',
    content: encodeURI(visDefinitionModel.vizjsonURL()),
    url: 'https://docs.carto.com/cartodb-platform/cartodb-js/'
  }, {
    createIcon: function () {
      return mobileIconTemplate();
    },
    type: 'mobile-sdk',
    content: 'mapView.loadCartoDB("butilon", "7834513e-39ed-11e6-8844-0e674067d321")',
    url: '#'
  }];
};
