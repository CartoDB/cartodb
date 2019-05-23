<div class="CDB-Text FlashMessage FlashMessage--main">
  <div class="u-inner">
      <div class="FlashMessage FlashMessage-info FlashMessage--main u-flex u-justifyCenter u-alignCenter">
          <p class="u-rspace--20"><%= _t('common.trial_notification.views.trial_notification.message', { trial_days: trialDays }) %></p>
          <p class="u-flex">
            <a href="<%= accountUpdateUrl %>" class="CDB-Button CDB-Button--secondary CDB-Button--secondary--background CDB-Button--big">
              <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%= _t('common.trial_notification.views.trial_notification.add_payment') %></span>
            </a>
          </p>
      </div>
  </div>
</div>
