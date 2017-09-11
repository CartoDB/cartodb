/* global $, Clipboard */

$(document).ready(function () {
  var clipboard = new Clipboard('.copy-box', {
    target: function (trigger) {
      return $(trigger).find('code')[0];
    }
  });

  clipboard.on('success', function (e) {
    console.info('Action:', e.action);
    console.info('Text:', e.text);
    console.info('Trigger:', e.trigger);
    e.clearSelection();
  });

  clipboard.on('error', function (e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
  });

  $('.js-navigation a').click(function (e) {
    e.preventDefault();
    $('.js-navigation a').toggleClass('is-selected');
  });

  $('.js-dropdown').click(function (e) {
    e.preventDefault();
    $('.Dropdown').toggleClass('is-active');

    $('.Dropdown').css('left', (e.pageX) - 130);
    $('.Dropdown').css('top', (e.pageY) + 20);
  });

  $('select').each(function () {
    var $this = $(this);
    var numberOfOptions = $(this).children('option').length;

    $this.addClass('select-hidden');
    $this.wrap('<div class="select"></div>');
    $this.after('<div class="select-styled"></div>');

    var $styledSelect = $this.next('div.select-styled');
    $styledSelect.text($this.children('option').eq(0).text());

    var $list = $('<ul />', {
      'class': 'select-options'
    }).insertAfter($styledSelect);

    for (var i = 0; i < numberOfOptions; i++) {
      $('<li />', {
        text: $this.children('option').eq(i).text(),
        rel: $this.children('option').eq(i).val()
      }).appendTo($list);
    }

    var $listItems = $list.children('li');

    $styledSelect.click(function (e) {
      e.stopPropagation();
      $('div.select-styled.active').each(function () {
        $(this).removeClass('active').next('ul.select-options').hide();
      });
      $(this).toggleClass('active').next('ul.select-options').toggle();
    });

    $listItems.click(function (e) {
      e.stopPropagation();
      $styledSelect.text($(this).text()).removeClass('active');
      $this.val($(this).attr('rel'));
      $list.hide();
      // console.log($this.val());
    });

    $(document).click(function () {
      $styledSelect.removeClass('active');
      $list.hide();
    });
  });
});
