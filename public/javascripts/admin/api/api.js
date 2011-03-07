
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
  });

