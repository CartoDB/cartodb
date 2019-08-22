module Carto
  module OauthProvider
    module Scopes
      class ScopesValidator < ActiveModel::EachValidator
        def validate_each(record, attribute, value)
          return record.errors[attribute] = ['has to be an array'] unless value&.is_a?(Array)

          invalid_scopes = Scopes.invalid_scopes(value)
          record.errors[attribute] << "contains unsupported scopes: #{invalid_scopes.join(', ')}" if invalid_scopes.any?
        end
      end
    end
  end
end
