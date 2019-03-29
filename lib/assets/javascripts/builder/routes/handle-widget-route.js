module.exports = function (currentRoute, widgetDefinitionsCollection) {
  var widgetId = currentRoute[0] === 'widget' ? currentRoute[1] : null;

  widgetDefinitionsCollection.trigger('setSelected', widgetId);
};
