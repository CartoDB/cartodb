require 'spec_helper_min'
require 'carto/oauth/google/api'

describe Carto::Oauth::Google::Api do

  before(:all) do
    @valid_token = 'valid_token'
    stub_api_request(200, 'userinfo_valid_response.json')
  end

  describe '#user_params' do
    it 'parses the user data from google' do
      expected_result = {
        username: 'fulanito',
        email: 'fulanito@example.com',
        name: 'Fulano',
        last_name: 'de Tal',
        google_sign_in: true
      }

      api = Carto::Oauth::Google::Api.new(nil, @valid_token)

      api.user_params.should eql expected_result
    end
  end

  describe '#user' do
    context 'with existing user' do
      before(:all) do
        @user = create(:carto_user, email: 'fulanito@example.com', username: 'fulanito')
      end

      after(:all) do
        @user.destroy
      end

      it 'returns the user when the email matches' do
        api = Carto::Oauth::Google::Api.new(nil, @valid_token)

        api.user.should eql @user
      end
    end

    it 'returns nil if there is no matching user' do
      api = Carto::Oauth::Google::Api.new(nil, @valid_token)

      api.user.should be_nil
    end
  end

  def stub_api_request(code, response_filename)
    response_path = File.join(File.dirname(__FILE__), response_filename)
    response = File.open(response_path).read

    Typhoeus.stub(/openidconnect\.googleapis\.com\/v1\/userinfo\?access_token=#{@valid_}/).and_return(
      Typhoeus::Response.new(code: code, body: response)
    )
  end
end
