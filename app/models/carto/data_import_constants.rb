module Carto
  module DataImportConstants
    COLLISION_STRATEGY_SKIP = 'skip'.freeze

    def validate_collision_strategy
      valid = collision_strategy.nil? || collision_strategy == COLLISION_STRATEGY_SKIP
      errors.add(:collision_strategy, "Invalid collision strategy") unless valid
    end
  end
end
