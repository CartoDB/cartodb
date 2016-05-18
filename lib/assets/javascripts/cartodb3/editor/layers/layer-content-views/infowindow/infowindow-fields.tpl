<div class="CDB-Widget-filter CDB-Widget-contentSpaced CDB-Widget-contentSpaced--sideMargins">
  <p class="CDB-Text is-semibold CDB-Size-small u-upperCase js-textInfo">
    <% if (noneSelected) { %>
      None selected
    <% } else { %>
      <%- allSelected ? "All selected" : selectedFields + " selected" %>
    <% }%>
  </p>
 
  <div class="CDB-Widget-filterButtons">
    <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-link CDB-Widget-filterButton js-toggle"><% if (allSelected) { %>none<% } else { %>all<% } %></button>
  </div>
</div>

<ul class="js-fields"></ul>
