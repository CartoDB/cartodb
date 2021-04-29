require 'spec_helper_min'

describe DataObservatoryMailer do

  describe ".carto_request" do
    before(:all) do
      @user = create(:carto_user, email: 'fulano@example.com', name: 'Fulano')
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
      expect(mail.subject).to eql('Dataset request')
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

  describe '.carto_request from team org member' do
    before(:all) do
      org = create(:organization)
      @team_org = Carto::Organization.find(org.id)
      @team_org.name = 'team'
      @team_org.save
      @team_user = create(:carto_user)
      @team_user.organization = @team_org
      @team_user.save
    end

    after(:all) do
      @team_user.destroy
      @team_org.destroy
    end

    it 'does not deliver to CARTO recipient if requested from team org member' do
      mailer = DataObservatoryMailer.carto_request(@team_user, 'carto.open-data.demographics', 3)
      mailer.deliver_now
      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end
end
