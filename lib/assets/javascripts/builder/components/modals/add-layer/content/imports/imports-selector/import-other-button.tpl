<ul>
  <li class="ImportOther__step1 js-step js-step1 js-request is-active">
    <i class='icon'></i>
    <span><%- _t('components.modals.add-layer.imports.other.request') %></span>
  </li>
  <li class="ImportOther__step2 js-step js-step2">
    <span><%- _t('components.modals.add-layer.imports.other.type') %></span>
    <input type="text" class="ImportOther__input js-input" required value=""/>
    <button
      type="submit"
      disabled
      class="ImportOther__inputSubmit js-submit is-disabled CDB-Text CDB-Size-small u-actionTextColor u-upperCase">
      <span><%- _t('components.modals.add-layer.imports.other.submit') %></span>
    </button>
    <div class="ImportOther__inputError"></div>
  </li>
  <li class="ImportOther__step3 js-step js-step3">
      <span><%- _t('components.modals.add-layer.imports.other.sending') %></span>
      <div class="ImportOther__spinner Spinner"></div>
    </div>
  <li class="ImportOther__step4 js-step js-step4 <%- hasError ? 'hasError' : '' %>">
    <span class="ImportOther_requestText">
      <% if (hasError) { %>
        <%- _t('components.modals.add-layer.imports.other.error') %>
      <% } else { %>
        <%- _t('components.modals.add-layer.imports.other.success') %>
      <% } %>
    </span>
    <button class="CDB-Button CDB-Button--primary ImportOther__requestButton js-ok">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase ImportOther__requestButtonText">
        <% if (hasError) { %>
          <%- _t('components.modals.add-layer.imports.other.try-again') %>
        <% } else { %>
          <%- _t('components.modals.add-layer.imports.other.ok') %>
        <% } %>
      </span>
    </button>
  </li>
</ul>
