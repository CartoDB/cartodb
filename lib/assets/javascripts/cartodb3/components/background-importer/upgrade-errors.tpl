<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative u-flex u-alignCenter u-justifyCenter">
    <i class="CDB-IconFont CDB-IconFont-barometer"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace u-errorTextColor">
    <%- _t('components.background-importer.upgrade-errors.' + errorCode + '.title') %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-secondaryTextColor">
    <%- _t('components.background-importer.upgrade-errors.' + errorCode + '.description') %>
  </h3>
</div>

<div class="Dialog-body ErrorDetails-body">
  <ul class="Modal-containerList">
    <li class="ErrorDetails-item">
      <div class="ErrorDetails-itemIcon ErrorDetails-itemIcon--success CDB-Size-big u-flex u-alignCenter u-justifyCenter u-rSpace--xl">
        <i class="CDB-IconFont CDB-IconFont-rocket"></i>
      </div>
      <div class="ErrorDetails-itemText">
        <p class="CDB-Text CDB-Size-medium">
          <%- _t('components.background-importer.upgrade-errors.' + errorCode + '.info') %>
          <% if (showTrial) { %>
            <br/>
            <a href="<%= upgradeUrl %>"><%- _t('components.background-importer.free-trial', { days: 14 }) %></a>
          <% } %>
        </p>
      </div>
    </li>
  </ul>
</div>

<div class="Dialog-footer--simple u-inner">
  <a href="<%- upgradeUrl %>" class="CDB-Button CDB-Button--primary u-tSpace--m">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('components.background-importer.upgrade-errors.upgrade') %>
    </span>
  </a>
</div>
