module Carto
  module OauthProvider
    module Scopes
      SCOPE_OFFLINE = 'offline'.freeze

      SUPPORTED_SCOPES = [SCOPE_OFFLINE].freeze

      class ScopesValidator < ActiveModel::EachValidator
        def validate_each(record, attribute, value)
          return record.errors[attribute] = ['has to be an array'] unless value && value.is_a?(Array)

          invalid_scopes = value - SUPPORTED_SCOPES
          record.errors[attribute] << "contains unsuported scopes: #{invalid_scopes.join(', ')}" if invalid_scopes.any?
        end
      end
    end
  end
end
