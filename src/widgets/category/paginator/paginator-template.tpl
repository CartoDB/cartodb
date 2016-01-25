<div class="CDB-Widget-contentFlex">
  <button class="u-rSpace--m CDB-Widget-buttonIcon CDB-Widget-textSmaller CDB-Widget-textSmaller--upper js-searchToggle">
    <i class="CDB-IconFont CDB-IconFont--center CDB-IconFont-lens u-rSpace"></i>
    <span class="u-iBlock">
      search in <%- categoriesCount %> categor<%- categoriesCount === 1 ? 'y' : 'ies' %>
    </span>
  </button>
</div>
<% if (showPaginator) { %>
  <div class="CDB-Widget-navDots js-dots">
    <% for (var i = 0, l = pages; i < l; i++) { %><button class="CDB-Shape-dot CDB-Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button><% } %>
  </div>
<% } %>
