namespace :user do
  namespace :deletion do
    desc 'Delete a user given a username'
    task :by_username, [:username] => [:environment] do |task, args|
      raise 'Please specify the username of the user to be deleted' if args[:username].blank?
      
      user = User.find(username: args[:username])
      raise "The username '#{args[:username]}' does not correspond to any user"

      user.destroy
    end

    desc 'Delete a user given an email'
    task :by_email, [:email] => [:environment] do |task, args|
      raise 'Please specify the email of the user to be deleted' if args[:email].blank?
      
      user = User.find(email: args[:email])
      raise "The email '#{args[:email]}' does not correspond to any user"

      user.destroy
    end
  end
end
