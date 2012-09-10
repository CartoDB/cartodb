module CartoDB
  class QueriesThreshold
    def self.get(user_id, *args_for_keys)
      if args_for_keys.last == "time"
        $threshold.get(key(user_id, args_for_keys)).to_f
      else
        $threshold.get(key(user_id, args_for_keys)).to_i
      end
    end

    def self.incr(user_id, type_of_query, time_spent = nil)
      return unless %W{ select insert update delete other }.include?(type_of_query)
      $threshold.incr(key(user_id, "total"))
      $threshold.incr(key(user_id, Date.today.strftime("%Y-%m-%d")))
      $threshold.incr(key(user_id, Date.today.strftime("%Y-%m")))
      $threshold.incr(key(user_id, Date.today.strftime("%Y-%m"), type_of_query))
      increase_time(user_id, time_spent) if time_spent
    end

    def self.analyze(user_id, sql, time = nil)
      return if sql.blank?
      increase_time(user_id, time) if time

      sql.split(';').each do |raw_query|
        raw_query.strip!
        next if raw_query.blank?
        if raw_query =~ /^\s*select\s+/i
          incr(user_id, "select")
        elsif raw_query =~ /^\s*insert\s+/i
          incr(user_id, "insert")
        elsif raw_query =~ /^\s*update\s+/i
          incr(user_id, "update")
        elsif raw_query =~ /^\s*delete\s+/i
          incr(user_id, "delete")
        else
          incr(user_id, "other")
        end
      end
    end

    private

    def self.key(user_id, *args_for_keys)
      "rails:users:#{user_id}:queries:#{args_for_keys.join(':')}"
    end

    def self.increase_time(user_id, time)
      old_time = $threshold.get(key(user_id, Date.today.strftime("%Y-%m-%d"),"time")).to_f
      $threshold.set(key(user_id, Date.today.strftime("%Y-%m-%d"),"time"),old_time + time.to_f)
      old_time = $threshold.get(key(user_id, Date.today.strftime("%Y-%m"),"time")).to_f
      $threshold.set(key(user_id, Date.today.strftime("%Y-%m"),"time"),old_time + time.to_f)
    end
  end
end
