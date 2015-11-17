<div class="Widget-contentFlex">
  <button class="js-searchToggle">close search</button> -
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmall--upper">
    <%- categoriesCount %> categor<%- categoriesCount !== 1 ? "ies" : "y" %> found
  </p>
</div>
<div class="Widget-navDots js-dots">
  <% for (var i = 0, l = pages; i < l; i++) { %><button class="Widget-dot Widget-dot--navigation js-page <% if (currentPage === i) { %>is-selected<% } %>" data-page="<%- i %>"></button><% } %>
</div>
