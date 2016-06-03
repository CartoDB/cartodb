<div class="Infobox <%- type %>">
  <h2 class="CDB-Text is-semibold CDB-Size-small u-bSpace--m u-upperCase"><%- title %></h2>
  <div class="CDB-Text CDB-Size-medium u-bSpace--m"><%- body %></div>
  <% if (hasButtons) { %>
  <ul class="Infobox-buttons">
    <li class="Infobox-button js-primary"></li>
    <li class="Infobox-button Infobox-button--right js-secondary"></li>
  </ul>
  <% } %>
</div>