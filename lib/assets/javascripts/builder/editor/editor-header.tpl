<div class="Editor-HeaderInfoEditor">
  <div class="Editor-HeaderInfo-inner Editor-HeaderInfo-inner--wide">
    <div class="Editor-HeaderInfo-title u-bSpace--m js-context-menu">
      <div class="Editor-HeaderInfo-titleText u-bSpace js-header">
      </div>
    </div>
    <div class="u-bSpace--xl u-flex u-alignCenter">
      <div class="js-dropdown u-rSpace--m"></div>
      <% if (isInsideOrg) { %>
        <div class="js-share-users"></div>
      <% } %>
      <p class="Editor-HeaderInfo-publishDate u-ellipsis CDB-Text CDB-Size-medium u-altTextColor"><%- published %></p>
    </div>
  </div>
</div>
