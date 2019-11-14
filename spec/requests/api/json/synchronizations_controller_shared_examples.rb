require 'sequel'
require 'rack/test'

shared_examples_for 'synchronization controllers' do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

end
