require 'active_record'

module Carto
  class Organization < ActiveRecord::Base

    has_many :users, inverse_of: :organization, order: :username
    belongs_to :owner, class_name: Carto::User
    has_many :groups, inverse_of: :organization, order: :display_name

    def self.find_by_database_name(database_name)
      Carto::Organization
          .joins('INNER JOIN users ON organizations.owner_id = users.id')
          .where('users.database_name = ?', database_name).first
    end

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

    def is_owner_user?(user)
      self.owner_id == user.id
    end

    def signup_page_enabled
      !whitelisted_email_domains.nil? && !whitelisted_email_domains.empty?
    end

    def database_name
      owner ? owner.database_name : nil
    end

    def create_group(display_name)
      Carto::Group.create_group(self, display_name)
    end

    private

  end

end
