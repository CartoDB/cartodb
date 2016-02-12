<% if (isSearchEnabled) { %>
  <p class="CDB-Text is-semibold CDB-Size-small is-upper js-lockCategories"><%- totalLocked %> selected</p>
<% } else { %>
  <p class="CDB-Text is-semibold CDB-Size-small is-upper js-textInfo">
    <% if (isLocked) { %>
      <%- totalCats %> blocked <button class="CDB-Text CDB-Size-small is-upper u-actionTextColor CDB-Widget-link u-lSpace js-unlock">unlock</button>
    <% } else if (areAllRejected || rejectedCats === totalCats) { %>
      None selected
    <% } else { %>
      <%- rejectedCats === 0 && acceptedCats === 0 || acceptedCats >= totalCats ? "All selected" : acceptedCats + " selected" %>
      <% if (canBeLocked) { %>
        <button class="CDB-Text CDB-Size-small is-upper u-actionTextColor CDB-Widget-link u-lSpace js-lock">lock</button>
      <% }%>
    <% }%>
  </p>
  <% if (!isLocked && totalCats > 2) { %>
    <div class="CDB-Widget-filterButtons">
      <% if (rejectedCats > 0 || acceptedCats > 0 || areAllRejected) { %>
        <button class="CDB-Text CDB-Size-small is-upper u-actionTextColor CDB-Widget-link CDB-Widget-filterButton js-all">all</button>
      <% } %>
    </div>
  <% } %>
<% } %>
