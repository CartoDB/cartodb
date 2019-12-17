require 'spec_helper_min'

describe DataObservatoryMailer do

  describe ".user_request" do
    before(:all) do
      @user = FactoryGirl.create(:carto_user, email: 'fulano@example.com', name: 'Fulano')
    end

    before(:each) do
      @mailer = DataObservatoryMailer.user_request(@user, 'carto.open-data.demographics')
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
      expect(mail.subject).to eql('Your Data Observatory request')
    end

    it "delivers to the expected recipients" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.to).to eql([@user.email])
    end

    it "delivers a text including the requested dataset id" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.body).to include('carto.open-data.demographics')
    end
  end

  describe ".carto_request" do
    before(:all) do
      @user = FactoryGirl.create(:carto_user, email: 'fulano@example.com', name: 'Fulano')
    end

    before(:each) do
      @mailer = DataObservatoryMailer.carto_request(@user, 'carto.open-data.demographics', 3)
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
      expect(mail.subject).to eql('Data Observatory request')
    end

    it "delivers to the expected recipients" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.to).to eql(['dataobservatory@carto.com'])
    end

    it "delivers a text including the requested dataset id" do
      @mailer.deliver_now

      mail = ActionMailer::Base.deliveries.first
      expect(mail.body).to include('carto.open-data.demographics')
    end
  end
end
