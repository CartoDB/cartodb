module CartoDB
  module PlatformLimits
    module Importer

      # This limit controls how many synchronizations a user can have at once.
      # Uses Redis storage.
      #
      # 'context' is unused in this limit
      class UserConcurrentSyncsAmount < AbstractLimit

        # In seconds
        KEY_TTL = 2*60*60

        MAX_SYNCS_PER_USER = 3

        # This limit needs additional fields present at options Hash:
        # :redis Hash {
        #   :db Redis
        # }
        # :user  (already defined, but mandatory)
        # @see CartoDB::PlatformLimits::AbstractLimit initialize()
        # @throws ArgumentError
        def initialize(options={})
          super(options)

          raise ArgumentError.new('Must supply a user object') if user.nil?

          self.max_value = MAX_SYNCS_PER_USER

          redis_options = options.fetch(:redis, {})
          @redis = redis_options.fetch(:db, nil)
          raise ArgumentError.new('Must supply redis connection object') if @redis.nil?

          @expire_ttl = KEY_TTL
        end

        protected

        attr_accessor :redis, :expire_ttl

        def subkey
          'Importer:UserConcurrentSyncsAmount'
        end

        # @param context mixed
        # @return bool
        def is_over_limit(context)
          get(context) >= max_value
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
        # @param context mixed
        # @param amount integer
        def increase(context, amount=1)
          actual_amount = [max_value - get(context), amount].min
          return if actual_amount <= 0

          if redis.exists(key)
            redis.rpushx(key, user.username)

            redis.multi do
              (actual_amount-1).times do
                redis.rpushx(key, user.username)
              end
            end if actual_amount > 1
          else
            redis.multi do
              redis.rpush(key, user.username)
              redis.expire(key, expire_ttl)
            end

            redis.multi do
              (actual_amount-1).times do
                redis.rpushx(key, user.username)
              end
            end if actual_amount > 1
          end
        end

        # Decreases the limit
        # @param context mixed
        # @param amount integer
        def decrease(context, amount=1)
          current_amount = get(context)

          actual_amount = [current_amount, amount].min

          return if actual_amount <= 0

          actual_amount.times do
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
