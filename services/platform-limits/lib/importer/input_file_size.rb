module CartoDB
  module PlatformLimits
    module Importer

      # This limit uses User.max_import_file_size attribute to limit file sizes upon imports.
      # Has no storage as there's no need of it, and serves as a really simple Limit example.
      #
      # 'context' is expected to be an integer containing the file size in bytes
      class InputFileSize < AbstractLimit

        # This limit needs additional fields present at options Hash:
        # :user  (already defined, but mandatory)
        # @see CartoDB::PlatformLimits::AbstractLimit initialize()
        # @throws ArgumentError
        def initialize(options={})
          super(options)

          raise ArgumentError.new('Must supply a user object') if user.nil?
          unless user.respond_to?(:max_import_file_size)
            raise ArgumentError.new('Supplied user object must have :max_import_file_size')
          end
          unless user.max_import_file_size.is_a?(Integer) && user.max_import_file_size > 0
            raise ArgumentError.new('invalid user max_import_file_size (must be positive integer)')
          end

          self.max_value = user.max_import_file_size
        end

        protected

        def subkey
          'Importer:InputFileSize'
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
        # @param context mixed
        # @param amount integer
        def increase(context, amount=1)
          # Not useful here
        end

        # Decreases the limit
        # @param context mixed
        # @param amount integer
        def decrease(context, amount=1)
          # Not useful here
        end

        # Resets the limit
        def expire
          # Does nothing
        end

      end
    end
  end
end
