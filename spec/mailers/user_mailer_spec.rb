require "spec_helper"

describe UserMailer do
  describe "ask_for_invitation" do
    let(:mail) { UserMailer.ask_for_invitation }

    it "renders the headers" do
      mail.subject.should eq("Ask for invitation")
      mail.to.should eq(["to@example.org"])
      mail.from.should eq(["from@example.com"])
    end

    it "renders the body" do
      mail.body.encoded.should match("Hi")
    end
  end

  describe "invitation_sent" do
    let(:mail) { UserMailer.invitation_sent }

    it "renders the headers" do
      mail.subject.should eq("Invitation sent")
      mail.to.should eq(["to@example.org"])
      mail.from.should eq(["from@example.com"])
    end

    it "renders the body" do
      mail.body.encoded.should match("Hi")
    end
  end

end
