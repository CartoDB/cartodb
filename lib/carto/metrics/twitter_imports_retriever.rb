module Carto::Metrics
  class TwitterImportsRetriever
    def metrics
      [:retrieved_items]
    end

    def services
      [:twitter_imports]
    end

    def get_range(user, _org, _service, _metric, date_from, date_to)
      if user
        Carto::SearchTweet.twitter_imports_count_by_date(user.search_tweets, date_from, date_to)
      else
        {}
      end
    end
  end
end
