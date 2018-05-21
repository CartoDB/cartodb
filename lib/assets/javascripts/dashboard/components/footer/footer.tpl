<div class="u-inner Footer-inner">
  <ul class="Footer-list Footer-list--primary">
      <% if (!isHosted) { %>
        <li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="https://carto.com/learn/guides/">Guides</a></li>
        <li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="https://carto.com/developers">Developers</a></li>
      <% } %>
      <% if (onpremiseVersion && onpremiseVersion !== "") { %>
        <li class="Footer-listItem CDB-Text CDB-Size-medium">Version: <%= onpremiseVersion %></li>
      <% } %>
  </ul>

  <ul class="Footer-list Footer-list--secondary">
    <% if (onpremiseVersion && onpremiseVersion !== "") { %>
      <li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:onpremise-support@carto.com">Support</a></li>
    <% } else { %>
      <li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:support@carto.com">Support</a></li>
    <% } %>
    <li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:contact@carto.com">Contact</a></li>
  </ul>
</div>
