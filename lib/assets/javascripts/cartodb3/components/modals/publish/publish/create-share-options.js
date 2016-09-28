var linkIconTemplate = require('./icon-link.tpl');
var embedIconTemplate = require('./icon-embed.tpl');
var mobileIconTemplate = require('./icon-mobile.tpl');
// var cartodbjsIconTemplate = require('./icon-cartodbjs.tpl');

module.exports = function (visDefinitionModel) {
  return [{
    createIcon: function () {
      return linkIconTemplate();
    },
    type: 'get-link',
    content: visDefinitionModel.embedURL(),
    private: visDefinitionModel.get('privacy') === 'PRIVATE'
  }, {
    createIcon: function () {
      return embedIconTemplate();
    },
    type: 'embed',
    content: '<iframe width="100%" height="520" frameborder="0" src="' + encodeURI(visDefinitionModel.embedURL()) + '" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>',
    url: encodeURI(visDefinitionModel.embedURL()),
    private: visDefinitionModel.get('privacy') === 'PRIVATE'
  }, {
  //   createIcon: function () {
  //     return cartodbjsIconTemplate();
  //   },
  //   type: 'cartodbjs',
  //   content: encodeURI(visDefinitionModel.vizjsonURL()),
  //   url: 'https://docs.carto.com/cartodb-platform/cartodb-js/',
  //   private: false
  // }, {
    createIcon: function () {
      return mobileIconTemplate();
    },
    type: 'mobile-sdk',
    content: encodeURI(visDefinitionModel.vizjsonURL()),
    url: '#',
    private: false
  }];
};
