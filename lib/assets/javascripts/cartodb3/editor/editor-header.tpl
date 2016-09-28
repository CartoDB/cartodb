<div class="Editor-HeaderInfoEditor">
  <div class="Editor-HeaderInfo-inner Editor-HeaderInfo-inner--wide">
    <div class="Editor-HeaderInfo-title u-bSpace--m js-context-menu">
      <div class="Editor-HeaderInfo-titleText u-bSpace js-header">
      </div>
    </div>
    <div class="u-bSpace--xl u-flex u-alignCenter">
      <button class="u-rSpace--m u-actionTextColor js-privacy">
        <i class="Tag Tag-fill Tag-fill--<%- cssClass %> CDB-Text CDB-Size-small u-upperCase"><%- privacy %></i>
      </button>
      <% if (!isSimple) { %>
      <div class="js-share-users"></div>
      <% } %>
      <div class="Editor-HeaderInfo-publishDate u-ellipsis CDB-Text CDB-Size-medium u-altTextColor"><%- published %></div>
    </div>
  </div>
</div>
