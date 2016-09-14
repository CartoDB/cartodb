# encoding utf-8

require_relative '../lengend'

module Carto
  module Legends
    class HMTL < Carto::Legend
      VALID_DEFINITION_KEYS = [:html].freeze
    end

    class Bubble < Carto::Legend
      VALID_DEFINITION_KEYS = [:fill].freeze
    end

    class Gradient < Carto::Legend
      VALID_DEFINITION_KEYS = [:prefix, :suffix].freeze
    end

    class CategoryOrCustom < Carto::Legend
      VALID_DEFINITION_KEYS = [:categories].freeze

      REQUIRED_CATEOGRY_KEYS = [:color].freeze
      EXCLUDING_CATEGORY_KEYS = [:title, :icon].freeze
      VALID_CATEGORY_KEYS = REQUIRED_CATEOGRY_KEYS + EXCLUDING_CATEGORY_KEYS

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

      def validate_category(category)
        exceeding_keys = category.keys - VALID_CATEGORY_KEYS
        if exceeding_keys.any?
          errors.add(:definition, "Exceeding keys in category: #{exceeding_keys.join(', ')}")
          return false
        end

        optional_keys = category.keys - REQUIRED_CATEOGRY_KEYS
        exclusion_keys = optional_keys.select do |key|
          EXCLUDING_CATEGORY_KEYS.includes?(key)
        end

        if exclusion_keys.length > 1
          errors.add(:definition, "Conflicting keys in category: #{exclusion_keys.join(', ')}")
          return false
        else
          true
        end
      end
    end

    class Category < CategoryOrCustom; end
    class Custom < CategoryOrCustom; end
  end
end
