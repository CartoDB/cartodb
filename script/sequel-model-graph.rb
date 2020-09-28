# Script to generate a graph of Sequel models and associations
#
# Usage:
#   bundle exec rails runner script/sequel-model-graph.rb
#
# The output is left in OUTPUT_FILE as a graphviz .dot
# Check constants for customizations.
#
# You can then convert the output file to an image using graphviz
# command line tools:
#   dot -Tpng /tmp/sequel-graph.dot > /tmp/sequel-graph.png

require 'set'

OUTPUT_FILE = '/tmp/sequel-graph.dot'
INCLUDE_ASSOCIATION_TYPE = false

# Load all the model classes (autoloader might not have loaded all of
# them yet)
Dir.glob('./app/models/**/*.rb').each {|file| require file }

# A Set to store the resulting graph edges
graph = Set.new

# List Sequel through reflection
Sequel::Model.subclasses.each do |model|
  # Get its associations
  associations = model.association_reflections.values
  associations.each do |assoc|
    # Graphviz dot output format
    association_type = INCLUDE_ASSOCIATION_TYPE ? %Q([ label=\"#{assoc[:type].to_s}\" ]) : ''
    graph << "#{model.to_s.demodulize} -> #{assoc.associated_class.to_s} #{association_type};"
  end
  graph << "#{model.to_s.demodulize} -> {}" if associations.empty?
end

# Output to a file
File.open(OUTPUT_FILE, 'w') do |file|
  file.puts "digraph D {"
  graph.each do |edge|
    file.puts edge
  end
  file.puts "}"
end

puts "Done!"
