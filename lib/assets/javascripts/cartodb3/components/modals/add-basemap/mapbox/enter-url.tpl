<div class="ImportPanel">
  <div class="ImportPanel-header">
    <h3 class="ImportPanel-headerTitle">Insert your Mapbox URL</h3>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="Form-label">Enter your map ID/URL</label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="Form-input Form-input--longer js-url" value="<%- url %>" placeholder="E.g. username.ab12cd3">
    </div>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="Form-label">Enter your access token</label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="Form-input Form-input--longer js-access-token" value="<%- accessToken %>" placeholder="E.g. pk.bfg32ewdsadeyJ1Ijoi…">
      <div class="Form-inputError js-error <%- lastErrorMsg ? 'is-visible' : '' %>"><%- lastErrorMsg %></div>
    </div>
  </div>
</div>
<div class="Dialog-footer Dialog-footer--expanded CreateDialog-footer">
  <div>
    <div class="CreateDialog-footerShadow"></div>
    <div class="CreateDialog-footerLine"></div>
    <div class="CreateDialog-footerInner ">
      <div class="CreateDialog-footerInfo"></div>
      <div class="CreateDialog-footerActions">
        <%/* ok class == let parent dialog view handle the click event */%>
        <button class="CDB-Button CDB-Button--primary is-disabled js-ok ok">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-basemap.add-btn') %></span>
        </button>
      </div>
    </div>
  </div>
</div>
