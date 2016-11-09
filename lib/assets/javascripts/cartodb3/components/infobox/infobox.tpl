<div class="Infobox <%- type %>">
  <h2 class="CDB-Text is-semibold CDB-Size-small u-bSpace--m u-upperCase"><%- title %></h2>
  <div class="CDB-Text CDB-Size-medium u-bSpace--m u-flex">
    <% if (isLoading) { %>
      <div class="CDB-LoaderIcon is-dark u-rSpace--m">
        <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
          <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
        </svg>
      </div>
    <% } %>
    <div>
      <%= body %>
    </div>
  </div>

  <div class="u-flex u-justifySpace u-alignCenter">
    <% if (hasQuota) { %>
      <div class="Infobox-quota js-quota"></div>
    <% } %>
    <% if (hasButtons) { %>
      <ul class="Infobox-buttons">
        <li class="Infobox-button js-leftPosition"></li>
        <li class="Infobox-button Infobox-button--right js-rightPosition"></li>
      </ul>
    <% } %>
  </div>
</div>
