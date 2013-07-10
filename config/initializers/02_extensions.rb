# Disable XML parameter parsing, see:
# http://www.insinuator.net/2013/01/rails-yaml/
ActionDispatch::ParamsParser::DEFAULT_PARSERS.delete(Mime::XML) 

# Require optional rails engines
Dir["engines" + "/*/*.gemspec"].each do |gemspec_file|
  gem_name = File.basename(gemspec_file, File.extname(gemspec_file))
  puts "** Loading engine #{gem_name}"
  require gem_name
end
