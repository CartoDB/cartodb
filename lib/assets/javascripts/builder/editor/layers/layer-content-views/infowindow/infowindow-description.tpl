<div class="u-flex u-justifySpace u-alignCenter">
  <p class="CDB-Text is-semibold CDB-Size-small u-upperCase js-textInfo">
    <% if (noneSelected) { %>
      None selected
    <% } else { %>
      <%- allSelected ? "All selected" : selectedFields + " selected" %>
    <% }%>
  </p>
 
  <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor js-toggle"><% if (allSelected) { %>none<% } else { %>all<% } %></button>
</div>