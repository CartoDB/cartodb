# Maintain your gem's version:
require_relative "lib/carto_gears_api/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "carto_gears_api"
  s.version     = CartoGearsApi::VERSION.dup
  s.authors     = ["CARTO"]
  s.email       = ["support@carto.com"]
  s.homepage    = "https://carto.com"
  s.summary     = "CARTO Gears API"
  s.description = "CARTO Gears API"

  s.files = Dir["{app,config,db,lib}/**/*"] + ["LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency 'pg', '0.20.0'
  s.add_dependency "rails", "4.2.11.3"
  s.add_dependency 'sprockets', '3.7.2'
  s.add_dependency 'values', '1.8.0'
end
