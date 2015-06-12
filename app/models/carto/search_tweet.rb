# encoding: UTF-8

require 'active_record'

module Carto
  class SearchTweet < ActiveRecord::Base

    belongs_to :user, inverse_of: :users
    belongs_to :user_table, class_name: 'Carto::UserTable'

    def self.twitter_imports_count(query, date_from, date_to)
      query
          .where('search_tweets.state' => ::SearchTweet::STATE_COMPLETE)
          .where('search_tweets.created_at >= ? AND search_tweets.created_at <= ?', date_from, date_to + 1.days)
          .sum("search_tweets.retrieved_items".lit).to_i
    end

  end
end
