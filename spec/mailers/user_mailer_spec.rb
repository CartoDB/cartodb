require 'spec_helper_min'

describe UserMailer do
  include_context 'organization with users helper'

  before(:all) do
    @carto_org_user_1.password_reset_token = 'token'
    @carto_org_user_1.save
  end

  after(:each) do
    ActionMailer::Base.deliveries = []
  end

  describe ".password_reset" do
    before(:each) do
      @mailer = UserMailer.password_reset(@carto_org_user_1)
    end

    it "delivers the mail" do
      expect { @mailer.deliver_now }.to change(ActionMailer::Base.deliveries, :size).by(1)
    end

    it "delivers with the expected subject" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.subject).to eql('Reset CARTO password')
    end

    it "delivers to the expected recipients" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.to).to eql([@carto_org_user_1.email])
    end

    it "delivers a link with the password reset token" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.body).to include('/password_resets/token/edit')
    end
  end

  describe ".share_visualization kuviz" do
    before(:each) do
      @kuviz = create(:kuviz_visualization, user: @carto_org_user_2)
      @mailer = UserMailer.share_visualization(@kuviz, @carto_org_user_1)
    end

    it "delivers the mail" do
      expect { @mailer.deliver_now }.to change(ActionMailer::Base.deliveries, :size).by(1)
    end

    it "delivers with the expected subject" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.subject).to eql("#{@carto_org_user_2.username} has shared a CARTO map with you")
    end

    it "delivers to the expected recipients" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.to).to eql([@carto_org_user_1.email])
    end

    it "delivers a link with the right link for kuviz" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      base_url = "http://#{@organization.name}.localhost.lan:53716"
      expected_link = "#{base_url}/u/#{@carto_org_user_2.username}/kuviz/#{@kuviz.id}"
      expect(mail.body).to include(expected_link)
    end
  end

  describe ".share_visualization app" do
    before(:each) do
      @app = create(:app_visualization, user: @carto_org_user_2)
      @mailer = UserMailer.share_visualization(@app, @carto_org_user_1)
    end

    it "delivers the mail" do
      expect { @mailer.deliver_now }.to change(ActionMailer::Base.deliveries, :size).by(1)
    end

    it "delivers with the expected subject" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.subject).to eql("#{@carto_org_user_2.username} has shared a CARTO map with you")
    end

    it "delivers to the expected recipients" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.to).to eql([@carto_org_user_1.email])
    end

    it "delivers a link with the right link for app" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      base_url = "http://#{@organization.name}.localhost.lan:53716"
      expected_link = "#{base_url}/u/#{@carto_org_user_2.username}/app/#{@app.id}"
      expect(mail.body).to include(expected_link)
    end
  end
end
