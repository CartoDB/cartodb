<div class="Infobox <%- type %>">
  <h2 class="Infobox-title u-bSpace--m u-upperCase"><%- title %></h2>
  <div class="Infobox-body u-bSpace--m"><%- body %></div>
  <% if (hasButtons) { %>
  <ul class="Infobox-buttons">
    <li class="Infobox-button js-primary"></li>
    <li class="Infobox-button Infobox-button--right js-secondary"></li>
  </ul>
  <% } %>
</div>