<% if (isSearchEnabled) { %>
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper"></p>
  <div class="Widget-filterButtons">
    <% if (isSearchApplied) { %>
      <button class="Widget-link js-apply">apply</button>
    <% } %>
  </div>
<% } else { %>
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper">
    <% if (isLocked) { %>
      <%- totalLocked %> locked
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
