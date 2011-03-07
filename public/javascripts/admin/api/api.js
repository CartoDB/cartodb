
  head(function(){
    $('div.error_content').delay(4000).fadeOut();

    $('.end_key a.submit').click(function(e){
      var csrf_token = $('meta[name=csrf-token]').attr('content'),
          csrf_param = $('meta[name=csrf-param]').attr('content');
      e.preventDefault();
      var form = $('<form method="post" action="'+$(this).attr('href')+'"></form>');
      var metadata_input = '<input name="_method" value="delete" type="hidden" />';
      if (csrf_param != null && csrf_token != null) {
        metadata_input += '<input name="'+csrf_param+'" value="'+csrf_token+'" type="hidden" />';
      }
      form.hide().append(metadata_input).appendTo('body');
      form.submit();
    });
    
    $('a.remove_key').click(function(ev){
      stopPropagation(ev);
      $('div.mamufas a.confirm_delete').attr('key',$(this).attr('key'));
      var names = $(this).attr('domain').split('.');
      var name = names[names.length-2] + '.' + names[names.length-1];
      $('div.mamufas div.delete_window h3').text('You are about to remove '+ name);
      $('div.mamufas').fadeIn();
      bindESC();
    });
    $('a.confirm_delete').click(function(ev){
      stopPropagation(ev);
      $('#remove_api_key_'+$(this).attr('key')).submit();
    });
    $('a.close_delete,a.cancel').click(function(ev){
      stopPropagation(ev);
      unbindESC();
      $('div.mamufas').fadeOut();
    });
  });



  function bindESC() {
    $(document).keydown(function(event){
      if (event.which == '27') {
        $('div.mamufas').fadeOut();
        unbindESC();
      }
    });
  }
  function unbindESC() {
    $(document).unbind('keydown');
    $('body').unbind('click');
  }