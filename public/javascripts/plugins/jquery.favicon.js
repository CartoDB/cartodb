/**
 * jQuery Favicon plugin
 * http://hellowebapps.com/products/jquery-favicon/
 *
 * Copyright (c) 2010 Volodymyr Iatsyshyn (viatsyshyn@hellowebapps.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * 
 */
 
(function($){

    var canvas;

    function apply (url) {
        $('link[rel$=icon]').replaceWith('');
		$('head').append(
		    $('<link rel="shortcut icon" type="image/x-icon"/>')
				.attr('href', url));    
    }

    /**
     * jQuery.favicon
     *
     * @param {String} iconURL
     * @param {String} alternateURL
     * @param {Function} onDraw
     *
     * function (iconURL)
     * function (iconURL, onDraw)
     * function (iconURL, alternateURL, onDraw)
     */
    $.favicon = function(iconURL, alternateURL, onDraw) {

		if (arguments.length == 2) {
			// alternateURL is optional
			onDraw = alternateURL;
		}
	
		if (onDraw) {
			canvas = canvas || $('<canvas />')[0];
			if (canvas.getContext) {
				var img = $('<img />')[0];
				img.onload = function () {
                    $.favicon.unanimate();
                    
                    canvas.height = canvas.width = this.width;
					var ctx = canvas.getContext('2d');
					ctx.drawImage(this, 0, 0);
					onDraw(ctx);
					apply(canvas.toDataURL('image/png'));
				};
				img.src = iconURL;
			} else {
				apply(alternateURL || iconURL);
			}
		} else {
            $.favicon.unanimate();
            
            apply(iconURL);
		}
		
		return this;
	};

    var animation = {
        timer: null,
        frames: [],
        size: 16,
        count: 1
    };
    
    $.extend($.favicon, {
        /**
         * jQuery.favicon.animate - starts frames based animation
         *
         * @param {String}      animationURL    Should be image that contains frames joined horizontally
         * @param {String}      alternateURL    Normal one frame image that will be used if Canvas is not supported
         * @param {Object}      options         optional
         *
         * function (animationURL, alternateURL)
         * function (animationURL, alternateURL, {
         *   interval: 1000, // change frame in X ms, default is 1000ms
         *   onDraw: function (context, frame) {}, // is called each frame
		 *   onStop: function () {}, // is called on animation stop
         *   frames: [1,3,5] // display frames in this exact order, defaults is all frames
         * })
         */
        animate: function (animationURL, alternateURL, options) {
            options = options || {};
                    
            canvas = canvas || $('<canvas />')[0];
			if (canvas.getContext) {
				var img = $('<img />')[0];
				img.onload = function () {

                    $.favicon.unanimate();

					animation.onStop = options.onStop;
					
                    animation.image = this;
                    canvas.height = canvas.width = animation.size = this.height;
                    animation.count = this.width / this.height;
                    
                    var frames = [];
                    for (var i = 0; i < animation.count; ++i) frames.push(i);
                    animation.frames = options.frames || frames;

					var ctx = canvas.getContext('2d');

					options.onStart && options.onStart();
                    animation.timer = setInterval(function () {
                        // get current frame
                        var frame = animation.frames.shift();
                        animation.frames.push(frame);

                        // check if frame exists
                        if (frame >= animation.count) {
                            clearInterval(animation.timer);
                            animation.timer = null;
                            
                            throw new Error('jQuery.favicon.animate: frame #' + frame + ' do not exists in "' + animationURL + '"');
                        }

                        // draw frame
                        var s = animation.size;
                        ctx.drawImage(animation.image, s * frame, 0, s, s, 0, 0, s, s);

                        // User Draw event
                        options.onDraw && options.onDraw(ctx, frame);

                        // set favicon
                        apply(canvas.toDataURL('image/png'));
                    }, options.interval || 1000);
				};
				img.src = animationURL;
			} else {
				apply(alternateURL || animationURL);
			}
        },

        /**
         * jQuery.favicon.unanimate - stops current animation
         */
        unanimate: function () {
            if (animation.timer) {
                clearInterval(animation.timer);
                animation.timer = null;
				
				animation.onStop && animation.onStop();
            }
        }
    })
})(jQuery);