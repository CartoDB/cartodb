<section>
  <header class="ApiKeys-title">
    <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= title %></h3>
    <% if (showNewApiKeyButton) { %>
    <button type="submit" class="CDB-Button CDB-Button--primary js-add">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">New API key</span>
    </button>
    <% } %>
  </header>

  <ul class="ApiKeys-list js-api-keys-list"></ul>
</section>
