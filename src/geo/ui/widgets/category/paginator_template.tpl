<div class="Widget-contentFlex">
  <button class="js-searchToggle">search</button> - 
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmall--upper">
    <%- categoriesCount > 12 ? (categoriesCount - 11) : categoriesCount  %> categor<%- categoriesCount !== 1 ? "ies" : "y" %> <%- categoriesCount > 12 ? "more" : "" %>
  </p>
</div>
<div class="Widget-navDots js-dots">
  <% for (var i = 0, l = pages; i < l; i++) { %><button class="Widget-dot Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button><% } %>
</div>
