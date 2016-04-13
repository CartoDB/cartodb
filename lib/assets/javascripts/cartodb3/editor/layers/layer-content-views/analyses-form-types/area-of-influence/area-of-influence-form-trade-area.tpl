<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
    <div class="Editor-HeaderInfo-Inner CDB-Text">
      <div class="Editor-HeaderInfo-Title u-bSpace--s">
        <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('analyses.area-of-influence') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.analysis-form.reference-layer-pluralize', { smart_count: 1 }) %></p>
      <div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.input') %></p>
        <div class="CDB-Text CDB-Size-medium u-iBlock" data-editors="source"></div>
      </div>
    </div>
  </div>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
    <div class="Editor-HeaderInfo-Inner CDB-Text" data-fields="type,kind,time">
      <div class="Editor-HeaderInfo-Title u-bSpace--s">
        <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('editor.layers.analysis-form.parameters') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.analysis-form.parameters-description') %></p>
    </div>
  </div>
</form>
