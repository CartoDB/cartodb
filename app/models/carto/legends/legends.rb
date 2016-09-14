# encoding utf-8

require_relative '../lengend.rb'

module Carto
  module Legends
    class HMTL < Carto::Legend
      VALID_DEFINITION_KEYS = [:html].freeze
    end

    class Category < Carto::Legend
      VALID_DEFINITION_KEYS = [:categories].freeze
      VALID_CATEGORY_KEYS = [:color, :title, :icon].freeze

      private

      def validate_definition
        if super
          definition[:categories].each do |category|
            validate_category(category)
          end
        else
          false
        end
      end

      private

      def validate_category(category)
        exceeding_keys = category.keys - VALID_CATEGORY_KEYS
        errors.add(:definition, "Exceeding keys in category: #{exceeding_keys.join(', ')}")

        missing_keys = VALID_CATEGORY_KEYS - category.keys
      end
    end
  end
end
