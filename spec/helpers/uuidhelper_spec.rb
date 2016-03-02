require_relative '../simplecov_helper'
require_relative '../rspec_configuration.rb'
require_relative '../../lib/carto/uuidhelper'

class Carto::UUIDHelperInstance
  include Carto::UUIDHelper
end

describe 'UUIDHelper' do

  before(:each) do
    @uuid_helper = Carto::UUIDHelperInstance.new
  end

  it 'validates a valid UUID' do
    @uuid_helper.is_uuid?('5b632a9e-ae07-11e4-ac8d-080027880ca6').should be(true)
  end

  it 'validates a random UUID' do
    @uuid_helper.is_uuid?(SecureRandom.uuid).should be(true)
  end

  it 'fails if content prepended' do
    @uuid_helper.is_uuid?("hi" + SecureRandom.uuid).should be(false)
  end

  it 'fails if content appended' do
    @uuid_helper.is_uuid?(SecureRandom.uuid + "hola").should be(false)
  end

  it 'fails if content prepended with newlines' do
    @uuid_helper.is_uuid?("hi\n" + SecureRandom.uuid).should be(false)
  end

  it 'fails if content appended with newlines' do
    @uuid_helper.is_uuid?(SecureRandom.uuid + "\nhola").should be(false)
  end

end
