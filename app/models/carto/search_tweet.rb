require 'active_record'

module Carto
  class SearchTweet < ActiveRecord::Base

    STATE_IMPORTING = 'importing'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILED = 'failed'.freeze

    belongs_to :user, inverse_of: :search_tweets, class_name: 'Carto::User'
    belongs_to :user_table, class_name: 'Carto::UserTable'
    belongs_to :data_import, class_name: 'Carto::DataImport'

    def self.twitter_imports_count(query, date_from, date_to)
      query
        .where('search_tweets.state' => STATE_COMPLETE)
        .where('search_tweets.created_at >= ? AND search_tweets.created_at <= ?', date_from, date_to + 1.days)
        .sum("search_tweets.retrieved_items").to_i
    end

    def self.twitter_imports_count_by_date(query, date_from, date_to)
      query
        .where('search_tweets.state' => STATE_COMPLETE)
        .where('search_tweets.created_at >= ? AND search_tweets.created_at <= ?', date_from, date_to + 1.days)
        .group("date_trunc('day', search_tweets.created_at)")
        .select("date_trunc('day', search_tweets.created_at) as date, SUM(search_tweets.retrieved_items) as count")
        .all
        .map { |t| { t.date.to_date => t.count.to_i } }
        .reduce({}, &:merge)
    end

    def set_importing_state
      self.state = STATE_IMPORTING
    end

    def set_complete_state
      self.state = STATE_COMPLETE
    end

    def set_failed_state
      self.state = STATE_FAILED
    end

    def calculate_used_credits
      return 0 unless self.state == Carto::SearchTweet::STATE_COMPLETE

      total_rows = self.retrieved_items
      quota = user.effective_twitter_total_quota

      remaining_quota  = quota + total_rows - user.effective_get_twitter_imports_count
      remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
      used_credits     = total_rows - remaining_quota
      (used_credits > 0 ? used_credits : 0)
    end

    def price
      return 0 unless self.retrieved_items > 0

      if [user.effective_twitter_block_price, calculate_used_credits, user.effective_twitter_datasource_block_size].any?(&:nil?)
        log_error('Uncomplete twitter configuration', current_user: user)
        # As the import itself went well don't break execution, just return something
        0
      else
        (user.effective_twitter_block_price * calculate_used_credits) / user.effective_twitter_datasource_block_size.to_f
      end
    end
  end
end
