<div>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor Modal-titleBasemap"><%- _t('components.modals.add-basemap.mapbox.insert') %></h3>
  <div class="CDB-Text u-flex u-alignCenter ">
    <label class="Metadata-label CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.mapbox.enter') %></label>
    <div class="Form-rowData--longer">
      <input type="text" class="CDB-InputText CDB-Text js-url" value="<%- url %>" placeholder="<%- _t('components.modals.add-basemap.mapbox.username') %>">
    </div>
  </div>
  <div class="u-tSpace-xl CDB-Text u-flex u-alignCenter">
    <label class="Metadata-label CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.mapbox.enter-token') %></label>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-InputText CDB-Text js-access-token" value="<%- accessToken %>" placeholder="<%- _t('components.modals.add-basemap.mapbox.access-token') %>">
      <div class="XYZPanel-error CDB-InfoTooltip CDB-InfoTooltip--left is-error CDB-Text CDB-Size-medium CDB-InfoTooltip-text js-error <%- lastErrorMsg ? 'is-visible' : '' %>"><%- lastErrorMsg %></div>
    </div>
  </div>
</div>

<div class="Modal-footer">
  <div class="Modal-footerContainer u-flex u-justifyEnd">
    <%/* ok class == let parent dialog view handle the click event */%>
    <button class="CDB-Button CDB-Button--primary is-disabled js-ok ok">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-basemap.add-btn') %></span>
    </button>
  </div>
</div>
<!--
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
</div>-->

