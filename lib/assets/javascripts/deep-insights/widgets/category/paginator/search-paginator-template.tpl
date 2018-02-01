<div class="CDB-Widget-contentFlex">
  <button class="CDB-Text is-semibold u-upperCase CDB-Size-small u-rSpace--m js-searchToggle u-actionTextColor">cancel</button>
</div>
<% if (showPaginator) { %>
  <div class="CDB-Widget-navDots js-dots u-tSpace--m">
    <% for (var i = 0, l = pages; i < l; i++) { %><button class="CDB-Shape-dot CDB-Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button><% } %>
  </div>
<% } %>
