# encoding: utf-8

module CartoDB
  module PlatformLimits
    module Importer

      # This limit uses User.max_concurrent_import_count attribute to limit how many imports a user can have at once.
      # It is not perfect as a safety measure the import will be considered imported after a given time
      # (user statement timeout *2) to avoid stale keys in case of errors
      # Uses Redis storage.
      class UserConcurrentImportsAmount < AbstractLimit

        # This limit needs additional fields present at options Hash:
        # :db
        # @see CartoDB::PlatformLimits::AbstractLimit initialize()
        # @throws ArgumentError
        def initialize(options={})
          super(options)

          # TODO: Implement
          self.max_value
        end

        protected

        def subkey
          'Importer:UserConcurrentImportsAmount'
        end

        def load
          # No need to load anything
          # TODO: Implement, or remove this method if not needed in the end
        end

        # @param context mixed
        # @return bool
        def is_over_limit(context)
          get(context) > max_value
        end

        # Gets current value of the limit
        # @param context mixed
        # @return mixed
        # @throws ArgumentError
        def get(context)
          # TODO: Implement
          0
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
          # TODO: Implement
          nil
        end

        # Increases the limit
        # @param amount integer
        def increase(amount=1)
          # TODO: Implement
        end

        # Decreases the limit
        # @param amount integer
        def decrease(amount=1)
          # TODO: Implement
        end

        # Sets the limit to a specific value
        # @param value mixed
        def set(value)
          # Not useful here, relies on get()
        end

        # Resets the limit
        def expire
          # TODO: Implement
        end

      end
    end
  end
end
