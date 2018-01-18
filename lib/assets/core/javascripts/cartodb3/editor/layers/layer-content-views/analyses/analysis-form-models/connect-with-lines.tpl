<form>
  <div class="Editor-HeaderInfo Editor-HeaderInfo--noMargin">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="<%= parametersDataFields %>">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.parameters') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.define-how-connect-points') %></p>
      </div>
    </div>
  </div>

  <% if (type == 'line-sequential') { %>
    <div class="Editor-HeaderInfo">
      <div class="Editor-HeaderPad u-rSpace--m"></div>
        <div class="Editor-checker" data-fields="category_column"></div>
      </div>
    </div>
  <% } %>

  <% if (type == 'line-source-to-target') { %>
    <div class="Editor-HeaderInfo">
      <div class="Editor-HeaderPad u-rSpace--m"></div>
      <div class="Editor-HeaderInfo-inner CDB-Text">

        <div class="Editor-checker Editor-checker--slim u-flex u-alignCenter" data-fields="group"></div>

        <% if (group) { %>
          <div class="Editor-formInner--nested">
            <div class="CDB-Text Editor-formInner Editor-formInner--noMargin">
              <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.source-column') %></p>
              <div class="Editor-formInput" data-editors="source_column"></div>
            </div>

            <div class="CDB-Text Editor-formInner">
              <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.target-col') %></p>
              <div class="Editor-formInput" data-editors="target_source_column"></div>
            </div>
          </div>
        <% } %>
      </div>
    </div>
  <% } %>
</form>
