<ul>
  <li class="ImportOther__step1 js-step js-step1 js-request is-active">
    <i class='icon'></i>
    <span><%- _t('components.modals.add-layer.imports.request.other') %></span>
  </li>
  <li class="ImportOther__step2 js-step js-step2">
    <span><%- _t('components.modals.add-layer.imports.request.type') %></span>
    <input type="text" class="ImportOther__input js-input" required value=""/>
    <button
      type="submit"
      disabled
      class="ImportOther__inputSubmit js-submit is-disabled CDB-Text CDB-Size-small u-actionTextColor u-upperCase">
      <span><%- _t('components.modals.add-layer.imports.request.submit') %></span>
    </button>
    <div class="ImportOther__inputError"></div>
  </li>
  <li class="ImportOther__step3 js-step js-step3">
      <span><%- _t('components.modals.add-layer.imports.request.sending') %></span>
      <div class="ImportOther__spinner Spinner"></div>
    </div>
  <li class="ImportOther__step4 js-step js-step4 <%- hasError ? 'hasError' : '' %>">
    <span class="ImportOther_requestText">
      <% if (hasError) { %>
        <%- _t('components.modals.add-layer.imports.request.error.title') %>
      <% } else { %>
        <%- _t('components.modals.add-layer.imports.request.success.title') %>
      <% } %>
    </span>
    <button class="CDB-Button CDB-Button--primary ImportOther__requestButton js-ok">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase ImportOther__requestButtonText">
        <%- _t('components.modals.add-layer.imports.request.ok') %>
      </span>
    </button>
  </li>
</ul>
