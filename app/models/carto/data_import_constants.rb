module Carto
  module DataImportConstants
    COLLISION_STRATEGY_SKIP = 'skip'.freeze
    COLLISION_STRATEGY_OVERWRITE = 'overwrite'.freeze

    def validate_collision_strategy
      valid = collision_strategy.nil? || valid_collision_strategies.include?(collision_strategy)
      errors.add(:collision_strategy, "Invalid collision strategy") unless valid
    end

    def valid_collision_strategies
      [
        COLLISION_STRATEGY_SKIP,
        COLLISION_STRATEGY_OVERWRITE
      ]
    end
  end
end
