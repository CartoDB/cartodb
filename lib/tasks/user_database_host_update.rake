namespace :cartodb do
  namespace :database_host do
    desc 'Change database host for users and update metadata'
    task :update_dbm_and_redis, [:origin_ip, :dest_ip] => [:environment] do |_, args|
      raise 'Origin IP parameter is mandatory' unless args[:origin_ip].present?
      raise 'Destination IP parameter is mandatory' unless args[:dest_ip].present?
      affected_users = ::User.where(database_host: args[:origin_ip]).count

      # think about message
      reflection_seconds = ENV['ENABLE_FF_REFLECTION_SECONDS'] || 10

      puts "############################"
      puts "#"
      puts "# The database_host of #{affected_users} users will be updated"
      puts "#"
      puts "# Origin IP: #{args[:origin_ip]}"
      puts "# Destination IP: #{args[:dest_ip]}"
      puts "#"
      puts "# You have #{reflection_seconds} seconds to cancel "
      puts "# the task before it starts"
      puts "#"
      puts "############################"

      sleep reflection_seconds.to_i

      # update dbm without ORM
      dbm_query = "UPDATE users SET database_host='%s' WHERE database_host='%s'"
      query = ActiveRecord::Base.send(:sanitize_sql_array, [dbm_query, args[:dest_ip], args[:origin_ip]])
      ActiveRecord::Base.connection.execute(query)

      # update Redis
      ::User.where(database_host: args[:dest_ip]).order(:id).paged_each(&:save_metadata)
    end
  end
end
