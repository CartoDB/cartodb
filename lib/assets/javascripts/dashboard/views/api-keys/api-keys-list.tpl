<section>
  <header class="ApiKeys-title">
    <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">Your API keys</h3>
    <button type="submit" class="CDB-Button CDB-Button--primary js-add">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">New API key</span>
    </button>
  </header>

  <ul class="ApiKeys-list js-api-keys-list"></ul>
</section>

<% if (showGoogleApiKeys) { %>
<section>
  <div class="FormAccount-title">
    <p class="FormAccount-titleText">Configure API keys from external providers</p>
  </div>

  <span class="FormAccount-separator"></span>

  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor FormAccount-label">Google Maps</label>
    </div>
    <div class="FormAccount-rowData">
      <input type="text" value="<%- googleApiKey %>" class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--long is-disabled" readonly />
    </div>
    <div class="FormAccount-rowInfo">
      <% if (!isInsideOrg) { %>
        <p class="CDB-Text CDB-Size-small u-altTextColor">
          This is your Google Maps query string, contact with <a href="mailto:support@carto.com">support@carto.com</a> to change it.
        </p>
      <% } else if (isOrgOwner) { %>
        <p class="CDB-Text CDB-Size-small u-altTextColor">
          This is the <%= organizationName %> Google Maps query string, contact with <a href="mailto:support@carto.com">support@carto.com</a> to change it.
        </p>
      <% } else { %>
        <p class="CDB-Text CDB-Size-small u-altTextColor">This is the organization Google Maps API key</p>
      <% } %>
    </div>
  </div>
</section>
<% } %>

<footer class="ApiKeys-footer">
  <p class="ApiKeys-footer-text">
    <i class="CDB-IconFont CDB-IconFont-info ApiKeys-footer-icon"></i>
    <span>Learn more about location app authorization and API key management <a href="https://carto.com/developers/fundamentals/authorization/" target="_blank">here</a></span>
  </p>
</footer>
