
/*****************/
/*	  WIDGETS	 	 */
/*****************/

// TODO: refresh columns when it comes from the table :S -> The same for infowindow vars :S

/* COLOR INPUT */
(function($, window, undefined) {

	// constants
	var TRUE = true, FALSE = true, NULL = null
		, name = 'colorPicker'
 	// Plugin parts
 		, Core, API, Helper
 	// default options
	 	, defaultOptions = {
	  		globalEvents : [],
	  		colors: [
		    	 ['grey','#333333'],['white', '#FFFFFF'],['red', '#E25B5B'],['orange', '#FF9900'],['yellow', '#FFCC00'],['green', '#99CC00']
		    	,['blue', '#0099FF'],['pink', '#FF3366'],['dark_black', '#000000'],['dark_grey', '#B7B0B0'],['dark_red', '#AB4343'],['dark_orange', '#D78100'],['dark_yellow', '#B59100']
		    	,['dark_green', '#719700'],['dark_blue', '#006BB4'],['dark_pink', '#AA2143']
		    ]
	 		};

		
		/***************************************************************************
		* Private methods
		**************************************************************************/
		Core = {
		  pluginName : name,
		  options : null,


		_init : function (options) {
			// take user options in consideration
		 	Core.options = $.extend( true, defaultOptions, options );
		 	return this.each( function () {
		  	var $el = $(this);
		   	
		   	// Append necessary html
		   	Core._addElements($el);

		   	// Unique ID for GOD
		   	$el.data('id',createUniqueId());

		   	// Bind events
		   	Core._bind($el);
		 	});
		},
 

	  _bind: function($el) {
	  	// GOD
	    var ev = '_close.palette.' + $el.data('id');
	  	$(window).bind(ev,function(){Core._hidePalette($el)});

	    $el.find('a.control').bind({'click': Core._toggle});
	    $el.find('input').bind({'change': Core._changeColor, 'click': Core._stopPropagation});
	    $el.find('span.palette ul li a').bind({'click': Core._chooseColor});

	  },


	  _trigger : function ( eventName, data, $el ) {
	    var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

	    if (!isGlobal) {
	      $el.trigger( eventName, data );
	    } else {
	      $.event.trigger( eventName, data );
	    }
	  },


   	// PRIVATE LOGIC
   	_stopPropagation: function(ev) {
   		ev.stopPropagation();
   		ev.preventDefault();
   	},


   	_toggle: function(ev) {
   		Core._stopPropagation(ev);

  		var $el = $(this).closest('span.color');
      var palette = $el.find('span.palette');
      if (!palette.is(':visible')) {
      	Core._showPalette($el);
    	} else {
      	Core._hidePalette($el);
      }
   	},


   	_showPalette: function($el) {
   		var iden = $el.data('id');
      // Show this one
      $el.find('span.palette').show();
      // GOD
    	GOD.broadcast("_close.palette." + iden,0);
    	GOD.subscribe("_close.palette." + iden,0);
   	},



   	_hidePalette: function($el) {
   		var iden = $el.data('id') || $(this).closest('span.color').data('id');
   		GOD.unsubscribe({ev:"_close.palette." + iden,type:0});
   		$el.find('span.palette').hide();
   	},


   	_changeColor: function (ev) {
   		Core._stopPropagation(ev);
   		
   		var color = new RGBColor($(this).val());
   		var $el = $(this).closest('span.color');
			if (color.ok) {
			 	var new_color = color.toHex();
			 	var css_ = $el.attr('css');
			 	$el.find('a.control').removeClass('error').css({'background-color':new_color});
			 	$(this).removeClass('error');
			 	
			 	// CHANGE COLOR
			 	Core._trigger('change',new_color,$el);
			} else {
				$(this).addClass('error');
			 	$el.find('a.control').removeAttr('style').addClass('error');
			}
   	},


   	_chooseColor: function (ev) {
      Core._stopPropagation(ev);

      // Get the value
      var new_color = $(this).attr('href')
      	,	$el 			= $(this).closest('span.color');
      
      // Hide the palette
      Core._hidePalette($el);
      
      // Save the new color
      $el.find('a.control').removeClass('error').css({'background-color':new_color});
      $el.find('input').val(new_color);
      $(this).removeClass('error');

      // CHANGE THE COLOR!
      Core._trigger('change',new_color,$el);
   	},


   	_addElements: function($el) {
    	// 		- Create the color list
     	var colors_list = '<ul>';
      _.each(defaultOptions.colors,function(color,i){
      	colors_list += '<li><a href="' + color[1] + '" style="background-color:' + color[1] + '">' + color[0] + '</a></li>';
      });
      colors_list += '</ul>';

      $el.append(
      	'<span class="palette">' + colors_list + '</span>'+
      	'<a href="#change_color" style="background-color:'+ Core.options.value +'" class="control"></a>'+
      	'<input type="text" value="'+ Core.options.value +'"/>'
      );
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {
		// YOUR PLUGIN PUBLIC LOGIC HERE
	};


	/***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


	/***************************************************************************
	 * Plugin installation
	**************************************************************************/
	$.fn[name] = function (userInput) {

	  // check if such method exists
	  if ( $.type( userInput ) === "string" && API[ userInput ] ) {
	    return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
	  }
	  // initialise otherwise
	  else if ( $.type( userInput ) === "object" || !userInput ) {
	    return Core._init.apply( this, arguments );
	  } else {
	    $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
	  }
	};
})( jQuery, window );


/* ALPHA SLIDER */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'customSlider'
	 // Plugin parts
	 	, Core, API, Helper
	 // default options
	 	, defaultOptions = {
	  		globalEvents : []

	 		};

		
		/***************************************************************************
		* Private methods
		**************************************************************************/
		Core = {
		  pluginName : name,
		  options : null,


		_init : function (options) {
			// take user options in consideration
		 	Core.options = $.extend( true, defaultOptions, options );
		 	return this.each( function () {
		  	var $el = $(this);
		   	
		   	// Append necessary html
		   	Core._addElements($el);

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
	  	// Just the slider
	  	$el.find('div.slider').slider({
        max:100,
        min:0,
        range: "min",
        value: Core.options.value || 50,
        slide: Core._slide,
        stop: Core._stop
      });
	  },


	  _trigger : function ( eventName, data, $el ) {
	    var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

	    if (!isGlobal) {
	      $el.trigger( eventName, data );
	    } else {
	      $.event.trigger( eventName, data );
	    }
	  },


   	// PRIVATE LOGIC
   	_slide: function(ev,ui) {
   		$el = $(ui.handle).closest('span.alpha');
   		$el.find('span.tooltip')
      	.css({left:$(ui.handle).css('left')})
        .text(ui.value+'%')
        .show();
   	},

   	_stop: function(ev,ui) {
   		$el = $(ui.handle).closest('span.alpha');
   		$el.find('span.tooltip').hide();
      Core._trigger('change',ui.value,$el);
   	}, 	

   	_addElements: function($el) {
   		// Add the slider
      $el.append(
      	'<div class="slider"></div>'+
        '<span class="tooltip">83%</span>'
      );
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


	/***************************************************************************
	 * Plugin installation
	**************************************************************************/
	$.fn[name] = function (userInput) {

	  // check if such method exists
	  if ( $.type( userInput ) === "string" && API[ userInput ] ) {
	    return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
	  }
	  // initialise otherwise
	  else if ( $.type( userInput ) === "object" || !userInput ) {
	    return Core._init.apply( this, arguments );
	  } else {
	    $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
	  }
	};
})( jQuery, window );


/* RANGE INPUT */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'rangeInput'
	 // Plugin parts
	 	, Core, API, Helper
	 // default options
	 	, interval
	 	, defaultOptions = {
	  		globalEvents : []
	 		};

		
		/***************************************************************************
		* Private methods
		**************************************************************************/
		Core = {
		  pluginName : name,
		  options : null,

		_init : function (options) {
			// take user options in consideration
		 	Core.options = $.extend( true, defaultOptions, options );
		 	return this.each( function () {
		  	var $el = $(this);
		   	
		   	// Append necessary html
		   	Core._addElements($el);

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
      $el.find('a').click(Core._changeValue);
	  },


	  _trigger : function ( eventName, data, $el ) {
	    var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

	    if (!isGlobal) {
	      $el.trigger( eventName, data );
	    } else {
	      $.event.trigger( eventName, data );
	    }
	  },


   	// PRIVATE LOGIC

   	_changeValue: function(ev) {
   		ev.preventDefault();

	    var old_value = $(this).parent().find('input').val(),
	        add = ($(this).text()=="+")?true:false,
	        that = this;
	        
	    // TODO: Add logic of max and min 

	    if (add || old_value>0) {
				var new_value = parseInt(old_value) + ((add)?1:-1);
	      $(that).parent().find('input').val(new_value);
	      var $el = $(this).closest('span.numeric');
	      
	      clearInterval(interval);
	      interval = setTimeout(function(){
	      	Core._trigger('change',new_value,$el);
	      },400);
	    }
   	},


   	_addElements: function($el) {
   		// Add the range input
      $el.append(
      	'<input disabled="disabled" class="range_value" type="text" value="'+Core.options.value+'"/>'+
        '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
        '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'
      );

      // Max?
      if (Core.options.type=="max") {
      	$el.append(
	      	'<p>Max</p>'
	      );
	      //$el.find('input').removeAttr('disabled');
      }

      // Min?
      if (Core.options.type=="min") {
      	$el.append(
	      	'<p>Min</p>'
	      );
	      //$el.find('input').removeAttr('disabled');
      }
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


	/***************************************************************************
	 * Plugin installation
	**************************************************************************/
	$.fn[name] = function (userInput) {

	  // check if such method exists
	  if ( $.type( userInput ) === "string" && API[ userInput ] ) {
	    return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
	  }
	  // initialise otherwise
	  else if ( $.type( userInput ) === "object" || !userInput ) {
	    return Core._init.apply( this, arguments );
	  } else {
	    $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
	  }
	};
})( jQuery, window );


/* DROPDOWN */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'customDropdown'
	 // Plugin parts
	 	, Core, API, Helper
	 // default options
	 	, defaultOptions = {
	  		globalEvents : []
	 		};

		
		/***************************************************************************
		* Private methods
		**************************************************************************/
		Core = {
		  pluginName : name,
		  options : null,

		_init : function (options) {
			// take user options in consideration
		 	Core.options = $.extend( true, defaultOptions, options );
		 	return this.each( function () {
		  	var $el = $(this);
		   	
		   	// Append necessary html
		   	Core._addElements($el);

		   	// Unique ID for GOD
		   	$el.data('id',createUniqueId());

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
	  	// GOD
	    var ev = '_close.dropdown.' + $el.data('id');
	  	$(window).bind(ev,function(){Core._closeSource($el)});

      $el.find('span.select').click(Core._openSource);
      $el.find('li a').live('click',Core._changeValue);
	  },


	  _trigger : function ( eventName, data, $el ) {
	    var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

	    if (!isGlobal) {
	      $el.trigger( eventName, data );
	    } else {
	      $.event.trigger( eventName, data );
	    }
	  },


   	// PRIVATE LOGIC
   	_stopPropagation: function(ev) {
   		ev.stopPropagation();
   		ev.preventDefault();
   	},


   	_changeValue: function(ev) {
   		Core._stopPropagation(ev);
   		
   		var $el = $(this).closest('span.dropdown');

   		// If clicked is not selected
   		if (!$(this).parent().hasClass('selected')) {
   			var value = $(this).attr('href').replace('#','')
   				, text = $(this).text();
   			// Remove previous selected item
   			$el.find('li.selected').removeClass('selected').removeClass('selected');

   			Core.options.value = value;

   			// Select this item
   			$(this).parent().addClass('selected');

   			// Trigger new value
   			Core._trigger('change',value,$el);

   			// Change value in the selector
   			$el.find('span.select').text(text).removeClass('first');
   		}

   		// Close the source	
   		Core._closeSource($el);
   	},


   	_openSource: function(ev) {
   		Core._stopPropagation(ev);
   		var $el = $(this).closest('span.dropdown');

   		// Check height and positionate correctly
   		var ul_height = $el.find('div.jspPane li').size() * 23;

   		if (ul_height<118) {
   			$el.find('div.options_list').css({height: ul_height + 2 + 'px', top:'-' + ((ul_height/2) - 10) + 'px'});
   			$el.find('ul').css({height: ul_height + 'px'});
   		} else {
   			$el.find('div.options_list').removeAttr('style');
   		}

   		$el.addClass('selected');
   		// GOD open
   		var iden = $el.data('id');
   		GOD.broadcast("_close.dropdown." + iden,0);
    	GOD.subscribe("_close.dropdown." + iden,0);
   	},


   	_closeSource: function($el) {
   		$el.removeClass('selected');
   		// GOD close
   		var iden = $el.data('id');
    	GOD.unsubscribe({ev:"_close.dropdown." + iden,type:0});
   	},


   	_addList: function($el) {
			var scrollPane = $el.find('ul').data('jsp');

			// Remove old list
			scrollPane.getContentPane().find('li').remove();

			var list_items = '';
			
			if ($el.hasClass('buckets')) {
				for (var i = 3, length = 8; i<length; i++) {
					var class_ = ((i==Core.options.value)?"class='selected selected'":'' );
					list_items += '<li ' + class_ + '><a href="#' + i + '">' + i + ' buckets</a></li>'
				}
			} else {
	    	_.each(Core.options.source,function(el,i){
	    		// Check if it is number
	    		if (el[1] == "number") {
	    			var class_ = ((el[0]==Core.options.value)?"class='selected selected'":'' );
	    			list_items += '<li ' + class_ + '><a href="#' + el[0] + '">' + el[0] + '</a></li>'
	    		}
	    	});
    	}

    	// New source added
			scrollPane.getContentPane().append(list_items);

			// Reinitialise the scroll
			scrollPane.reinitialise();

			// Selector need to change!
			var value;

			if ($el.hasClass('buckets')) {
				value = Core.options.value || 3;
				value += ' buckets'
			} else {
				value = Core.options.value || Core.options.unselect || 'Select an option';
			}

			$el.find('span.select')
				.text(value)
   	},


   	_addElements: function($el) {
   		// Add the range input
      $el.append(
      	'<span class="select"></span>'+
      	'<div class="options_list">'+
      		'<ul></ul>'+
      	'</div>'
      );

      // Add jScrollPane :S
      $el.find('ul').jScrollPane({autoReinitialise:true});

      //Add the source if exists
      Core._addList($el,Core.options.source);
	  }
 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {
		update: function(source) {

			// Remove old list and add the new source
			var $el = $(this);

			Core.options.source = source;

			Core._addList($el);
		}
	};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


	/***************************************************************************
	 * Plugin installation
	**************************************************************************/
	$.fn[name] = function (userInput) {

	  // check if such method exists
	  if ( $.type( userInput ) === "string" && API[ userInput ] ) {
	    return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
	  }
	  // initialise otherwise
	  else if ( $.type( userInput ) === "object" || !userInput ) {
	    return Core._init.apply( this, arguments );
	  } else {
	    $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
	  }
	};
})( jQuery, window );


/* COLOR RAMP */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'colorRamp'
	 // Plugin parts
	 	, Core, API, Helper
	 // default options
	 	, defaultOptions = {
	  		globalEvents : []
	 		};

		
		/***************************************************************************
		* Private methods
		**************************************************************************/
		Core = {
		  pluginName : name,
		  options : null,

		_init : function (options) {
			// take user options in consideration
		 	Core.options = $.extend( true, defaultOptions, options );
		 	Core.options.colors = Core.options.colors || color_ramps;

		 	return this.each( function () {
		  	var $el = $(this);
		   	
		   	// Append necessary html
		   	Core._addElements($el);

		   	// Unique ID for GOD
		   	$el.data('id',createUniqueId());

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
	  	// GOD
	    var ev = '_close.dropdown.' + $el.data('id');
	  	$(window).bind(ev,function(){Core._closeSource($el)});

      $el.find('span.select').click(Core._openSource);
	  },


	  _trigger : function ( eventName, data, $el ) {
	    var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

	    if (!isGlobal) {
	      $el.trigger( eventName, data );
	    } else {
	      $.event.trigger( eventName, data );
	    }
	  },


   	// PRIVATE LOGIC
   	_stopPropagation: function(ev) {
   		ev.stopPropagation();
   		ev.preventDefault();
   	},


   	_changeValue: function(ev) {
   		Core._stopPropagation(ev);

   		var $el = $(this).closest('span.color_ramp')
   			, $table = $(this).find('table');

   		// If clicked is not selected
   		if (!$(this).hasClass('selected')) {
   			var value = Core.options.colors[$table.attr('class')][Core.options.buckets + 'b'];
   			
   			Core.options.color = $table.attr('class');
   			Core.options.value = value;

   			// Remove previous selected item
   			$el.find('li.selected').removeClass('selected');

   			// Select this item
   			$(this).addClass('selected');

   			// Trigger new value
   			Core._trigger('change',[value],$el);

   			// Change value in the selector
   			Core._createSelected($el);
   		}

   		// Close the source	
   		Core._closeSource($el);
   	},


   	_openSource: function(ev) {
   		Core._stopPropagation(ev);

   		var $el = $(this).closest('span.color_ramp');
   		$el.addClass('selected');

   		// GOD open
   		var iden = $el.data('id');
   		GOD.broadcast("_close.dropdown." + iden,0);
    	GOD.subscribe("_close.dropdown." + iden,0);
   	},


   	_closeSource: function($el) {
   		var iden = $el.data('id');
    	GOD.unsubscribe({ev:"_close.dropdown." + iden,type:0});

   		$el.removeClass('selected');
   	},


   	_addList: function($el) {
   		// Remove listener
   		$el.find('li').unbind('click');

			$el.find('ul li').remove();

			var color_rule = '';
    	_.each(Core.options.colors,function(type,i){
    		var class_ = ((i==Core.options.color)?"class='selected selected'":'' );
    		color_rule += '<li ' + class_ + '><table class="' + i + '"><tr class="' + Core.options.buckets + 'b' + '">';
    		_.each(type[Core.options.buckets + 'b'],function(color,i){
    			color_rule += '<td style="background:' + color + '">x</td>'
    		});
    		color_rule += '</tr></table><span class="bkg"></span></li>';
    	});
    	

    	// New source added
			$el.find('ul').append(color_rule);

			// Add listener again
			$el.find('li').click(Core._changeValue);
   	},


   	_searchBucket: function($el) {

   		_.each(Core.options.colors,function(ele,color){
   			var cont = 0;

   			_.each(ele[Core.options.buckets + 'b'],function(c,pos){
   				if (c == Core.options.value[pos]) {
   					cont++;
   				}
   			});

   			if (cont == Core.options.buckets) {
   				Core.options.color = color;
   			}
   		});

   		Core._createSelected($el);
   	},


   	_createSelected: function($el) {

   		// Print selected bucket
      var selected_color = '<table class="' + Core.options.color + ' selected"><tr class="' + Core.options.buckets + 'b' + '">'
      	, values = Core.options.colors[Core.options.color][Core.options.buckets + 'b'];

  		_.each(values,function(color,pos){
  			selected_color += '<td style="background:' + color + '">x</td>'
  		});

  		selected_color += '</table><span class="first bkg"></span>';

      $el.find('span.select').html(selected_color);
   	},


   	_addElements: function($el) {
   		// Add the range input
      $el.append(
      	'<span class="select"><table><tr></tr></table></span>'+
      	'<div class="options_list">'+
      		'<ul></ul>'+
      	'</div>'
      );

      // Search selected bucket
      Core._searchBucket($el);


      //Add the source if exists
      Core._addList($el,Core.options.source);
	  }
 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {
		update: function(source) {
			Core.options.buckets = source;
			Core._addList($(this));
			Core._createSelected($(this));
			Core._trigger('change',[Core.options.colors[Core.options.color][Core.options.buckets + 'b']],$(this));
		}
	};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


	/***************************************************************************
	 * Plugin installation
	**************************************************************************/
	$.fn[name] = function (userInput) {

	  // check if such method exists
	  if ( $.type( userInput ) === "string" && API[ userInput ] ) {
	    return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
	  }
	  // initialise otherwise
	  else if ( $.type( userInput ) === "object" || !userInput ) {
	    return Core._init.apply( this, arguments );
	  } else {
	    $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
	  }
	};
})( jQuery, window );