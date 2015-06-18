require_relative '../spec_helper'

describe UsersController do

  it 'returns 404 outside organization subdomains' do
    get signup_url
    response.status.should == 404
    post users_url
    response.status.should == 404
  end

end
