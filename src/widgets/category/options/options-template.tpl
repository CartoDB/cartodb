<% if (isSearchEnabled) { %>
  <p class="CDB-Widget-textSmaller CDB-Widget-textSmaller--bold CDB-Widget-textSmaller--dark CDB-Widget-textSmaller--upper"><%- totalLocked %> selected</p>
<% } else { %>
  <p class="CDB-Widget-textSmaller CDB-Widget-textSmaller--bold CDB-Widget-textSmaller--dark CDB-Widget-textSmaller--upper">
    <% if (isLocked) { %>
      <%- totalCats %> blocked <button class="CDB-Widget-link u-lSpace js-unlock">unlock</button>
    <% } else if (areAllRejected || rejectedCats === totalCats) { %>
      None selected
    <% } else { %>
      <%- rejectedCats === 0 && acceptedCats === 0 || acceptedCats >= totalCats ? "All selected" : acceptedCats + " selected" %>
      <% if (canBeLocked) { %>
        <button class="CDB-Widget-link u-lSpace js-lock">lock</button>
      <% }%>
    <% }%>
  </p>
  <% if (!isLocked && totalCats > 2) { %>
    <div class="CDB-Widget-filterButtons">
      <% if (rejectedCats > 0 || acceptedCats > 0 || areAllRejected) { %>
        <button class="CDB-Widget-link CDB-Widget-filterButton js-all">all</button>
      <% } %>
    </div>
  <% } %>
<% } %>
