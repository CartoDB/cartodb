<div class="IntermediateInfo">
  <div class="LayoutIcon LayoutIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-info"></i>
  </div>
  <% if (msg) { %>
    <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl"><%= msg %></h4>
  <% } else { %>
    <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl"><%- _t('dashboard.views.data_library.content.error_templ') %></h4>
  <% } %>
  <p class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('dashboard.views.data_library.content.contact') %></p>
</div>
