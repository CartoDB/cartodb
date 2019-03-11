# encoding: utf-8

module Carto
  class Bolt
    DEFAULT_REDIS_OBJECT = $users_metadata
    DEFAULT_TTL_MS = 10000

    def initialize(bolt_key, redis_object: DEFAULT_REDIS_OBJECT, ttl_ms: DEFAULT_TTL_MS)
      @bolt_key = add_namespace_to_key(bolt_key)
      @redis_object = redis_object
      @ttl_ms = ttl_ms
    end

    def run_locked(force_block_execution=false)
      raise 'no code block given' unless block_given?

      is_locked = get_lock()

      begin
        yield if (is_locked || force_block_execution)
        !!is_locked
      ensure
        unlock if is_locked
      end
    end

    private

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

    def add_namespace_to_key(key)
      "rails:bolt:#{key}"
    end
  end
end
