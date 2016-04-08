<h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
  <% if (state === 'selected') { %>
    ArcGIS<sup>&trade;</sup> selected
  <% } else { %>
    ArcGIS<sup>&trade;</sup> import
  <% } %>
</h3>
<p class="CDB-Text CDB-Size-medium u-altTextColor">
  <% if (state !== "selected") { %>
    Import your data from an ArcGIS Server<sup>&trade;</sup> instance
  <% } else { %>
    Sync options only available for a layer
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
  </button>
<% } %>
