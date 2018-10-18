<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--twitter u-flex u-alignCenter u-justifyCenter">
    <i class="CDB-IconFont CDB-IconFont-twitter"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace Dialog-headerIcon--twitter">
    <%- _t('components.background-importer.twitter-import-details.twitter-import-title') %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-altTextColor">
    <% if (datasetTotalRows === 0) { %>
      <%- _t('components.background-importer.twitter-import-details.errors.no-results') %>
    <% } else { %>
      <%= _t('components.background-importer.twitter-import-details.new-type-created', { datasetTotalRowsFormatted: datasetTotalRowsFormatted, tweetPlural: datasetTotalRows != 1 ? 's' : '' }) %>
    <% } %>
  </h3>
</div>

<div class="Dialog-body ErrorDetails-body">
  <ul class="Modal-containerList">
    <li class="ErrorDetails-item">
      <div class="ErrorDetails-itemIcon ErrorDetails-itemIcon--success CDB-Size-big u-flex u-alignCenter u-justifyCenter u-rSpace--xl">
        <i class="CDB-IconFont CDB-IconFont-dollar"></i>
      </div>
      <div class="ErrorDetails-itemText">
        <p class="CDB-Text CDB-Size-large u-secondaryTextColor">
          <% if (tweetsCost > 0) { %>
            <%- _t('components.background-importer.twitter-import-details.tweet-cost.paid', { tweetsCostFormatted: tweetsCostFormatted }) %>
          <% } else { %>
            <%- _t('components.background-importer.twitter-import-details.tweet-cost.free', { tweetsCostFormatted: tweetsCostFormatted }) %>
          <% } %>
        </p>
        <p class="CDB-Text CDB-Size-medium u-altTextColor">
          <% if (tweetsCost > 0 || availableTweets <= 0) { %>
            <%- _t('components.background-importer.twitter-import-details.no-more-credits', { blockPriceFormatted: blockPriceFormatted, blockSizeFormatted: blockSizeFormatted }) %>
          <% } else { %>
            <% if (availableTweets != 1) { %>
              <%- _t('components.background-importer.twitter-import-details.credits-left', { availableTweetsFormatted: availableTweetsFormatted }) %>
            <% } else { %>
              <%- _t('components.background-importer.twitter-import-details.credit-left', { availableTweetsFormatted: availableTweetsFormatted }) %>
            <% } %>
          <% } %>
        </p>
      </div>
    </li>
  </ul>
</div>

<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--primary u-tSpace--m">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase js-close">
      <%- _t('components.background-importer.error-details.close') %>
    </span>
  </button>
</div>
