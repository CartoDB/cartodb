module CartoGearsApi
  module Mailer
    class TestMail < ActionMailer::Base
      def test_mail(from, to, subject)
        @from = from
        @to = to
        @subject = subject
        mail(to: to, from: from, subject: subject).deliver
      end
    end
  end
end
