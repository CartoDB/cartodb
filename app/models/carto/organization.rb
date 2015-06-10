require 'active_record'

module Carto
  class Organization < ActiveRecord::Base

    has_many :users, inverse_of: :organization
    belongs_to :owner, class_name: Carto::User

    def get_geocoding_calls(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)

      users.joins(:geocodings).where('geocodings.kind' => 'high-resolution').where('geocodings.created_at >= ? and geocodings.created_at <= ?', date_from, date_to + 1.days)
      .sum("processed_rows + cache_hits".lit).to_i
    end

    def twitter_imports_count(options = {})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : owner.last_billing_cycle)
      Carto::SearchTweet.twitter_imports_count(users.joins(:search_tweets), date_from, date_to)
    end

  end

end
