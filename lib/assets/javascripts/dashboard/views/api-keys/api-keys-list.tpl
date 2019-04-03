<section>
  <header class="ApiKeys-title">
    <h3 class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('dashboard.views.api_keys.api_key_list.your_api') %></h3>
    <button type="submit" class="CDB-Button CDB-Button--primary js-add">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.api_keys.api_key_list.new_api') %></span>
    </button>
  </header>

  <ul class="ApiKeys-list js-api-keys-list"></ul>
</section>

<% if (showGoogleApiKeys) { %>
<section>
  <div class="FormAccount-title">
    <p class="FormAccount-titleText"><%= _t('dashboard.views.api_keys.api_key_list.configure') %></p>
  </div>

  <span class="FormAccount-separator"></span>

  <div class="FormAccount-row">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor FormAccount-label"><%= _t('dashboard.views.api_keys.api_key_list.google') %></label>
    </div>
    <div class="FormAccount-rowData">
      <input type="text" value="<%- googleApiKey %>" class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--long is-disabled" readonly />
    </div>
    <div class="FormAccount-rowInfo">
      <% if (!isInsideOrg) { %>
        <p class="CDB-Text CDB-Size-small u-altTextColor">
          <%= _t('dashboard.views.api_keys.api_key_list.your_google') %>
        </p>
      <% } else if (isOrgOwner) { %>
        <p class="CDB-Text CDB-Size-small u-altTextColor">
          <%= _t('dashboard.views.api_keys.api_key_list.google_query', {organizationName: organizationName}) %>
        </p>
      <% } else { %>
        <p class="CDB-Text CDB-Size-small u-altTextColor"><%= _t('dashboard.views.api_keys.api_key_list.google_api') %></p>
      <% } %>
    </div>
  </div>
</section>
<% } %>

<footer class="ApiKeys-footer">
  <p class="ApiKeys-footer-text">
    <i class="CDB-IconFont CDB-IconFont-info ApiKeys-footer-icon"></i>
    <span><%= _t('dashboard.views.api_keys.api_key_list.learn_more') %></span>
  </p>
</footer>
