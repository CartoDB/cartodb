<div class="ImportPanel">
  <div class="ImportPanel-header">
    <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m"><%- _t('components.modals.add-basemap.wms.insert') %></h3>
    <p class="CDB-Text CDB-Size-medium u-altTextColor u-bSpace--xl ImportPanel-headerDescription"><%- _t('components.modals.add-basemap.wms.list') %></p>
  </div>
  <div class="Form-row CDB-Text CDB-Size-medium">
    <div class="Form-rowLabel">
      <label class="Form-label"><%- _t('components.modals.add-basemap.mapbox.enter') %></label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="Form-input Form-input--longerMorePadding has-icon js-url" value="" placeholder="<%- _t('components.modals.add-basemap.xyz.eg') %> http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml">
      <i class="CDB-IconFont CDB-IconFont-dribbble Form-inputIcon js-idle"></i>
      <div class="Form-inputError js-error <%- (layersFetched && layers.length === 0) ? 'is-visible' : '' %>">
        <% if (layersFetched && layers.length === 0) { %>
          <%- _t('components.modals.add-basemap.wms.invalid') %> <a target="_blank" href="https://carto.com/docs/carto-editor/maps/#including-an-external-basemap">(<%- _t('components.modals.add-basemap.wms.see-docs') %>)</a>
        <% } %>
      </div>
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
        <button class="CDB-Button CDB-Button--primary is-disabled js-fetch-layers js-ok ok">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-basemap.get-layers') %></span>
        </button>
      </div>
    </div>
  </div>
</div>
