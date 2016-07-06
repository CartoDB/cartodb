<div class="ImportPanel">
  <div class="ImportPanel-header">
    <h3 class="ImportPanel-headerTitle">Basemaps provided by NASA Worldview</h3>
    <h3 class="ImportPanel-headerDescription">Select a date from which you want a global basemap.</h3>
  </div>
  <div class="Form-row Form-row--centered">
    <div class="Form-rowData Form-rowData--short Form-rowData--alignLeft">
      <div class="Form-rowData Form-rowData--full">
        <div class="RadioButton js-day">
          <button type="button" class="RadioButton-input <% if (layerType === 'day') { %>is-checked<% } %>"></button>
          <label class="RadioButton-label" for="nasa-type-day">Day</label>
        </div>
      </div>
      <div class="Form-rowData Form-rowData--full">
        <div class="RadioButton js-night">
          <button type="button" class="RadioButton-input <% if (layerType === 'night') { %>is-checked<% } %>"/></button>
          <label class="RadioButton-label" for="nasa-type-night">Night</label>
        </div>
      </div>
    </div>
    <div class="Form-rowData Form-rowData--short">
      <div class="js-datePicker" data-title="You can't select a date in night mode"></div>
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
        <button class="CDB-Button CDB-Button--primary js-ok ok">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-basemap.add-btn') %></span>
        </button>
      </div>
    </div>
  </div>
</div>
