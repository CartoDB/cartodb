require_relative '../../lib/carto/uuidhelper'

describe 'UUIDHelper' do
  it 'validates a valid UUID' do
    Carto::UUIDHelper.uuid?('5b632a9e-ae07-11e4-ac8d-080027880ca6').should be(true)
  end

  it 'validates a random UUID' do
    Carto::UUIDHelper.uuid?(Carto::UUIDHelper.random_uuid).should be(true)
  end

  it 'fails if content prepended' do
    Carto::UUIDHelper.uuid?("hi" + Carto::UUIDHelper.random_uuid).should be(false)
  end

  it 'fails if content appended' do
    Carto::UUIDHelper.uuid?(Carto::UUIDHelper.random_uuid + "hola").should be(false)
  end

  it 'fails if content prepended with newlines' do
    Carto::UUIDHelper.uuid?("hi\n" + Carto::UUIDHelper.random_uuid).should be(false)
  end

  it 'fails if content appended with newlines' do
    Carto::UUIDHelper.uuid?(Carto::UUIDHelper.random_uuid + "\nhola").should be(false)
  end
end
