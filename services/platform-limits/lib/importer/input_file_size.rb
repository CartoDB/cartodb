# encoding: utf-8

module CartoDB
  module PlatformLimits
    module Importer

      class InputFileSize < AbstractLimit
        def initialize(options={})
          options = options.dup.merge(
            LimitsConfig::IMPORTER_LIMITS[Importer::InputFileSize.classname]
          )
          super(options)
        end

        def subkey
          'Importer:InputFileSize'
        end

        def load
          # No need to load anything
        end

        # @param context mixed
        # @return bool
        def is_over_limit(context)
          get(context) > max_value
        end

        # Gets current value of the limit
        # @param context mixed
        # @return mixed
        def get(context)
          raise ArgumentError.new('context must be an integer') unless context.is_a?(Integer)
          context
        end

        # Gets the maximum limit value
        # @param context mixed
        # @return mixed
        def get_maximum(context)
          max_value
        end

        # Gets when the limit expires
        # @param context mixed
        # @return integer|nil Timestamp
        def get_time_period(context)
          nil
        end

        # Increases the limit
        # @param amount integer
        def increase(amount=1)
          # Not useful here
        end

        # Decreases the limit
        # @param amount integer
        def decrease(amount=1)
          # Not useful here
        end

        # Sets the limit to a specific value
        # @param value mixed
        def set(value)
          # Not useful here, relies on get()
        end

        # Resets the limit
        def expire
          # Does nothing
        end

      end
    end
  end
end
