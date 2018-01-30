<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="source,area">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.data-observatory.header.title') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.data-observatory.header.description') %></p>
      </div>
    </div>
  </div>

  <div class="Editor-HeaderInfo <%- hasArea ? '' : 'is-disabled' %>">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
        <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="<%- fields %>">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.data-observatory.parameters.title') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.analysis-form.data-observatory.parameters.description') %></p>
    </div>
  </div>
</form>
