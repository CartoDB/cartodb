module CartoGearsApi
  module Mailers
    # Simple email for checking configuration.
    class TestMail < ActionMailer::Base
      # Sends a test email.
      def test_mail(from, to, subject)
        @from = from
        @to = to
        @subject = subject
        mail(to: to, from: from, subject: subject).deliver_now
      end
    end
  end
end
