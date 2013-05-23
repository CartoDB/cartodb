/**
 * view for dropdown show when user click on row options
 */
cdb.admin.NewGeometryDropdown = cdb.admin.DropdownMenu.extend({

  className: 'dropdown border',

  events: {
    'click .line': 'newLine',
    'click .point': 'newPoint',
    'click .polygon': 'newPolygon'
  },

  // New show function
  show: function() {
    var dfd = $.Deferred();
    var self = this;
    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();

    this.$el
      .css({
        marginTop: self.options.vertical_position == "down" ? "-1px" : "-50px",
        marginLeft: 15,
        opacity:0,
        display:"block"
      })
      .animate({
        marginLeft: 0,
        opacity: 1
      }, {
        "duration": this.options.speedIn,
        "complete": function(){
          dfd.resolve();
        }
      });
    this.trigger("onDropdownShown",this.el);

    return dfd.promise();
  },

  hide: function(done) {
    var self = this;
    this.isOpen = false;

    this.$el.animate({
      marginLeft: -15,
      opacity: 0
    },this.options.speedOut, function(){
      // Remove selected class
      $(self.options.target).removeClass("selected");
      // And hide it
      self.$el.hide();
      done && done();
      self.trigger("onDropdownHidden",this.el);
    });
  },

  _trigger: function(e, t) {
    this.killEvent(e);
    this.trigger('newGeometry', t);
    this.hide();
  },

  newPolygon: function(e) {
    this._trigger(e, 'polygon')
  },

  newLine: function(e) {
    this._trigger(e, 'line')
  },

  newPoint: function(e) {
    this._trigger(e, 'point')
  }


});
