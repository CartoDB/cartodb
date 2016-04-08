<div class="ImportPanel-header">
  <h3 class="ImportPanel-headerTitle">Twitter trends</h3>
  <p class="ImportPanel-headerDescription">Enter up to four search terms using the Category fields.</p>
</div>
<div class="ImportPanel-body">
  <form class="Form">
    <div class="ImportTwitterPanel-cagetories"></div>
    <div class="ImportTwitterPanel-datePicker">
      <div class="Form-row">
        <div class="Form-rowLabel">
          <label class="Form-label">From / to</label>
        </div>
        <div class="Form-rowData Form-rowData--longer js-picker"></div>
        <div class="Form-rowInfo DatePicker-info">
          <p class="Form-rowInfoText DatePicker-infoText">Time is in GMT+0 <br/>(you are in GMT<%- currentGMT %>)</p>
        </div>
      </div>
    </div>
    <div class="ImportTwitterPanel-creditsUsage">
      <div class="Form-row">
        <div class="Form-rowLabel">
          <label class="Form-label">Use</label>
        </div>
        <div class="Form-rowData Form-rowData--longer CreditsUsage">
          <div class="UISlider CreditsUsage-slider js-slider"></div>
          <div class="CreditsUsage-info js-info"></div>
        </div>
      </div>
    </div>
  </form>
</div>
