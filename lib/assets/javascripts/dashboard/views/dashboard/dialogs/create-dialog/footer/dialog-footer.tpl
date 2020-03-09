<% if (option !== "loading") { %>
  <div class="CreateDialog-footerShadow"></div>
  <div class="CreateDialog-footerLine"></div>

  <div class="CreateDialog-footerInner u-flex u-alignCenter u-justifySpace">
    <% if (option === 'listing') { %>

      <% if (listingState === "datasets") { %>
        <% if (isLibrary && !isMapType) { %>
          <div class="CDB-Text CDB-Size-medium u-altTextColor u-flex u-alignCenter">
            <i class="CDB-IconFont CDB-IconFont-info CreateDialog-footerInfoIcon HighlightIcon HighlightIcon--warning"></i> Once you click over one of these items it will be imported to your account.
          </div>
        <% } else { %>
          <div class="CDB-Text CDB-Size-medium u-altTextColor u-flex u-alignCenter">
            <% if (selectedDatasetsCount < maxSelectedDatasets) { %>
              <%- selectedDatasetsCount %> dataset<%- selectedDatasetsCount !== 1 ? 's' : '' %> selected
            <% } else { %>
              You have reached the max layers for a new map (<%- maxSelectedDatasets %> max)
            <% } %>
          </div>
          <div class="CreateDialog-footerActions">
            <% if (selectedDatasetsCount === maxSelectedDatasets && userCanUpgrade) { %>
              <a class="Button Button--main CreateDialog-footerActionsButton is-separated js-upgrade" href="<%- upgradeUrl %>"><span>upgrade</span></a>
            <% } %>
            <button class="CDB-Button CDB-Button--primary CreateDialog-footerActionsButton js-create_map track-onboarding--createMap <%- selectedDatasetsCount === 0 ? 'is-disabled' : '' %>">
              <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">create map</span>
            </button>
          </div>
        <% } %>
      <% } %>

      <% if (listingState === "import" || listingState === "upload") { %>
        <% if (importState === 'scratch') { %>
          <% if (isMapType) { %>
            <div class="CreateDialog-footerInfo">
              <i class="CDB-IconFont CDB-IconFont-info CreateDialog-footerInfoIcon HighlightIcon HighlightIcon--warning"></i>New on CARTO? Start with one of <a href="#/templates" class="js-templates">our templates</a>.
            </div>
          <% } %>
        <% } else { %>
          <div class="js-footer-info CreateDialog-footerInfo"></div>
          <div class="CreateDialog-footerActions js-footerActions">
            <button class="CDB-Button CDB-Button--primary CDB-Button--big CreateDialog-footerActionsButton <% if (!isUploadValid) { %>is-disabled<% } %> js-connect">
              <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
                <%- listingState === "upload" ? _t('components.modals.create-dialog.upload') : _t('components.modals.create-dialog.connect') %> dataset
              </span>
            </button>
          </div>
        <% } %>
      <% } %>
    <% } %>
  </div>
<% } %>
