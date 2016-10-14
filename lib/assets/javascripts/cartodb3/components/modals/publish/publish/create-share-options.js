var linkIconTemplate = require('./icon-link.tpl');
var embedIconTemplate = require('./icon-embed.tpl');
var cartodbjsIconTemplate = require('./icon-cartodbjs.tpl');

module.exports = function (visDefinitionModel) {
  return [{
    createIcon: function () {
      return linkIconTemplate();
    },
    type: 'get-link',
    content: visDefinitionModel.embedURL(),
    private: visDefinitionModel.get('privacy') === 'PRIVATE',
    disabled: false
  }, {
    createIcon: function () {
      return embedIconTemplate();
    },
    type: 'embed',
    content: '<iframe width="100%" height="520" frameborder="0" src="' + encodeURI(visDefinitionModel.embedURL()) + '" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>',
    url: encodeURI(visDefinitionModel.embedURL()),
    private: visDefinitionModel.get('privacy') === 'PRIVATE',
    disabled: false
  }, {
    createIcon: function () {
      return cartodbjsIconTemplate();
    },
    type: 'cartodbjs',
    content: encodeURI(visDefinitionModel.vizjsonURL()),
    url: 'https://docs.carto.com/cartodb-platform/cartodb-js/',
    private: false,
    disabled: true
  }];
};
