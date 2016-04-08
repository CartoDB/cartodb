<div class="ImportPanel-header">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    Twitter trends
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">Enter up to four search terms using the Category fields.</p>
</div>
<div class="ImportPanel-body">
  <form class="Form">
    <div class="ImportTwitterPanel-cagetories"></div>
    <div class="ImportTwitterPanel-datePicker">
      <div class="Form-row">
        <div class="Form-rowLabel">
          <label class="CDB-Text CDB-Size-medium js-category">From / to</label>
        </div>
        <div class="Form-rowData Form-rowData--longer js-picker CDB-Text CDB-Size-medium"></div>
        <div class="Form-rowInfo DatePicker-info">
          <p class="CDB-Text CDB-Size-small u-altTextColor">Time is in GMT+0 <br/>(you are in GMT<%- currentGMT %>)</p>
        </div>
      </div>
    </div>
    <div class="ImportTwitterPanel-creditsUsage">
      <div class="Form-row">
        <div class="Form-rowLabel">
          <label class="CDB-Text CDB-Size-medium js-category">Use</label>
        </div>
        <div class="Form-rowData Form-rowData--longer CreditsUsage">
          <div class="UISlider CreditsUsage-slider js-slider"></div>
          <div class="CreditsUsage-info CDB-Text CDB-Size-medium js-info"></div>
        </div>
      </div>
    </div>
  </form>
</div>
