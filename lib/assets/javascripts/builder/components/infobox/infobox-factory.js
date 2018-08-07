var InfoboxView = require('./infobox-item-view');

module.exports = {
  // Infobox with no buttons, only message
  createInfo: function (opts) {
    var closable = opts.closable === undefined ? true : opts.closable;
    return new InfoboxView({
      type: opts.type || 'default',
      title: opts.title,
      body: opts.body,
      closable: closable
    });
  },

  createWithAction: function (opts) {
    var closable = opts.closable === undefined ? true : opts.closable;
    var options = {
      type: opts.type || 'default',
      title: opts.title,
      body: opts.body,
      closable: closable,
      klass: opts.className
    };

    if (opts.action) {
      options.action = {
        label: opts.action.label,
        type: opts.action.type
      };
    }

    return new InfoboxView(options);
  },

  createLoading: function (opts) {
    return new InfoboxView({
      type: opts.type || 'default',
      title: opts.title || '',
      body: opts.body,
      loading: true
    });
  },

  createQuota: function (opts) {
    if (opts.closable === undefined) {
      opts.closable = true;
    }

    return new InfoboxView(opts);
  }
};
