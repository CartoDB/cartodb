module Carto
  class RequestToken < OauthToken

    # Compatibility with ActiveRecord inheritance. When migrating to ActiveRecord,
    # the class name changed from ::RequestToken to ::Carto::RequestToken
    # Source: https://yiming.dev/blog/2017/12/07/add-sti-to-a-legacy-activerecord-model/
    self.store_full_sti_class = false

    attr_accessor :provided_oauth_verifier

    def authorize!(user)
      return false if authorized?

      new_attributes = { user: user, authorized_at: Time.now }
      new_attributes[:verifier] = OAuth::Helper.generate_key(20)[0,20] unless oauth10?

      update!(new_attributes)
    end

    def exchange!
      return false unless authorized?
      return false unless oauth10? || verifier == provided_oauth_verifier

      ActiveRecord::Base.transaction do
        access_token = Carto::AccessToken.create!(user: user, client_application: client_application)
        invalidate!
        access_token
      end
    end

    def to_query
      oauth10? ? super : "#{super}&oauth_callback_confirmed=true"
    end

    def oob?
      callback_url == 'oob'
    end

    def oauth10?
      (defined? OAUTH_10_SUPPORT) && OAUTH_10_SUPPORT && callback_url.blank?
    end

  end
end
