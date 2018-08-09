module Carto
  module OauthProvider
    module Scopes
      SCOPE_OFFLINE = 'offline'.freeze

      SUPPORTED_SCOPES = [SCOPE_OFFLINE].freeze

      def self.invalid_scopes(scopes)
        scopes - SUPPORTED_SCOPES
      end

      class ScopesValidator < ActiveModel::EachValidator
        def validate_each(record, attribute, value)
          return record.errors[attribute] = ['has to be an array'] unless value && value.is_a?(Array)

          invalid_scopes = Scopes.invalid_scopes(value)
          record.errors[attribute] << "contains unsuported scopes: #{invalid_scopes.join(', ')}" if invalid_scopes.any?
        end
      end
    end
  end
end
