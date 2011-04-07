
  $(document).ready(function(){
    var href = window.location.pathname;
    $('ul#api_sidebar a[href!=""]').each(function(i,element){
      if ($(this).attr('href')==href) {
        $(this).closest('li').addClass('selected');
        closeDesactivateUl();
        return false;
      }
    });
    
    $('ul#api_sidebar a').click(function(ev){
      closeDesactivateUl();
      var attr = $(this).attr('href');
      if (attr == undefined || attr == false) {
        ev.stopPropagation();
        ev.preventDefault();
      }
      $(this).parent().children('ul').show();
      $(this).parent().closest('ul').show();
      $(this).parent().parent().closest('ul').show();
    });
  });
  
  
  function closeDesactivateUl() {
    $('ul#api_sidebar ul').each(function(i,element){
      if ($(element).find('li').hasClass('selected')) {
        $(element).show();
      } else {
        $(element).hide();
      }
    });
  }