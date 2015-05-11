  
  /**
   *  Import message info type
   *
   *  Message module within import info view.
   *  It shows up a message, it could appear with
   *  a link.
   *
   *  - It doesn't need any model.
   *  - If a link is present in the message, when user clicks
   *    it will trigger the event defined in href (#/test -> test).
   *  - Parent pane can change the message of the view anytime.
   *
   *
   *  new cdb.admin.ImportInfo.Message({ msg: 'this is a message' });
   *
   */

  cdb.admin.ImportInfo.Message = cdb.core.View.extend({

    className:  'info msg',
    tagName:    'div',

    _MSG: '',

    events: {
      'click a': '_triggerEvent'
    },

    initialize: function(opts) {
      _.bindAll(this, '_triggerEvent')
      if (opts.msg) this._MSG = opts.msg;

      this.render();
    },

    render: function() {
      this.$el.html('<p>' + this._MSG + '</p>')
      return this;
    },

    _triggerEvent: function(e) {
      e.preventDefault();
      var e_type = $(e.target).attr('href').replace(/#\//g,'');
      this.trigger(e_type);
    },

    setMessage: function(msg) {
      this._MSG = msg;
      this.render();
    },

    reset: function() {}
  })