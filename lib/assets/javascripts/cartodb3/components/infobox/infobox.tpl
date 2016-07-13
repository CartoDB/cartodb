<div class="Infobox <%- type %>">
  <h2 class="CDB-Text is-semibold CDB-Size-small u-bSpace--m u-upperCase"><%- title %></h2>
  <div class="CDB-Text CDB-Size-medium u-bSpace--m"><%- body %></div>

  <% if (isLoading) { %>
    <div class="CDB-LoaderIcon is-dark">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
  <% } %>

  <div class="u-flex">
    <% if (quota) { %>
      <div class="Infobox-quota">
        <label></label>
        <%- quota.totalQuota %>
        <%- quota.usedQuota %>
        <%- quota.blockSize %>
        <%- quota.blockPrice %>
        <div class="Infobox-quotaBar">
          <div class="Infobox-quotaBarProgress"></div>
        </div>
      </div>
    <% } %>
    <% if (hasButtons) { %>
      <ul class="Infobox-buttons">
        <li class="Infobox-button js-primary"></li>
        <li class="Infobox-button Infobox-button--right js-secondary"></li>
      </ul>
    <% } %>
  </div>
</div>
