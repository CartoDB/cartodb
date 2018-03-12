# encoding: utf-8

module Carto
  class AccountType < ActiveRecord::Base

    FREE = 'FREE'.freeze
    BASIC = 'BASIC'.freeze
    PRO = 'PRO'.freeze

    # Old plans
    MAGELLAN = 'MAGELLAN'.freeze

    NO_SOFT_GEOCODING_PLANS = 'ACADEMIC|ACADEMY|STUDENT|INTERNAL|FREE|AMBASSADOR|PARTNER|MAGELLAN|ENTERPRISE|ORGANIZATION|PERSONAL30|Academy-350|COMMUNITY|CLASSROOM|Trial Account|ire|Site License|Basemap'.freeze

    NO_SOFT_GEOCODING_PLANS_REGEXP = /(#{NO_SOFT_GEOCODING_PLANS})/i

    belongs_to :rate_limit, dependent: :destroy

    after_save { update_to_redis if rate_limit_id_changed? }

    after_destroy :delete_from_redis

    def pay_users
      ::User.where("upper(account_type) != '#{FREE}'").count
    end

    def soft_geocoding_limit?(user)
      if user[:soft_geocoding_limit].nil?
        !(user.account_type.nil? || user.account_type =~ NO_SOFT_GEOCODING_PLANS_REGEXP)
      else
        user[:soft_geocoding_limit]
      end
    end

    def soft_here_isolines_limit?(user)
      !!user[:soft_here_isolines_limit]
    end

    def soft_obs_snapshot_limit?(user)
      !!user[:soft_obs_snapshot_limit]
    end

    def soft_obs_general_limit?(user)
      !!user[:soft_obs_general_limit]
    end

    def soft_mapzen_routing_limit?(user)
      !!user[:soft_mapzen_routing_limit]
    end

    def mailchimp?(_user)
      # Mailchimp is currently not supported
      false
    end

    def update_to_redis
      User.where(account_type: account_type).where(rate_limit_id: nil).each do |user|
        rate_limit.save_to_redis(user)
      end
    end

    def delete_from_redis
      User.where(account_type: account_type).where(rate_limit_id: nil).each do |user|
        rate_limit.delete_from_redis(user)
      end
    end
  end
end
