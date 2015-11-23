<div class="Widget-contentFlex">
  <button class="u-rSpace--m Widget-buttonIcon Widget-textSmaller Widget-textSmaller--upper js-searchToggle">
    <i class="CDBIcon CDBIcon-Lens"></i>
    search
  </button>
</div>
<% if (showPaginator) { %>
  <div class="Widget-navDots js-dots">
    <% for (var i = 0, l = pages; i < l; i++) { %><button class="Widget-dot Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button><% } %>
  </div>
<% } %>
