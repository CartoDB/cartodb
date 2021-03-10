module Carto
  class AuthCode < ActiveRecord::Base

    belongs_to :user

    attr_accessible :user_id, :code

    validates :user, presence: true

    before_save :generate_auth_code_if_nil
    after_create :add_auth_code_to_redis
    after_destroy :remove_auth_code_from_redis

    private

    def generate_auth_code_if_nil
      self.code = Carto::Common::EncryptionService.make_token if self.code.nil?
    end

    def add_auth_code_to_redis
      $users_metadata.set(redis_key, self.code)
    end

    def remove_auth_code_from_redis
      $users_metadata.del(redis_key)
    end

    def redis_key
      "auth_codes:#{user.username}"
    end

  end
end
