namespace :cartodb do
  namespace :database_host do
    def update_dbm_and_redis(origin_ip, dest_ip)
      # get all affected usernames
      get_usernames_query = "SELECT username FROM users WHERE database_host='#{origin_ip}';"
      usernames = ActiveRecord::Base.connection.execute(get_usernames_query).map { |row| row['username'] }

      # think about message


      # update dbm without ORM


      # update Redis

    end
  end
end
