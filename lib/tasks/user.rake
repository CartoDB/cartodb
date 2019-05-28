namespace :user do
  namespace :deletion do
    desc 'Delete a user given a username'
    task :by_username, [:username] => [:environment] do |task, args|
      raise 'Please specify the username of the user to be deleted' if args[:username].blank?

      user = ::User.find(username: args[:username])
      raise "The username '#{args[:username]}' does not correspond to any user" if user.nil?

      raise 'Deletion aborted due to bad confirmation' if !deletion_confirmed?(user)

      user.destroy
    end

    desc 'Delete a user given an email'
    task :by_email, [:email] => [:environment] do |task, args|
      raise 'Please specify the email of the user to be deleted' if args[:email].blank?

      user = ::User.find(email: args[:email])
      raise "The email '#{args[:email]}' does not correspond to any user" if user.nil?

      raise 'Deletion aborted due to bad confirmation' if !deletion_confirmed?(user)

      user.destroy
    end

    def deletion_confirmed?(user)
      puts ""
      puts "You are about to delete the following user:"
      puts "\t> username: #{user.username}"
      puts "\t> email: #{user.email}"
      puts ""
      puts "Alongside '#{user.username}', the following will be deleted:"
      puts "\t> #{user.maps.length} maps"
      puts "\t> #{user.tables.count} datasets"
      puts ""
      puts "Type in the user's username (#{user.username}) to confirm:"

      confirm = STDIN.gets.strip

      confirm == user.username
    end
  end

  namespace :change do
    desc 'Change the number of maximum layers allowed on a map'
    task :max_layers, [:username, :max_layers] => [:environment] do |task, args|
      max_layers = args[:max_layers].to_i

      raise 'Please specify the username of the user to be modified' if args[:username].blank?
      raise 'Please specify a number of layers that is a positive integer' if max_layers < 1

      user = ::User.find(username: args[:username])
      raise "The username '#{args[:username]}' does not correspond to any user" if user.nil?

      old_max_layers = user.max_layers

      user.max_layers = max_layers
      user.save

      puts "Changed the number of max layers for '#{user.username}' from #{old_max_layers} to #{max_layers}."
    end
  end

  namespace :likes do
    desc 'Clean likes for all the users of the organization'
    task :clean_org_likes, [:organization] => [:environment] do |_, args|
      raise 'Please specify the organization to be cleaned' if args[:organization].blank?
      org = Carto::Organization.find_by_name(args[:organization])
      raise "The organization '#{args[:organization]}' does not correspond to any organization" if org.nil?
      org.users.find_each do |u|
        Carto::Like.where(actor: u.id).delete_all
      end
    end
    desc 'Clean likes for a user'
    task :clean_user_likes, [:username] => [:environment] do |_, args|
      raise 'Please specify the username to be cleaned' if args[:username].blank?
      u = Carto::User.find_by_username(args[:username])
      raise "The username '#{args[:username]}' does not correspond to any user" if u.nil?
      Carto::Like.where(actor: u.id).delete_all
    end
  end

  namespace :ghost_tables do
    desc 'Install ghost tables trigger to all the organizations owners and regular users'
    task :install_ghost_tables_trigger => :environment do
      Carto::User.where(organization_id: nil).find_each do |user|
        install_ghost_tables_trigger(user.id)
      end

      Organization.each { |org| install_ghost_tables_trigger(org.owner_id) }
    end

    def install_ghost_tables_trigger(user_id)
      user = ::User.find(id: user_id)
      if user.nil?
        puts "ERROR: User #{user_id} does not exist"
      elsif user.organization_user? && !user.organization_owner?
        puts "ERROR: User #{user_id} must be an org owner or not to be an organization user"
      elsif user.has_feature_flag?('ghost_tables_trigger_disabled')
        puts "WARN: Skipping user #{user_id} (it has 'ghost_tables_trigger_disabled' feature flag)"
      else
        begin
          user.db_service.create_ghost_tables_event_trigger
        rescue StandardError => error
          puts "ERROR creating ghost tables trigger for user #{user_id}: #{error.message}"
        end
      end
    end

    desc 'Drop ghost_tables_trigger to all the organizations owners and regular users'
    task :drop_ghost_tables_trigger => :environment do
      Carto::User.where(organization_id: nil).find_each do |user|
        drop_ghost_tables_trigger(user.id)
      end

      Organization.each { |org| drop_ghost_tables_trigger(org.owner_id) }
    end

    def drop_ghost_tables_trigger(user_id)
      user = ::User.find(id: user_id)
      if user.nil?
        puts "ERROR: User #{username} does not exist"
      elsif user.organization_user? && !user.organization_owner?
        puts "ERROR: User #{username} must be an org owner or not to be an organization user"
      else
        user.db_service.drop_ghost_tables_event_trigger
      end
    end
  end

  namespace :notifications do
    desc 'Add a text in the notification field for users filtered by field'
    task :add_by_field, [:filter_field, :filter_value, :notification] => [:environment] do |task, args|
      allowed_fields = ['database_host']
      raise "Filter field and value are needed" if args[:filter_field].nil? || args[:filter_value].nil?
      raise "Unknown field #{args[:filter_field]} for filtering. Allowed fields are #{allowed_fields.join(',')}" unless allowed_fields.include?(args[:filter_field])
      raise "Notification not provided. Please include it" if args[:notification].nil?
      sql = "UPDATE users SET notification = '%s' WHERE %s = '%s'"
      query = ActiveRecord::Base.send(:sanitize_sql_array, [sql, args[:notification], args[:filter_field], args[:filter_value]])
      ActiveRecord::Base.connection.execute(query)
    end

    desc 'Clean notification for users filtered by field'
    task :clean_by_field, [:filter_field, :filter_value] => [:environment] do |task, args|
      allowed_fields = ['database_host']
      raise "Filter field and value are needed" if args[:filter_field].nil? || args[:filter_value].nil?
      raise "Unknown field #{args[:filter_field]} for filtering. Allowed fields are #{allowed_fields.join(',')}" unless allowed_fields.include?(args[:filter_field])
      sql = "UPDATE users SET notification = NULL WHERE %s = '%s'"
      query = ActiveRecord::Base.send(:sanitize_sql_array, [sql, args[:filter_field], args[:filter_value]])
      ActiveRecord::Base.connection.execute(query)
    end
  end
end
