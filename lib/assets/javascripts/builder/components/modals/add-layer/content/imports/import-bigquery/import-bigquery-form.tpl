<form class="Form js-form">
  <div class="Form-row u-alignCenter">
    <div class="Form-rowLabel ImportOptions__label">
      <label class="Form-label CDB-Text CDB-Size-medium u-mainTextColor">Billing Project ID</label>
    </div>
    <div class="">
      <input type="text" class="ImportOptions__input--long Form-input CDB-Text CDB-Size-medium js-textInput">
    </div>
  </div>
  <div class="Form-row u-flex__align--start">
    <div class="Form-rowLabel ImportOptions__label ImportOptions__label--textarea">
      <label class="Form-label CDB-Text CDB-Size-medium u-mainTextColor">SQL query</label>
    </div>
    <div>
      <div class="ImportOptions__CodeMirror">
        <textarea rows="4" cols="50" class="ImportOptions__input--long Form-input Form-textarea CDB-Text CDB-Size-medium js-textarea"></textarea>
      </div>
      <div class="ImportOptions__hint CDB-Text CDB-Size-medium u-secondaryTextColor">If your query contains geographic data in EPSG:4326 format, name that column “the_geom” so that it’s imported correctly.</div>
    </div>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel ImportOptions__label ImportOptions__label--textarea"></div>
    <div class="Form-row ImportOptions__input--long u-flex__justify--end">
      <button type="submit" class="CDB-Button CDB-Button--primary is-disabled js-submit">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Run SQL query</span>
      </button>
    </div>
  </div>
</form>
