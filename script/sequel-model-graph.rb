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
  associations = model.association_reflections.values
  associations.each do |assoc|
    # Graphviz dot output
    puts "#{model.to_s.demodulize} -> #{assoc.associated_class.to_s} [ label=\"#{assoc[:type].to_s}\" ];"
  end
  puts "#{model.to_s.demodulize} -> {}" if associations.empty?
end
