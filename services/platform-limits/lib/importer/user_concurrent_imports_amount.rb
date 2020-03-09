module CartoDB
  module PlatformLimits
    module Importer

      UNLIMITED_STATEMENT_TIMEOUT_TTL = 30*24*60*60*1000

      # If unspecified at constructor, will default to this value to add a threshold to the key TTL
      DEFAULT_EXPIRE_TTL_THRESHOLD_PERCENT = 0.2

      # This limit uses User.max_concurrent_import_count attribute to limit how many imports a user can have at once.
      # It is not perfect as a safety measure the import will be considered imported after a given time
      # (user statement timeout *2) to avoid stale keys in case of errors
      # Uses Redis storage.
      #
      # 'context' is unused in this limit
      class UserConcurrentImportsAmount < AbstractLimit

        # This limit needs additional fields present at options Hash:
        # :redis Hash {
        #   :db Redis
        #   :expire_ttl_threshold_percent  Integer|nil
        # }
        # :user  (already defined, but mandatory)
        # @see CartoDB::PlatformLimits::AbstractLimit initialize()
        # @throws ArgumentError
        def initialize(options={})
          super(options)

          raise ArgumentError.new('Must supply a user object') if user.nil?
          unless user.respond_to?(:max_concurrent_import_count)
            raise ArgumentError.new('Supplied user object must have :max_concurrent_import_count')
          end
          unless user.max_concurrent_import_count.is_a?(Integer) && user.max_concurrent_import_count > 0
            raise ArgumentError.new('invalid user max_concurrent_import_count (must be positive integer)')
          end
          self.max_value = user.max_concurrent_import_count

          unless user.respond_to?(:database_timeout)
            raise ArgumentError.new('Supplied user object must have :database_timeout')
          end
          unless user.database_timeout.is_a?(Integer)
            raise ArgumentError.new('invalid user database_timeout (must be integer)')
          end

          timeout_to_use = user.database_timeout == 0 ? UNLIMITED_STATEMENT_TIMEOUT_TTL : user.database_timeout

          redis_options = options.fetch(:redis, {})
          @redis = redis_options.fetch(:db, nil)
          raise ArgumentError.new('Must supply redis connection object') if @redis.nil?

          @expire_ttl = ( timeout_to_use / 1000 *
            (1.0 + redis_options.fetch(:expire_ttl_threshold_percent, DEFAULT_EXPIRE_TTL_THRESHOLD_PERCENT)) ).to_i
        end

        protected

        attr_accessor :redis, :expire_ttl

        def subkey
          'Importer:UserConcurrentImportsAmount'
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
          redis.llen(key)
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
          remaining_secs = redis.ttl(key)
          remaining_secs.seconds.from_now
        end

        # Increases the limit
        # @remark Will always increment by 1, no matter the value of the parameter
        # @param context mixed
        # @param amount integer
        def increase(context, amount=1)
          if redis.exists(key)
            redis.rpushx(key, user.username)

            redis.multi do
              (amount-1).times do
                redis.rpushx(key, user.username)
              end
            end if amount > 1
          else
            redis.multi do
              redis.rpush(key, user.username)
              redis.expire(key, expire_ttl)
            end

            redis.multi do
              (amount-1).times do
                redis.rpushx(key, user.username)
              end
            end if amount > 1
          end
        end

        # Decreases the limit
        # @param context mixed
        # @param amount integer
        def decrease(context, amount=1)
          amount.times do
            if redis.exists(key)
              redis.rpop(key)
            end
          end
        end

        # Resets the limit
        def expire
          redis.del(key)
        end

        private
      end
    end
  end
end
