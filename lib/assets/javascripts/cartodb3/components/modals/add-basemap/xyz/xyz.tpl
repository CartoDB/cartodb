<div class="ImportPanel">
  <div class="ImportPanel-header">
    <h3 class="ImportPanel-headerTitle">Insert your XYZ URL</h3>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="Form-label">Enter a URL</label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="Form-input Form-input--longerMorePadding has-icon XYZPanel-input js-url" value="" placeholder="E.g. http://{s}.cartodb.com/foobar/{z}/{x}/{y}.png">
      <i class="Spinner XYZPanel-inputIcon XYZPanel-inputIcon--loader Spinner--formIcon Form-inputIcon js-validating" style="display: none;"></i>
      <div class="Checkbox XYZPanel-inputCheckbox js-tms" data-title="Inverts Y axis numbering for tiles">
        <button class="Checkbox-input"></button>
        <label class="Checkbox-label">TMS</label>
      </div>
      <div class="Form-inputError js-error"></div>
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
        <div></div>
        <%/* ok class == let parent dialog view handle the click event */%>
        <button class="CDB-Button CDB-Button--primary is-disabled js-ok ok">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-basemap.add-btn') %></span>
        </button>
      </div>
    </div>
  </div>
</div>
