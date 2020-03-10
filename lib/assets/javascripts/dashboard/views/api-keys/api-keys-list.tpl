<section>
  <header class="ApiKeys-header <%- disabled ? 'is-disabled' : '' %>">
    <h3 class="ApiKeys-title CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= title %></h3>
    <% if (showNewApiKeyButton && !disabled) { %>
      <button type="submit" class="CDB-Button CDB-Button--primary js-add">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">New API key</span>
      </button>
    <% } else if (disabled) {%>
      <div class="ApiKeys-info">Not included in your current plan.&nbsp;
        <a class="is-bold" href="<%- upgradeUrl %>">Upgrade now</a></div>
    <% } %>
  </header>
  <% if (!disabled) { %>
  <ul class="ApiKeys-list js-api-keys-list"></ul>
  <% } %>
</section>
