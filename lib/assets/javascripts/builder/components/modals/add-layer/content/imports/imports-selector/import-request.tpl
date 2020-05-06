<% if (isEnterprise) { %>
  <div class="ImportButton__step ImportButton__step--step1 js-step js-step1 is-active"></div>
  <div class="ImportButton__step ImportButton__step--step2 js-step js-step2">
    <p class="u-mt--4 u-mb--20 u-txt-center"><%- _t('components.modals.add-layer.imports.request.sending') %></p>
    <div class="ImportButton__spinner Spinner"></div>
  </div>
  <div class="ImportButton__step ImportButton__step--step3 js-step js-step3"></div>
  <div class="ImportButton__step ImportButton__step--step4 js-step js-step4"></div>
<% } else { %>
  <p class="CDB-Text CDB-Size-medium is-semibold u-mb--4"><%= cdb.core.sanitize.html(title || name) %></p>
  <p class="CDB-Text CDB-Size-medium u-mb--12"><%- _t('components.modals.add-layer.imports.request.upgrade.desc') %></p>
  <a class="ImportButton__link CDB-Button CDB-Button--primary CDB-Button--wide u-iblock" href="<%- upgradeUrl %>">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-layer.imports.request.upgrade.cta') %></span>
  </a>
<% } %>
