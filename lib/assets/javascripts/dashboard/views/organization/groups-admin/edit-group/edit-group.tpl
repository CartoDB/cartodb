<div class="FormAccount-separator"></div>

<div class="FormAccount-row">
  <div class="FormAccount-rowLabel">
    <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor" for="group-name"><%= _t('dashboard.views.organization.grp_name') %></label>
  </div>
  <div class="FormAccount-rowData">
    <input type="text" class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med js-name" id="group-name" size="30" maxlength="28" value="<%- displayName %>" placeholder="<%= _t('dashboard.views.organization.grp_placeholder') %>" />
    <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
    </div>
  </div>
</div>
<div class="FormAccount-footer">
  <button type="submit" class="CDB-Button CDB-Button--error js-delete">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.delete_grp') %></span>
  </button>

  <button type="submit" class="CDB-Button CDB-Button--primary js-save">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.save_grp') %></span>
  </button>
</div>
