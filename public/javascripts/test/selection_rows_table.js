
///////////////////////////////////////
//  Editing selected rows            //
///////////////////////////////////////
// $(document).mousedown(function(event){
//   if (enabled) {
//     var target = event.target || event.srcElement;
//     var targetElement = target.nodeName.toLowerCase();
// 
//     if (targetElement == "div" && $(target).parent().is('td') && !event.ctrlKey && !event.metaKey) {
//       $('table tbody tr td.first div span').hide();
//       $('table tbody tr td.first div a.options').removeClass('selected');
//       $('tbody tr').removeClass('editing');
//       $('tbody tr').removeClass('selecting_first').removeClass('border');
//       $('tbody tr').removeClass('selecting');
//       $('tbody tr').removeClass('selecting_last');
//       $('tbody tr').removeClass('selected');
//       var first_row = $(target).parent().parent();
//       first_row.addClass('selecting_first');
//       var initial_x = first_row.position().top;
// 
//       if (event.preventDefault) {
//         event.preventDefault();
//         event.stopPropagation();
//       } else {
//         event.stopPropagation();
//         event.returnValue = false;
//       }
//     }
// 
//     $(document).mousemove(function(event){
//       var target = event.target || event.srcElement;
//       var targetElement = target.nodeName.toLowerCase();
// 
//       if (targetElement == "div" && $(target).parent().is('td')) {
//         var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
//         var current_row = $(target).parent().parent();
//         var current_x = current_row.position().top;
//         $(table).children('tbody').children('tr').removeClass('selecting');
//         current_row.addClass('selecting');
//         var find = false;
//         var cursor = first_row;
// 
//         while (!find) {
//           if (initial_x<current_x) {
//             first_row.removeClass('selecting_last').addClass('selecting_first');
//             if (cursor.attr('r')==current_row.attr('r')) {
//               cursor.addClass('selecting');
//               cursor.next().removeClass('selecting');
//               find=true;
//             } else {
//               cursor.next().removeClass('selecting');
//               cursor.addClass('selecting');
//               cursor = cursor.next();
//             }
//           } else if (initial_x>current_x) {
//             first_row.removeClass('selecting_first').addClass('selecting_last');
//             if (cursor.attr('r')==current_row.attr('r')) {
//               cursor.addClass('selecting');
//               cursor.prev().removeClass('selecting');
//               find=true;
//             } else {
//               cursor.prev().removeClass('selecting');
//               cursor.addClass('selecting');
//               cursor = cursor.prev();
//             }
//           } else {
//             find=true;
//             return false;
//           }
//         }
// 
//       } else {
//       }
//       if (event.preventDefault) {
//         event.preventDefault();
//         event.stopPropagation();
//       } else {
//         event.stopPropagation();
//         event.returnValue = false;
//       }
//     });
//   }
// });
// $(document).mouseup(function(event){
//   if (enabled) {
//     var target = event.target || event.srcElement;
//     var targetElement = target.nodeName.toLowerCase();
// 
//     if (targetElement == "div" && $(target).parent().is('td')) {
//       var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
//       if ($('tbody tr').hasClass('selecting_last')) {
//         $('tbody tr[r="'+data.row+'"]').addClass('selecting_first');
//         $('tbody tr[r="'+data.row+'"]').addClass('border');
//         $('tbody tr.selecting_last').addClass('border');
//       } else {
//         $('tbody tr[r="'+data.row+'"]').addClass('selecting_last').addClass('border');
//         $('tbody tr.selecting_first').addClass('border');
//       }
// 
//       if ($('tbody tr[r="'+data.row+'"]').hasClass('selecting_last') && $('tbody tr[r="'+data.row+'"]').hasClass('selecting_first')) {
//         $('tbody tr[r="'+data.row+'"]').removeClass('selecting_first');
//         $('tbody tr[r="'+data.row+'"]').removeClass('selecting_last');
//         $('tbody tr[r="'+data.row+'"]').removeClass('border');
//         $('tbody tr[r="'+data.row+'"]').removeClass('selecting');
//         $('tbody tr[r="'+data.row+'"]').removeClass('editing');
//         $('tbody tr[r="'+data.row+'"]').removeClass('selected');
//       }
//       if (event.preventDefault) {
//         event.preventDefault();
//         event.stopPropagation();
//       } else {
//         event.stopPropagation();
//         event.returnValue = false;
//       }
//     }
//     $(document).unbind('mousemove');
//   }
// });