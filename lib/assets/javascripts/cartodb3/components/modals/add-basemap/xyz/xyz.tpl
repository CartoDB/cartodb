<div class="ImportPanel">
  <div class="ImportPanel-header">
    <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m"><%- _t('components.modals.add-basemap.xyz.insert') %></h3>
  </div>
  <div class="Form-row CDB-Text CDB-Size-medium">
    <div class="Form-rowLabel">
      <label class="Form-label"><%- _t('components.modals.add-basemap.xyz.enter') %></label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="Form-input Form-input--longerMorePadding has-icon XYZPanel-input js-url" value="" placeholder="E.g. https://{s}.carto.com/foobar/{z}/{x}/{y}.png">
      <i class="Spinner XYZPanel-inputIcon XYZPanel-inputIcon--loader Spinner--formIcon Form-inputIcon js-validating" style="display: none;"></i>
      <div class="Checkbox XYZPanel-inputCheckbox js-tms" data-title="Inverts Y axis numbering for tiles">
        <button class="Checkbox-input"></button>
        <label class="Checkbox-label">TMS</label>
      </div>
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
