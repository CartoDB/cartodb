namespace :user do
  desc 'Get the API key from a username'
  task :query_api_key, [:username] => [:environment] do |task, args|
    user = ::User.where(username: args[:username]).first
    puts user.api_key
  end
end

