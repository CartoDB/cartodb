<div class="CDB-Widget-contentFlex">
  <button class="u-rSpace--m CDB-Widget-link js-searchToggle">cancel</button>
</div>
<% if (showPaginator) { %>
  <div class="CDB-Widget-navDots js-dots">
    <% for (var i = 0, l = pages; i < l; i++) { %><button class="CDB-Shape-dot CDB-Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button><% } %>
  </div>
<% } %>
