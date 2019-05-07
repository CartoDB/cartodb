namespace :cartodb do
  namespace :database_host do
    def update_dbm_and_redis(origin_ip, dest_ip)
      # get all affected usernames
      get_usernames_query = "SELECT username FROM users WHERE database_host='#{origin_ip}';"
      usernames = ActiveRecord::Base.connection.execute(get_usernames_query).map { |row| row['username'] }

      # think about message
      reflection_seconds = ENV['ENABLE_FF_REFLECTION_SECONDS'] || 10

      puts "############################"
      puts "#"
      puts "# The database_host of #{usernames.count} users will be updated"
      puts "#"
      puts "# Origin IP: #{origin_ip}"
      puts "# Destination IP: #{dest_ip}"
      puts "#"
      puts "# You have #{reflection_seconds} seconds to cancel "
      puts "# the task before it starts"
      puts "#"
      puts "############################"

      sleep reflection_seconds.to_i

      # update dbm without ORM
      dbm_query = "UPDATE users SET database_host='#{dest_ip}' WHERE database_host='#{origin_ip}'"
      ActiveRecord::Base.connection.execute(dbm_query)

      # update Redis

    end
  end
end
