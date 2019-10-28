module Carto
  module BatchQueriesStatementTimeout
    def batch_queries_statement_timeout
      if !defined?(@batch_queries_statement_timeout)
        timeout_str = $users_metadata.HMGET(batch_limits_key, 'timeout').first
        @batch_queries_statement_timeout = timeout_str.nil? ? nil : timeout_str.to_i
      end
      @batch_queries_statement_timeout
    end

    def batch_queries_statement_timeout=(timeout_ms)
      unless !timeout_ms.present? || timeout_ms.to_i > 0
        raise 'batch_queries_statement_timeout must be nil or an integer greater than 0'
      end
      if !timeout_ms.present?
        # NOTE: nil is cast to the empty string in redis (""), which can be cast to 0 in
        # the SQL API. In order to prevent undesired behavior, just delete this key.
        @batch_queries_statement_timeout = nil
        $users_metadata.HDEL batch_limits_key, 'timeout'
      else
        @batch_queries_statement_timeout = timeout_ms.to_i
        $users_metadata.HMSET batch_limits_key, 'timeout', @batch_queries_statement_timeout
      end
    end

    def batch_limits_key
      "limits:batch:#{username}"
    end
  end
end
