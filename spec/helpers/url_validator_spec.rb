require_relative '../rspec_configuration'
require_relative '../../lib/carto/url_validator'

class Carto::UrlValidatorInstance
  include Carto::UrlValidator
end

describe 'UUIDHelper' do

  before(:each) do
    @url_validator = Carto::UrlValidatorInstance.new
  end

  it 'raises an error if the URL is not valid at all' do
    expect {
      @url_validator.validate_url!("foo://bar-zzz.com")
    }.to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'raises an error if it is not of type http or https' do
    expect {
      @url_validator.validate_url!("ftp://example.com")
    }.to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'raises an error if it points to a non-standard port' do
    expect {
      @url_validator.validate_url!("http://example.com:8080")
    }.to raise_error(Carto::UrlValidator::InvalidUrlError)
  end

  it 'does nothing if everything is ok' do
    @url_validator.validate_url!("http://example.com/foo.csv")
    @url_validator.validate_url!("https://example.com/bar.kml")
  end

end

