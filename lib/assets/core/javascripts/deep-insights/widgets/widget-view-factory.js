var _ = require('underscore');
var WidgetView = require('./widget-view');

var WidgetViewFactory = function (defs) {
  this.defs = [];
  _.each(defs, function (def) {
    this.addType(def);
  }, this);
};

WidgetViewFactory.prototype.DEFAULT_CLASS_NAMES = 'CDB-Widget CDB-Widget--light';

WidgetViewFactory.prototype.addType = function (def) {
  if (!def.match) {
    if (def.type) {
      def.match = function (widget) {
        return widget.get('type') === this.type;
      };
    } else {
      throw new Error('def.type or def.match must be provided for createContentView to work');
    }
  }
  if (!_.isFunction(def.createContentView)) throw new Error('def.createContentView must be a function');
  this.defs.push(def);
};

/**
 * @returns {Object, undefined} Returns nothing if there is not matching view for the given model
 */
WidgetViewFactory.prototype.createWidgetView = function (widget) {
  var def = _.find(this.defs, function (def) {
    return def.match(widget);
  });

  if (def) {
    var attrs = {
      className: this.DEFAULT_CLASS_NAMES,
      model: widget,
      contentView: def.createContentView(widget)
    };

    return new WidgetView(
      _.isFunction(def.customizeWidgetAttrs)
        ? def.customizeWidgetAttrs(attrs)
        : attrs
    );
  }
};

module.exports = WidgetViewFactory;
