# encoding: utf-8

module Carto
  class Bolt
    DEFAULT_REDIS_OBJECT = $users_metadata
    DEFAULT_TTL_MS = 10000
    DEFAULT_RETRY_ATTEMPTS = 1
    DEFAULT_RETRY_TIMEOUT = 10000 #in_ms

    def initialize(bolt_key, redis_object: DEFAULT_REDIS_OBJECT, ttl_ms: DEFAULT_TTL_MS)
      @bolt_key = add_namespace_to_key(bolt_key)
      @redis_object = redis_object
      @ttl_ms = ttl_ms
    end

    def run_locked(attempts: DEFAULT_RETRY_ATTEMPTS,
                   timeout: DEFAULT_RETRY_TIMEOUT,
                   rerun_func: lambda {})
      raise 'no code block given' unless block_given?
      raise 'no proc/lambda give as rerun_func' unless is_proc?(rerun_func)

      is_locked = acquire_lock(attempts, timeout)

      begin
        is_locked ? yield : set_rerun_after_finish
        try_to_rerun(rerun_func) if is_locked
        !!is_locked
      ensure
        unlock if is_locked
      end
    end

    private

    def acquire_lock(attempts, timeout)
      current_attempt = 1
      is_locked = false
      while current_attempt <= attempts do
        is_locked = get_lock
        if (is_locked || current_attempt == attempts)
          break
        else
          sleep((timeout / 1000.0).second)
          current_attempt += 1
        end
      end
      CartoDB::Logger.warning(message: "Couldn't acquire bolt and finish the task") unless is_locked && current_attempt < attempts
      is_locked
    end

    def try_to_rerun(rerun_func)
      loop do
        if retry?
          rerun_func.call
        else
          break
        end
      end
    end

    def is_proc?(proc)
      proc && proc.respond_to?(:call)
    end

    def unlock
      removed_keys = @redis_object.del(@bolt_key)

      # This may happen due to Redis failure. Highly unlikely, still nice to know.
      if removed_keys > 1
        CartoDB.notify_error('Removed bolt key was duplicated', bolt_key: @bolt_key, amount: removed_keys)
      end

      removed_keys > 0 ? true : false
    end

    def get_lock
      @redis_object.set(@bolt_key, true, px: @ttl_ms, nx: true)
    end

    def set_rerun_after_finish
      @redis_object.set("#{@bolt_key}:retry", true, px: @ttl_ms, nx: true)
    end

    def retry?
      @redis_object.del("#{@bolt_key}:retry") > 0
    end

    def add_namespace_to_key(key)
      "rails:bolt:#{key}"
    end
  end
end
