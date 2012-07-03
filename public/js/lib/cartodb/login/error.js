/**
 * INPUT PLACEHOLDER FOR THE MASSES
 *
 * Simulates a placeholder for a text input
 *
 * usage example:
 *
 *    var settings = new cdb.ui.common.Settings({
 *        el: "#settings_element",
 *        speed: 300
 *    });
 *    settings.show();
 *    // close it
 *    settings.close();
*/


cdb.admin.InputError = cdb.core.View.extend({

  tagName: 'div',
  className: 'error_field',

  // events: {
  //   'click label': 'onLabelClick',
  //   'keyup input': 'onChange'
  // },

  // default_options: {
  //     speed: 300
  // },

  // initialize: function() {
  //   this.input = this.$el.find('input');

  //   // Render
  //   this.render();
    
  //   // Check
  //   this.check();
  // },


  // render: function() {
  //   var $el = this.$el;

  //   // Get label text
  //   var text = this.input.attr("data-label");

  //   if (!text) {
  //     return false;
  //   }

  //   // Prepend label
  //   $el.find("input").before("<label>" + text + "</label>");

  //   return this;
  // },


  // check: function() {
  //   if (this.input.val() != '') {
  //     this.$el.find('label').hide();
  //   }
  // },


  // onLabelClick: function() {
  //   this.input.focus();
  // },


  // onChange: function(ev) {
  //   var value = $(ev.target).val()
  //     , $label = this.$el.find('label');

  //   if (value.length>0) {
  //     $label.fadeOut(10);
  //   } else {
  //     $label.fadeIn(300);
  //   }
  // }


});














// Core = {
//   pluginName : name,
//   options : null,

//   _init : function (options) {
//     // take user options in consideration
//     Core.options = $.extend( true, defaultOptions, options );
//     return this.each( function () {
//       var $el = $(this);

//       // Append necessary html
//       Core._addCustom($el);

//       // Check domain
//       Core._checkDomain($el);

//       // Bind events
//       Core._bind($el);
//     });
//   },


//   _bind: function($el) {
//     $el.find('a').bind({'click':Core._stopPropagation,'mouseover':Core._onMouseover,'mouseout':Core._onMouseout})
//   },


//   _trigger : function ( eventName, data, $el ) {
//     var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

//     if (!isGlobal) {
//       $el.trigger( eventName, data );
//     } else {
//       $.event.trigger( eventName, data );
//     }
//   },


//   // PRIVATE LOGIC
//   _stopPropagation: function(ev) {
//     ev.stopPropagation();
//     ev.preventDefault();
//   },

//   _addCustom: function($el) {
//     var text = $el.text();
//     $el.html('<a class="error" tabindex="-1"></a>' + '<p>' + text + '<span class="tail"></span></p>');
//     $el.show();
//   },

//   _checkDomain: function($el) {
//     /*
//       Check if the field is the domain type and
//       move the .cartodb.com a little more :)
//     */
//     $el.parent().find('span.domain').css('right','42px');
//   },

//   _onMouseover: function(ev) {
//     var $p = $(ev.target).parent().find('p')
//       , height_ = $p.outerHeight();

//     $p.css({opacity:0,display:'inline-block',top: '-' + (height_ + 10 ) + 'px'}).show();

//     if ($.browser.msie && $.browser.version<9) {
//       $p.css({
//         top: '-=5px',
//         opacity: 1,
//         display: 'block'
//       });
//     } else {
//       $p.animate({
//         top: '-=5px',
//         opacity: 1
//       },200);
//     }
//   },

//   _onMouseout: function(ev) {
//     var $p = $(ev.target).parent().find('p');

//     if ($.browser.msie && $.browser.version<9) {
//       $p.css({
//         top: '+=5px',
//         opacity: 0,
//         display: 'none'
//       });
//     } else {
//       $p.animate({
//         top: '+=5px',
//         opacity: 0
//       },200,function(ev){
//         $(this).hide();
//       });
//     }

//   }
// };