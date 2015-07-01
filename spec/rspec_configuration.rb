# encoding: utf-8
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require 'mocha'

RSpec.configure do |config|
  config.mock_with :mocha
end
