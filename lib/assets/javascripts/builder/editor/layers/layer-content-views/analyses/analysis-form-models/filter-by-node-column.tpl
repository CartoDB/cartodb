<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="source,filter_source">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.select-layer') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.link-layer-desc') %></p>
      </div>
    </div>
  </div>
  <div class="Editor-HeaderInfo <%- hasFilterSource ? '' : 'is-disabled' %>">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
        <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="column,filter_column">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.key-columns') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.key-columns-desc') %></p>
    </div>
  </div>
</form>
