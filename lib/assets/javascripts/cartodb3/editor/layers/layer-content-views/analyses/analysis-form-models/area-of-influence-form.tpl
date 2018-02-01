<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
    <div class="Editor-HeaderInfo-inner CDB-Text">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('analyses.area-of-influence.title') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <%= linkContent %><p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.reference-layer-pluralize', { smart_count: 1 }) %></p>
      </div>
      <div class="u-tSpace-xl CDB-Text CDB-Fieldset">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.input') %></p>
        <div class="Editor-formInput u-ellipsis" data-editors="source"></div>
      </div>
      <div data-fields="<%- parametersDataFields %>"></div>
    </div>
  </div>
</form>
