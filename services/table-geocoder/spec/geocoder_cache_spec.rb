# encoding: utf-8
require_relative '../lib/table_geocoder.rb'
require_relative '../../geocoder/lib/geocoder.rb'
require_relative 'factories/pg_connection'
require 'ruby-debug'

RSpec.configure do |config|
  config.mock_with :mocha
end

describe CartoDB::GeocoderCache do

  describe '#run' do
    it "cacheses" do
      cache = CartoDB::GeocoderCache.new
      cache.resolve.should be_true
    end
  end #run

end # CartoDB::GeocoderCache
