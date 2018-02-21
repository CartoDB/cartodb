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

  namespace :api_key do
    desc 'Creates default API Keys for user'
    task :create_default_for_emails, [:emails_file] => [:environment] do |_, args|
      line = 0
      File.foreach(args[:emails_file]) do |email|
        email.strip!
        line += 1

        unless email =~ /.*@.*\..*/
          puts "Row #{line} is not an email: #{email}"
          next
        end

        user = User.first(email: email)

        if user.nil?
          puts "WARN: User #{email} not found"
        else
          begin
            user.create_api_keys
            puts "INFO: Api Keys created for #{user.email}"
          rescue => e
            puts "WARN: Unable to create api keys for user with email #{email}: #{e}"
          end
        end
      end
    end

    desc 'Creates default API Keys for users who don\'t have them yet'
    task :create_default do
      Carto::User.joins('LEFT JOIN api_keys ON api_keys.user_id = users.id').where(api_keys: { id: nil }).first.each { |u| create_api_keys_for_user(u) }
    end

    desc 'Creates default API Keys for users who don\'t have them yet under given organization'
    task :create_default_for_organization, [:org_name] => [:environment] do |_, args|
      puts "INFO: Creating default API Keys for all users in organization #{args[:org_name]}"
      org = Carto::Organization.find_by_name(args[:org_name])
      puts "ERROR: Organization not found" unless org
      org.users.each { |u| create_api_keys_for_user(u) }
    end
  end

  def create_api_keys_for_user(carto_user)
    if carto_user.api_keys.master.empty?
      puts "INFO: Creating master API Key for user #{carto_user.username}"
      carto_user.api_keys.create_master_key!
    end

    if carto_user.api_keys.default_public.empty?
      puts "INFO: Creating default public API Key for user #{carto_user.username}"
      carto_user.api_keys.create_default_public_key!
    end
  end
end
