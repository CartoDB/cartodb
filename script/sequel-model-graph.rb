# Script to generate a graph of Sequel models and associations
#
# Usage:
#   bundle exec rails runner script/sequel-model-graph.rb

require 'set'

# Load all the model classes (autoloader might not have loaded all of
# them yet)
Dir.glob('./app/models/**/*.rb').each {|file| require file }

graph = Set.new

# List Sequel through reflection
Sequel::Model.subclasses.each do |model|
  # Get its associations
  associations = model.association_reflections.values
  associations.each do |assoc|
    # Graphviz dot output format
    graph << "#{model.to_s.demodulize} -> #{assoc.associated_class.to_s} [ label=\"#{assoc[:type].to_s}\" ];"
  end
  graph << "#{model.to_s.demodulize} -> {}" if associations.empty?
end

graph.each do |edge|
  puts edge
end
