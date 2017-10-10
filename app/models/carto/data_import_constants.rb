module Carto
  module DataImportConstants
    COLLISION_STRATEGY_SKIP = 'skip'.freeze
    COLLISION_STRATEGY_OVERWRITE = 'overwrite'.freeze

    VALID_COLLISION_STRATEGIES = [COLLISION_STRATEGY_SKIP, COLLISION_STRATEGY_OVERWRITE, nil].freeze

    def validate_collision_strategy
      unless VALID_COLLISION_STRATEGIES.include?(collision_strategy)
        errors.add(:collision_strategy, "Invalid collision strategy")
      end
    end
  end
end
