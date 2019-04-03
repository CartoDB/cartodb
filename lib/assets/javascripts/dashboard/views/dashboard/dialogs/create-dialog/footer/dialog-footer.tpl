<% if (option !== "loading") { %>
  <div class="CreateDialog-footerShadow"></div>
  <div class="CreateDialog-footerLine"></div>

  <div class="CreateDialog-footerInner u-flex u-alignCenter u-justifySpace">
    <% if (option === 'listing') { %>

      <% if (listingState === "datasets") { %>
        <% if (isLibrary && !isMapType) { %>
          <div class="CDB-Text CDB-Size-medium u-altTextColor u-flex u-alignCenter">
            <i class="CDB-IconFont CDB-IconFont-info CreateDialog-footerInfoIcon HighlightIcon HighlightIcon--warning"></i><%= _t('dashboard.views.dashboard.dialogs.create_dialog.click_import') %>
          </div>
        <% } else { %>
          <div class="CDB-Text CDB-Size-medium u-altTextColor u-flex u-alignCenter">
            <% if (selectedDatasetsCount < maxSelectedDatasets) { %>
              <%= _t('dashboard.views.dashboard.dialogs.create_dialog.data_selected', {smart_count: selectedDatasetsCount}) %>
            <% } else { %>
              <%= _t('dashboard.views.dashboard.dialogs.create_dialog.max_layers', {maxSelectedDatasets: maxSelectedDatasets}) %>
            <% } %>
          </div>
          <div class="CreateDialog-footerActions">
            <% if (selectedDatasetsCount === maxSelectedDatasets && userCanUpgrade) { %>
              <a class="Button Button--main CreateDialog-footerActionsButton is-separated js-upgrade" href="<%- upgradeUrl %>"><span><%= _t('dashboard.views.dashboard.dialogs.create_dialog.upgrade') %></span></a>
            <% } %>
            <button class="CDB-Button CDB-Button--primary CreateDialog-footerActionsButton js-create_map track-onboarding--createMap <%- selectedDatasetsCount === 0 ? 'is-disabled' : '' %>">
              <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.dialogs.create_dialog.create_map') %></span>
            </button>
          </div>
        <% } %>
      <% } %>

      <% if (listingState === "import") { %>
        <% if (importState === 'scratch') { %>
          <% if (isMapType) { %>
            <div class="CreateDialog-footerInfo">
              <i class="CDB-IconFont CDB-IconFont-info CreateDialog-footerInfoIcon HighlightIcon HighlightIcon--warning"></i><%= _t('dashboard.views.dashboard.dialogs.create_dialog.start_template') %>
            </div>
          <% } %>
        <% } else { %>
          <div class="js-footer-info CreateDialog-footerInfo"></div>
          <div class="CreateDialog-footerActions js-footerActions">
            <button class="CDB-Button CDB-Button--primary CreateDialog-footerActionsButton <% if (!isUploadValid) { %>is-disabled<% } %> js-connect">
              <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.dialogs.create_dialog.connect') %></span>
            </button>
          </div>
        <% } %>
      <% } %>
    <% } %>
  </div>
<% } %>
