# Script to generate a graph of Sequel models and associations
#
# Usage:
#   bundle exec rails runner script/sequel-model-graph.rb


# Load all the model classes (autoloader might not have loaded all of
# them yet)
Dir.glob('./app/models/**/*.rb').each {|file| require file }

# List Sequel through reflection
Sequel::Model.subclasses.each do |model|
  # Get its associations
  assocs = model.associations.map {|assoc| assoc.to_s.singularize.camelize}.join(',')
  # Graphviz dot output
  puts "#{model.to_s.demodulize} -> {#{assocs}}"
end
