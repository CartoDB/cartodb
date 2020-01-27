<div class="js-api-keys-page"></div>

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
  <p class="ApiKeys-warning-text">
    <i class="CDB-IconFont CDB-IconFont-info ApiKeys-info-icon"></i>
    <span class="u-altTextColor">Learn more about location app authorization and API key management <a href="https://carto.com/developers/fundamentals/authorization/" target="_blank" rel="noopener noreferrer">here</a></span>
  </p>
</footer>
