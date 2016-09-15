<div class="ImportPanel">
  <div class="ImportPanel-header">
    <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m"><%- _t('components.modals.add-basemap.tilejson.insert') %></h3>
  </div>
  <div class="Form-row CDB-Text CDB-Size-medium">
    <div class="Form-rowLabel">
      <label class="Form-label"><%- _t('components.modals.add-basemap.xyz.enter') %></label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="Form-input Form-input--longer has-icon js-url" value="" placeholder="<%- _t('components.modals.add-basemap.xyz.eg') %> http://domain.com/tiles.json?foo=bar">
      <i class="CDB-IconFont CDB-IconFont-dribbble Form-inputIcon js-idle"></i>
      <i class="Spinner Spinner--formIcon Form-inputIcon js-validating" style="display: none;"></i>
      <div class="Form-inputError CDB-FontSize-medium js-error"></div>
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
