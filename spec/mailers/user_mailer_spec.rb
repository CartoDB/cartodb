# coding: UTF-8

require 'spec_helper_min'

describe UserMailer do

  include Carto::Factories::Visualizations

  describe ".password_reset" do

    before(:all) do
      @user = FactoryGirl.create(:carto_user, email: 'user@example.com', password_reset_token: 'token')
    end

    before(:each) do
      @mailer = UserMailer.password_reset(@user)
    end

    after(:each) do
      ActionMailer::Base.deliveries = []
    end

    after(:all) do
      @user.destroy
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
      expect(mail.to).to eql([@user.email])
    end

    it "delivers a link with the password reset token" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.body).to include('/password_resets/token/edit')
    end

  end
end
