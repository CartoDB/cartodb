<h3 class="ImportPanel-headerTitle">
  <% if (state === 'selected') { %>
    SalesForce selected
  <% } else { %>
    SalesForce import
  <% } %>
</h3>
<p class="ImportPanel-headerDescription">
  <% if (state !== "selected") { %>
    Import your data from a Salesforce URL
  <% } else { %>
    <% if (acceptSync) { %>
      Keep it synchronized with the source
    <% } else { %>
      Sync options are not available
    <% } %>
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
  </button>
<% } %>
