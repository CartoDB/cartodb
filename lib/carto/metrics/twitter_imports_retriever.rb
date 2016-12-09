module Carto::Metrics
  class TwitterImportsRetriever
    def metrics
      [:retrieved_items]
    end

    def services
      [:twitter_imports]
    end

    def get_range(user, org, _service, _metric, date_from, date_to)
      tweets_query = if user
                       user.search_tweets
                     else
                       org.users.joins(:search_tweets).reorder(nil)
                     end
      result = Carto::SearchTweet.twitter_imports_count_by_date(tweets_query, date_from, date_to)
      date_from.upto(date_to) do |date|
        result[date] = 0 unless result[date]
      end
      result
    end
  end
end
