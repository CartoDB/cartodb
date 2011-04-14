# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require File.expand_path('../config/application', __FILE__)
require 'rake'
require 'resque/tasks'

CartoDB::Application.load_tasks

Rake.application.instance_variable_get('@tasks').delete('default')

if %(development test).include?(Rails.env)
  namespace :spec do
    desc "Run the code examples in spec/acceptance"
    RSpec::Core::RakeTask.new(:cartodb_acceptance) do |t|
      t.pattern = "spec/acceptance/**/*_spec.rb"
    end
    desc "Run the code examples in spec/lib"
    RSpec::Core::RakeTask.new(:cartodb_lib) do |t|
      t.pattern = "spec/lib/**/*_spec.rb"
    end
    desc "Run the code examples in spec/acceptance/api"
    RSpec::Core::RakeTask.new(:cartodb_api) do |t|
      t.pattern = "spec/acceptance/api/*_spec.rb"
    end
  end
end

task :default => ["spec:models", "spec:cartodb_lib", "spec:cartodb_acceptance"]

namespace :cartodb do
  namespace :api do
    desc "Create API documentation"
    task :doc do
      %x(rdoc app/controllers/api/*)
    end
  end
end