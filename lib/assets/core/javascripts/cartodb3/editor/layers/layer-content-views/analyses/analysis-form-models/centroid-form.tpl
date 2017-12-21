<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="<%= parametersDataFields %>">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('analyses.centroid.title') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <%= linkContent %><p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.input-layer') %></p>
      </div>
    </div>
  </div>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="aggregate">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.value-aggregation') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.value-aggregation-centroids') %></p>
    </div>
  </div>
</form>
