$.fn.draggableOverlay = function(opt) {

  var self      = this;
  var $rule     = null;
  var $ruleH    = null;
  var $elements = this;

  if (opt === "disable" || opt.container == undefined) {

    this.addClass("disabled");
    this.css('cursor', '')

    return;

  }

  opt = $.extend({ horizontal_guides: [], vertical_guides: [], padding: 0, stickiness: 7, cursor: "move" }, opt);

  var $container = opt.container;

  // Guide offsets
  var horizontal_guides = opt.horizontal_guides;
  var vertical_guides   = opt.vertical_guides;

  var vertical_limits, horizontal_limits, verticals, horizontals = []; 

  $(".rule").remove();

  $rule = $("<div class='rule' />");
  $container.append($rule)
  $rule.offset({ top: 0 }).css( { left: 0 });

  $ruleH = $("<div class='rule horizontal' />");
  $container.append($ruleH);
  $ruleH.offset({ top: 0 }).css( { left: 0 });

  for (var i = 0; i < horizontal_guides.length; i++) {

    var position = horizontal_guides[i];

    var $el = $("<div class='guide horizontal' />");

    $container.append($el)

    $el.offset( { top: position }).css( { left: 0 });

  }

  for (var i = 0; i < vertical_guides.length; i++) {

    var position = vertical_guides[i];

    var $el = $("<div class='guide vertical' />");
    $container.append($el)
    $el.offset( { left: position }).css( { top: 0 });
  }

  var onMouseDown = function(e) {

    if (self.hasClass("disabled")) {

      e.stopPropagation();

      return;
    }

    e.stopPropagation();

    var $drag = $(this).addClass('draggable');

    $(this).css({ bottom: "auto", right: "auto", left: $(this).position().left, top: $(this).position().top })

    var
    //z_idx    = $drag.css('z-index'),
    drg_h    = $drag.outerHeight(),
    drg_w    = $drag.outerWidth(),
    pos_y    = $drag.offset().top  + drg_h - e.pageY,
    pos_x    = $drag.offset().left + drg_w - e.pageX,
    container_x = $container.offset().left,
    container_y = $container.offset().top,
    container_w = $container.width(),
    container_h = $container.height();

    verticals = [];
    horizontals = [];
    vertical_limits   = [];
    horizontal_limits = [];

    var device = $(this).hasClass("desktop") ? "desktop" : "mobile";

    if ($(this).hasClass("snap")) {
      $elements.each(function(i, e) {
        if (!$(e).hasClass("draggable") && $(e).hasClass(device) && !$(e).hasClass("disabled") && $(e).hasClass("snap")) {

          var t = $(e).offset().top;
          horizontal_limits.push(t);
          horizontal_limits.push(t + $(e).height());

          var l = $(e).offset().left;
          vertical_limits.push(l);
          vertical_limits.push(l + $(e).width());
        }
      });

      verticals   = verticals.concat(vertical_limits, vertical_guides);
      horizontals = horizontals.concat(horizontal_limits, horizontal_guides);
    }

    var onMouseMove = function(e) {

      var top  = e.pageY + pos_y - drg_h;
      var left = e.pageX + pos_x - drg_w;

      var otop  = top; 
      var oleft = left;

      var container_right  = container_x + container_w;
      var container_bottom = container_y + container_h;

      // CHECK GUIDES
      for (var i = 0; i < horizontals.length; i++) {

        var target_l = horizontals[i];

        if ( ( top >= target_l - opt.stickiness - opt.padding ) && ( top <= target_l + opt.stickiness + opt.padding) ) {
          top = target_l;
          $ruleH.offset( { top: top }).css({ left: 0, opacity: 1 })
          break;
        } else if ( ( top + drg_h <= target_l + opt.stickiness + opt.padding ) && ( top + drg_h >= target_l - opt.stickiness - opt.padding ) ) {
          top = target_l - drg_h ;
          $ruleH.offset( { top: top + drg_h }).css({ left: 0, opacity: 1 })
          break;
        }

      }

      for (var i = 0; i < verticals.length; i++) {

        var target_l = verticals[i];

        if ( ( left >= target_l - opt.stickiness - opt.padding) && ( left <= target_l + opt.stickiness + opt.padding ) ) {
          left = target_l;
          $rule.offset( { left: left }).css({ top: 0, opacity: 1 })
          break;
        } else if ( ( left + drg_w <= target_l + opt.stickiness + opt.padding ) && ( left + drg_w >= target_l - opt.stickiness - opt.padding) ) {
          left = target_l - drg_w ;
          $rule.offset( { left: left + drg_w }).css({ top: 0, opacity: 1 })
          break;
        } 

      }

      // LEFT
      if (left - opt.stickiness < container_x) {
        left = container_x;
      } else if (left + drg_w + opt.stickiness >  container_right ) {
        left = container_right - drg_w;
      }

      // TOP
      if (top - opt.stickiness < container_y) {
        top = container_y;
      } else if (top + drg_h + opt.stickiness >  container_bottom ) {
        top = container_bottom - drg_h;
      } 


      if (top == otop && left == oleft) {
        $(this).find(".draggable").removeClass("sticky");
        $(".rule").css({ opacity: 0 });
      } else {
        $(this).find(".draggable").addClass("sticky");
      }

      var offset = { top: top, left: left };

      $('.draggable').offset(offset);

      var updateLayout = _.throttle(function(e) {
        opt.drag && opt.drag();
      }, 100); 
      updateLayout();

    }

    $drag.parents().on("mousemove", onMouseMove);

  };

  var onExit = function() {

    $(".draggable").parents().off("mousemove");
    $(".rule").css({ opacity: 0 });

    $(".draggable").removeClass('sticky');
    $(".draggable").removeClass('draggable');

  };

  $("body").on("mouseup", onExit);

  return this.on("mousedown", onMouseDown).on("mouseup", onExit);

}
