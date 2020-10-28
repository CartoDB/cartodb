module Carto
  class Bolt

    include ::LoggerHelper

    DEFAULT_TTL_MS = 10000
    DEFAULT_RETRY_ATTEMPTS = 1
    DEFAULT_RETRY_TIMEOUT = 10000 # in_ms

    def initialize(bolt_key, redis_object: $users_metadata, ttl_ms: DEFAULT_TTL_MS)
      @bolt_key = add_namespace_to_key(bolt_key)
      @redis_object = redis_object
      @ttl_ms = ttl_ms
    end

    # Run a block of code with the lock acquired.
    # It will retry acquiring the lock up to `attempts` times and
    # for up to `timeout` milliseconds.
    # If an executable (lambda/Proc) object is passed through `fail_function`
    # it will be executed if the lock is not acquired and another such proc hasn't
    # been executed during the lock period (before a new locked execution).
    # This can be used to reschedule execution while avoiding to reschedule
    # additional executions while one is pending.
    def run_locked(attempts: DEFAULT_RETRY_ATTEMPTS,
                   timeout: DEFAULT_RETRY_TIMEOUT,
                   fail_function: nil)
      raise 'no code block given' unless block_given?
      raise 'no proc/lambda passed as fail_function' if fail_function.present? && !proc?(fail_function)

      lock_acquired = acquire_lock(attempts, timeout)

      begin
        if lock_acquired
          retried
          yield
          true
        else
          if fail_function && !set_retry
            fail_function.call
          end
          false
        end
      ensure
        unlock if lock_acquired
      end
    end

    private

    def acquire_lock(attempts, timeout)
      attempts.times do |index|
        lock_acquired = get_lock
        # With only 1 attempt, the default value, we dont sleep
        # even if false
        if lock_acquired || (attempts == index + 1)
          return lock_acquired
        end
        sleep((timeout / 1000.0).second)
      end
      log_warning(message: "Couldn't acquire bolt", attempts: attempts, timeout: timeout)
      false
    end

    def proc?(proc)
      proc.respond_to?(:call)
    end

    def unlock
      removed_keys = @redis_object.del(@bolt_key)

      # This may happen due to Redis failure. Highly unlikely, still nice to know.
      if removed_keys > 1
        CartoDB.notify_error('Removed bolt key was duplicated', bolt_key: @bolt_key, amount: removed_keys)
      end

      removed_keys > 0
    end

    def get_lock
      @redis_object.set(@bolt_key, true, px: @ttl_ms, nx: true)
    end

    def retried
      @redis_object.del("#{@bolt_key}:retry")
    end

    def set_retry
      @redis_object.getset("#{@bolt_key}:retry", true)
    end

    def add_namespace_to_key(key)
      "rails:bolt:#{key}"
    end
  end
end
