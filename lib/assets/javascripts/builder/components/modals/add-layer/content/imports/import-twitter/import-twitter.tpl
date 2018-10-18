<div class="ImportPanel-header">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <%- _t('components.modals.add-layer.imports.twitter.title') %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('components.modals.add-layer.imports.twitter.terms-desc') %>
  </p>
</div>
<div class="ImportPanel-body">
  <form class="Form">
    <div class="ImportTwitterPanel-categories"></div>
    <div class="ImportTwitterPanel-datePicker">
      <div class="Form-row">
        <div class="Form-rowLabel">
          <label class="CDB-Text CDB-Size-medium js-category"><%- _t('components.modals.add-layer.imports.twitter.from-to') %></label>
        </div>
        <div class="Form-rowData Form-rowData--longer js-picker CDB-Text CDB-Size-medium"></div>
        <div class="Form-rowInfo DatePicker-info">
          <p class="CDB-Text CDB-Size-small u-altTextColor"><%- _t('components.modals.add-layer.imports.twitter.twitter-gmt') %> <br/>(<%- _t('components.modals.add-layer.imports.twitter.your-gmt') %><%- currentGMT %>)</p>
        </div>
      </div>
    </div>
    <div class="ImportTwitterPanel-creditsUsage">
      <div class="Form-row">
        <div class="Form-rowLabel">
          <label class="CDB-Text CDB-Size-medium js-category"><%- _t('components.modals.add-layer.imports.twitter.use') %></label>
        </div>
        <div class="Form-rowData Form-rowData--longer CreditsUsage">
          <div class="UISlider CreditsUsage-slider js-slider"></div>
          <div class="CreditsUsage-info CDB-Text CDB-Size-medium js-info"></div>
        </div>
      </div>
    </div>
  </form>
</div>
