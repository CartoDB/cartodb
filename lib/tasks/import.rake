# encoding: utf-8
require 'fileutils'
namespace :cartodb do
  desc 'Import a file to CartoDB'
  task :import, [:username, :filepath] => [:environment] do |task, args|
    user        = User.where(username: args[:username]).first
    filepath    = File.expand_path(args[:filepath])
    
    data_import = DataImport.create(
      :user_id       => user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!
    puts data_import.log
  end
end

