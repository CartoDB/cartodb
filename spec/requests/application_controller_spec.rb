require_relative '../spec_helper'
require_relative './http_authentication_helper'

describe ApplicationController do
  include HttpAuthenticationHelper

  before(:all) do
    @user = create(:valid_user)
  end

  after(:all) do
    @user.destroy
  end

  # This filter should always be invoked if http_header_authentication is set,
  # tests are based in dashboard requests because of genericity.
  describe '#http_header_authentication' do
    def stub_load_common_data
      Admin::VisualizationsController.any_instance.stubs(:load_common_data).returns(true)
    end

    describe 'triggering' do
      it 'enabled if http_header_authentication is configured and header is sent' do
        stub_http_header_authentication_configuration
        ApplicationController.any_instance.expects(:http_header_authentication)
        get dashboard_url, {}, authentication_headers('oso@panda.com')
      end

      it 'disabled if http_header_authentication is configured and header is not set' do
        stub_http_header_authentication_configuration
        ApplicationController.any_instance.expects(:http_header_authentication).never
        get dashboard_url, {}, {}
      end

      it 'disabled if http_header_authentication is not configured' do
        ApplicationController.any_instance.expects(:http_header_authentication).never
        get dashboard_url, {}, {}
        get dashboard_url, {}, authentication_headers('oso@panda.com')
      end
    end

    describe 'email autentication' do
      before(:each) do
        stub_http_header_authentication_configuration(field: 'email')
      end

      it 'loads the dashboard for a known user email' do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        stub_load_common_data
        get dashboard_url, {}, authentication_headers(@user.email)
        response.status.should == 200
      end

      it 'does not load the dashboard for an unknown user email' do
        get dashboard_url, {}, authentication_headers('wadus@wadus.com')
        response.status.should == 302
      end

      it 'does not load the dashboard for a known user username' do
        get dashboard_url, {}, authentication_headers(@user.username)
        response.status.should == 302
      end
    end

    describe 'username autentication configuration' do
      before(:each) do
        stub_http_header_authentication_configuration(field: 'username')
      end

      it 'loads the dashboard for a known user username' do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        stub_load_common_data
        get dashboard_url, {}, authentication_headers(@user.username)
        response.status.should == 200
      end

      it 'does not load the dashboard for an unknown user username' do
        get dashboard_url, {}, authentication_headers("unknownuser")
        response.status.should == 302
      end

      it 'does not load the dashboard for a known user id' do
        get dashboard_url, {}, authentication_headers(@user.id)
        response.status.should == 302
      end
    end

    describe 'id autentication configuration' do
      before(:each) do
        stub_http_header_authentication_configuration(field: 'id')
      end

      it 'loads the dashboard for a known user id' do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        stub_load_common_data
        get dashboard_url, {}, authentication_headers(@user.id)
        response.status.should == 200
      end

      it 'does not load the dashboard for an unknown user id' do
        get dashboard_url, {}, authentication_headers(Carto::UUIDHelper.random_uuid)
        response.status.should == 302
      end

      it 'does not load the dashboard for a known user email' do
        get dashboard_url, {}, authentication_headers(@user.email)
        response.status.should == 302
      end
    end

    describe 'auto autentication configuration' do
      before(:each) do
        stub_http_header_authentication_configuration(field: 'auto')
      end

      it 'loads the dashboard for a known user id' do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        stub_load_common_data
        get dashboard_url, {}, authentication_headers(@user.id)
        response.status.should == 200
      end

      it 'loads the dashboard for a known user username' do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        stub_load_common_data
        get dashboard_url, {}, authentication_headers(@user.username)
        response.status.should == 200
      end

      it 'loads the dashboard for a known user email' do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        stub_load_common_data
        get dashboard_url, {}, authentication_headers(@user.email)
        response.status.should == 200
      end

      it 'does not load the dashboard for an unknown user id' do
        get dashboard_url, {}, authentication_headers(Carto::UUIDHelper.random_uuid)
        response.status.should == 302
      end

      it 'does not load the dashboard for an unknown user username' do
        get dashboard_url, {}, authentication_headers("unknownuser")
        response.status.should == 302
      end

      it 'does not load the dashboard for an unknown user email' do
        get dashboard_url, {}, authentication_headers("wadus@wadus.com")
        response.status.should == 302
      end
    end

    describe 'autocreation' do
      describe 'disabled' do
        before(:each) do
          stub_http_header_authentication_configuration(field: 'auto', autocreation: false)
        end

        it 'redirects to login for unknown emails' do
          get dashboard_url, {}, authentication_headers('unknown@company.com')
          response.status.should == 302
          follow_redirect!
          response.status.should == 200
          response.body.should include("Log in")
        end
      end

      describe 'enabled' do
        before(:each) do
          stub_http_header_authentication_configuration(field: 'auto', autocreation: true)
        end

        it 'redirects to user creation for unknown emails' do
          get dashboard_url, {}, authentication_headers('unknown@company.com')
          response.status.should == 302
          response.location.should match /#{signup_http_authentication_path}/
        end

        # This behaviour allows recreation of deleted users. Related to next one.
        it 'redirects to user creation for unknown emails if there is another finished user creation for that user' do
          email = 'unknown@company.com'
          create(:user_creation, state: 'success', email: email)
          get dashboard_url, {}, authentication_headers(email)
          response.status.should == 302
          response.location.should match /#{signup_http_authentication_path}/
        end

        # This behaviour avoids filling `user_creations` table with failed repetitions because of polling
        # and makes frontend to redirect nicely to the dashboard on finish (failing stopped redirection from working)
        it 'redirects to creation in progress instead of creation if that user has a not finished user creation' do
          email = 'unknown2@company.com'
          create(:user_creation, state: 'enqueuing', email: email)
          get dashboard_url, {}, authentication_headers(email)
          response.status.should eq 302
          response.location.should match(/#{signup_http_authentication_in_progress_path}/)
        end

        it 'redirects to user creation for unknown emails if there is other enqueued user creation (for other user)' do
          email1 = 'unknown1@company.com'
          email2 = 'unknown2@company.com'
          create(:user_creation, state: 'enqueuing', email: email1)
          get dashboard_url, {}, authentication_headers(email2)
          response.status.should eq 302
          response.location.should match(/#{signup_http_authentication_path}/)
        end
      end
    end
  end
end
