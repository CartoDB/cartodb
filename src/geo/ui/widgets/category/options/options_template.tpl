<% if (isSearchEnabled) { %>
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper"><%- totalLocked %> selected</p>
<% } else { %>
  <p class="Widget-textSmaller Widget-textSmaller--bold Widget-textSmaller--dark Widget-textSmaller--upper">
    <% if (isLocked) { %>
      <%- totalCats %> blocked <button class="Widget-link u-lSpace js-unlock">unlock</button>
    <% } else { %>
      <%- rejectedCats === 0 && acceptedCats === 0 || acceptedCats >= totalCats ? "All selected" : acceptedCats + " selected" %>
      <% if (canBeLocked) { %>
        <button class="Widget-link u-lSpace js-lock">lock</button>
      <% }%>
    <% }%>
  </p>
  <% if (!isLocked) { %>
    <div class="Widget-filterButtons">
      <% if (rejectedCats > 0 || acceptedCats > 0 || isAllRejected) { %>
        <button class="Widget-link Widget-filterButton js-all">all</button>
      <% } %>
      <% if (totalCats > rejectedCats && !isAllRejected) { %>
        <button class="Widget-link Widget-filterButton js-none">none</button>
      <% } %>
    </div>
  <% } %>
<% } %>
