/* jQuery beforeafter-map/CartoDB plugin
 * @author @cartodb - http://www.twitter.com/cartodb
 * @version 0.1
 * @date November 12, 2014
 * category jQuery plugin
 * @license CC Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0) - http://creativecommons.org/licenses/by-nc-sa/3.0/ 
 Original code altered from:
 * jQuery beforeafter-map plugin
 * @author @grahamimac - http://www.twitter.com/grahamimac
 * @version 0.11
 * @date December 17, 2013
 * @category jQuery plugin
 * @license CC Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0) - http://creativecommons.org/licenses/by-nc-sa/3.0/ 
 Original code altered from:
 * jQuery beforeafter plugin
 * @author admin@catchmyfame.com - http://www.catchmyfame.com
 * @version 1.4
 * @date September 19, 2011
 * @category jQuery plugin
 * @copyright (c) 2009 admin@catchmyfame.com (www.catchmyfame.com)
 * @license CC Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0) - http://creativecommons.org/licenses/by-nc-sa/3.0/
 */
(function($){
	$.fn.extend({ 
		beforeAfter: function(_before_,_after_,options)
		{
			var defaults = 
			{
				animateIntro : false,
				introDelay : 1000,
				introDuration : 1000,
				introPosition : .5,
				showFullLinks : true,
				beforeLinkText: 'Show only before',
				afterLinkText: 'Show only after',
				imagePath : './css/images/',
				cursor: 'pointer',
				clickSpeed: 600,
				linkDisplaySpeed: 200,
				dividerColor: '#888',
				enableKeyboard: false,
				keypressAmount: 20,
				onReady: function(){},
				changeOnResize: true,
				permArrows: false,
				arrowTop: 0.5,
				arrowLeftOffset: 0,
				arrowRightOffset: 0
			};
		var options = $.extend(defaults, options);
		if (!_before_ || !_after_){ 
			console.log('Error: pass variables used to create the map in .beforeAfter argument. E.g. $("map-container").beforeAfter(before,after,options).');
			return;
		}

		var randID =  Math.round(Math.random()*100000000);

    		return this.each(function() {
			var o=options;
			var obj = $(this);

			var mapWidth = $('div:first', obj).width();
			var mapHeight = $('div:first', obj).height();
			var lArrOffsetStatic = -24;
			var rArrOffsetStatic = 24;

			$(obj)
			.width(mapWidth)
			.height(mapHeight)
			.css({'overflow':'hidden','position':'relative','padding':'0'});
			
			var _bSelect_ = $('div:first', obj), _aSelect_ = $('div:last', obj),
			_bID_ = $(_before_._container).attr('id'), _aID_ = $(_after_._container).attr('id');
			
			_before_.options.inertia = false;
			_after_.options.inertia = false;
						
			// Create an inner div wrapper (dragwrapper) to hold the images.
			$(obj).prepend('<div id="dragwrapper'+randID+'"><div id="drag'+randID+'"><img width="8" height="56" alt="handle" src="'+o.imagePath+'handle.gif" id="handle'+randID+'" /></div></div>'); // Create drag handle
			$('#dragwrapper'+randID).css({'opacity':.25,'position':'absolute','padding':'0','left':(mapWidth*o.introPosition)-($('#handle'+randID).width()/2)+'px','z-index':'20'}).width($('#handle'+randID).width()).height(mapHeight);

			$(_before_._container).height(mapHeight).width(mapWidth*o.introPosition).css({'position':'absolute','overflow':'hidden','left':'0px','z-index':'10'}); // Set CSS properties of the before map div
			$(_after_._container).height(mapHeight).width(mapWidth).css({'position':'absolute','overflow':'hidden','right':'0px'});	// Set CSS properties of the after map div
			$('#drag'+randID).width(2).height(mapHeight).css({'background':o.dividerColor,'position':'absolute','left':'3px'});	// Set drag handle CSS properties
			$(_before_._container).css({'position':'absolute','top':'0px','left':'0px'});
			$(_after_._container).css({'position':'absolute','top':'0px','right':'0px'});
			$('#handle'+randID).css({'z-index':'100','position':'relative','cursor':o.cursor,'top':(mapHeight/2)-($('#handle'+randID).height()/2)+'px','left':'-3px'})

			$(obj).append('<img src="'+o.imagePath+'lt-small.png" id="lt-arrow'+randID+'"><img src="'+o.imagePath+'rt-small.png" id="rt-arrow'+randID+'">');

			if(o.showFullLinks)
			{	
				$(obj).after('<div class="balinks" id="links'+randID+'" style="position:relative"><span class="balinks"><a id="showleft'+randID+'" href="javascript:void(0)">'+o.beforeLinkText+'</a></span><span class="balinks"><a id="showright'+randID+'" href="javascript:void(0)">'+o.afterLinkText+'</a></span></div>');
				$('#links'+randID).width(mapWidth);
				$('#showleft'+randID).css({'position':'absolute','left':'0px'}).click(function(){
					$('div:eq(2)', obj).animate({width:mapWidth},o.linkDisplaySpeed);
					$('#dragwrapper'+randID).animate({left:mapWidth-$('#dragwrapper'+randID).width()+'px'},o.linkDisplaySpeed);
				});
				$('#showright'+randID).css({'position':'absolute','right':'0px'}).click(function(){
					$('div:eq(2)', obj).animate({width:0},o.linkDisplaySpeed);
					$('#dragwrapper'+randID).animate({left:'0px'},o.linkDisplaySpeed);
				});
			}
			
			// Custom for Our Changing Cities
			if (o.changeOnResize){
				 var cInt;
				$(window).on('orientationchange pageshow resize', function () {
					var id = o.thisID;
					var center = [_after_.getCenter().lat, _after_.getCenter().lng], zoom = _after_.getZoom(),
					w = $(obj).width();
					$(_before_._container).width(w);
					$(_after_._container).width(w);
					_before_.invalidateSize();
					_after_.invalidateSize();
					clearInterval(cInt);
					cInt = setInterval(function(){
						$(_before_._container).width(parseInt( $('#dragwrapper'+randID).css('left') ) + 4 );
						if ($(_before_._container).width() != w){ clearInterval(cInt); }
					}, 100);
				});
			}
			
			if(o.enableKeyboard)
			{
				$(document).keydown(function(event){
					if(event.keyCode == 39)
					{
						if( (parseInt($('#dragwrapper'+randID).css('left'))+parseInt($('#dragwrapper'+randID).width()) + o.keypressAmount) <= mapWidth )
						{
							$('#dragwrapper'+randID).css('left', parseInt( $('#dragwrapper'+randID).css('left') ) + o.keypressAmount + 'px');
							$('div:eq(2)', obj).width( parseInt( $('div:eq(2)', obj).width() ) + o.keypressAmount + 'px' );
						}
						else
						{
							$('#dragwrapper'+randID).css('left', mapWidth - parseInt( $('#dragwrapper'+randID).width() ) + 'px');
							$('div:eq(2)', obj).width( mapWidth - parseInt( $('#dragwrapper'+randID).width() )/2 + 'px' );
						}
					}
					if(event.keyCode == 37)
					{
						if( (parseInt($('#dragwrapper'+randID).css('left')) - o.keypressAmount) >= 0 )
						{
							$('#dragwrapper'+randID).css('left', parseInt( $('#dragwrapper'+randID).css('left') ) - o.keypressAmount + 'px');
							$('div:eq(2)', obj).width( parseInt( $('div:eq(2)', obj).width() ) - o.keypressAmount + 'px' );
						}
						else
						{
							$('#dragwrapper'+randID).css('left', '0px');
							$('div:eq(2)', obj).width($('#dragwrapper'+randID).width()/2);
						}
					}
				});
			}

			$('#dragwrapper'+randID).draggable( { containment:obj,drag:drag,stop:drag }).css('-ms-touch-action', 'none');

			function drag()
			{
				if (!o.permArrows){
					$('#lt-arrow'+randID+', #rt-arrow'+randID).stop().css('opacity',0);
				}
				$('div:eq(2)', obj).width( parseInt( $(this).css('left') ) + 4 );
				if (o.permArrows){
					$('#lt-arrow'+randID).css({'z-index':'20','position':'absolute','top':mapHeight*o.arrowTop-$('#lt-arrow'+randID).height()/2+'px','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+'px'});
					$('#rt-arrow'+randID).css({'z-index':'20','position':'absolute','top':mapHeight*o.arrowTop-$('#lt-arrow'+randID).height()/2+'px','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic+'px'});
				}
			}

			if(o.animateIntro)
			{
				$('div:eq(2)', obj).width(mapWidth);
				$('#dragwrapper'+randID).css('left',mapWidth-($('#dragwrapper'+randID).width()/2)+'px');
				setTimeout(function(){
					$('#dragwrapper'+randID).css({'opacity':1}).animate({'left':(mapWidth*o.introPosition)-($('#dragwrapper'+randID).width()/2)+'px'},o.introDuration,function(){$('#dragwrapper'+randID).animate({'opacity':.25},1000)});
					$('div:eq(2)', obj).width(mapWidth).animate({'width':mapWidth*o.introPosition+'px'},o.introDuration,function(){clickit();o.onReady.call(this);});
				},o.introDelay);
			}
			else
			{
				clickit();
				o.onReady.call(this);
			}

			function clickit()
			{
				if (o.permArrows){
					$('#lt-arrow'+randID).css({'z-index':'20','position':'absolute','top':mapHeight*o.arrowTop-$('#lt-arrow'+randID).height()/2+'px','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+'px'});
					$('#rt-arrow'+randID).css({'z-index':'20','position':'absolute','top':mapHeight*o.arrowTop-$('#rt-arrow'+randID).height()/2+'px','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic+'px'});
				}
				$(obj).hover(function(){
						if (!o.permArrows){
							$('#lt-arrow'+randID).stop().css({'z-index':'20','position':'absolute','top':mapHeight*o.arrowTop-$('#lt-arrow'+randID).height()/2+'px','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+6+'px'}).animate({opacity:1,left:parseInt($('#lt-arrow'+randID).css('left'))-6+'px'},200);
							$('#rt-arrow'+randID).stop().css({'position':'absolute','top':mapHeight*o.arrowTop-$('#lt-arrow'+randID).height()/2+'px','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic-6+'px'}).animate({opacity:1,left:parseInt($('#rt-arrow'+randID).css('left'))+6+'px'},200);
						}
						$('#dragwrapper'+randID).animate({'opacity':1},200);
					},function(){
						if (!o.permArrows){
							$('#lt-arrow'+randID).animate({opacity:0,left:parseInt($('#lt-arrow'+randID).css('left'))+o.arrowLeftOffset-6+'px'},350);
							$('#rt-arrow'+randID).animate({opacity:0,left:parseInt($('#rt-arrow'+randID).css('left'))+o.arrowRightOffset+6+'px'},350);
						}
						$('#dragwrapper'+randID).animate({'opacity':.25},350);
					}
				);

				$(obj).one('mousemove', function(){$('#dragwrapper'+randID).stop().animate({'opacity':1},500);}); // If the mouse is over the container and we animate the intro, we run this to change the opacity when the mouse moves since the hover event doesnt get triggered yet
			}
			
			// Pan and zoom other map when one map pans/zooms
			//_before_.on('dragend', _mapMove_).on('zoomend', _mapMove_);
			//_after_.on('dragend', _mapMove_).on('zoomend', _mapMove_);

			_before_.on('drag', _mapMove_).on('zoomend', _mapMove_);
			_after_.on('drag', _mapMove_).on('zoomend', _mapMove_);
			
			function _mapMove_(e)
			{
				console.log('moving...');
				console.log(o.on_event)
				var zoom = this.getZoom(),
				latlng = this.getCenter();
				latlng = [latlng.lat,latlng.lng];
				var thisID = $(this._container).attr('id');
				if (thisID == _bID_){ _after_.setView(latlng,zoom); }
				else if (thisID == _aID_){ _before_.setView(latlng,zoom,{animate:false}); }
				else { console.log('Error: Please report this as a bug'); }
			}
  		});
    	}
	});
})(jQuery);