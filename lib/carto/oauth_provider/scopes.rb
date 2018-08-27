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

      # Descriptions for frontend
      class Scope
        attr_reader :name, :category, :description

        def initialize(name, category, description)
          @name = name
          @category = category
          @description = description
        end
      end

      class Category
        attr_reader :description, :icon

        def initialize(description, icon = nil)
          @description = description
          @icon = icon
        end
      end

      SCOPE_DEFAULT = '_default'.freeze
      CATEGORY_OFFLINE = Category.new('Offline access').freeze
      CATEGORY_USER = Category.new('User and personal data').freeze

      SCOPE_DESCRIPTIONS = {
        SCOPE_DEFAULT => Scope.new(SCOPE_DEFAULT, CATEGORY_USER, 'Username and organization name').freeze,
        SCOPE_OFFLINE => Scope.new(SCOPE_OFFLINE, CATEGORY_OFFLINE, 'Access CARTO in the background').freeze
      }.freeze

      def self.scopes_by_category(new_scopes, previous_scopes)
        # If we had previous scopes, DEFAULT was already granted.
        previous_scopes = previous_scopes.nil? ? [] : previous_scopes + [SCOPE_DEFAULT]

        all_scopes = ([SCOPE_DEFAULT] + new_scopes + previous_scopes).uniq
        scopes_by_category = all_scopes.map { |s| SCOPE_DESCRIPTIONS[s] }.group_by(&:category)
        scopes_by_category.map do |category, scopes|
          {
            description: category.description,
            icon: category.icon,
            scopes: scopes.map do |scope|
              {
                description: scope.description,
                new: !previous_scopes.include?(scope.name)
              }
            end
          }
        end
      end
    end
  end
end
