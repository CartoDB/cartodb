namespace :user do
  namespace :deletion do
    desc 'Delete a user given a username'
    task :by_username, [:username] => [:environment] do |task, args|
      raise 'Please specify the username of the user to be deleted' if args[:username].blank?
      
      user = User.find(username: args[:username])
      raise "The username '#{args[:username]}' does not correspond to any user" if user.nil?

      raise 'Deletion aborted due to bad confirmation' if !deletion_confirmed?(user)

      user.destroy
    end

    desc 'Delete a user given an email'
    task :by_email, [:email] => [:environment] do |task, args|
      raise 'Please specify the email of the user to be deleted' if args[:email].blank?
      
      user = User.find(email: args[:email])
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
end
