# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.
require File.expand_path('../config/application', __FILE__)

require 'rake/dsl_definition'
require 'rake'
require 'resque/tasks'
require 'active_support/dependencies'

# Do not load rake tasks when running resque: https://github.com/CartoDB/cartodb/issues/11046
if Rake.application.top_level_tasks.reject { |t| ['environment', 'resque:work'].include?(t) }.empty?
  CartoDB::Application.paths['lib/tasks'] = []
  load 'lib/tasks/resque.rake'
end

CartoDB::Application.load_tasks

rake_tasks = Rake.application.instance_variable_get('@tasks')
rake_tasks.delete('default')

# Remove ActiveRecord tasks and replace with Sequel versions
rake_tasks.select { |k, _| k.starts_with?('sequel') }.each { |k, v| rake_tasks[k.sub('sequel:', 'db:')] = v }
rake_tasks.select { |k, _| k.starts_with?('cartodb:db') }.each { |k, v| rake_tasks[k.sub('cartodb:db:', 'db:')] = v }

if Rails.env.test?
  namespace :spec do
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

task :default => ["spec:models", "spec:cartodb_lib", "spec:acceptance"]

task "resque:setup" => :environment
