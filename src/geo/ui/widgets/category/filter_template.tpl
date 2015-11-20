<% if (isSearchEnabled) { %>
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper"><%- totalLocked %> selected</p>
<% } else { %>
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper">
    <% if (isLocked) { %>
      <%- totalCats %> selected
    <% } else { %>
      <%- rejectedCats === 0 && acceptedCats === 0 || acceptedCats >= totalCats ? "All selected" : acceptedCats + " selected" %>
    <% }%>
  </p>
  <% if (!isLocked) { %>
    <div class="Widget-filterButtons">
      <% if (rejectedCats !== 0 && totalCats > 0 || acceptedCats > 0) { %>
        <button class="Widget-link Widget-filterButton js-all">all</button>
      <% } %>
      <% if (totalCats > rejectedCats) { %>
        <button class="Widget-link Widget-filterButton js-none">none</button>
      <% } %>
    </div>
  <% } %>
<% } %>
