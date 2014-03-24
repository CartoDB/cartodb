#encoding: utf-8
require_relative '../../services/relocator/worker'

namespace :user do
  namespace :relocation do
    desc 'Relocate user to another database_host'
    task :relocate, [:username, :new_database_host] => [:environment] do |task, args|
      user = User.find(username: args[:username])
      puts "Relocating user #{user.username} (#{user.id}) from #{user.database_host} to #{args[:new_database_host]} in 5 seconds."
      sleep 5
      CartoDB::Relocator::Worker.relocate(user, args[:new_database_host])
    end
  end
end

