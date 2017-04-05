module CartoGearsApi
  module Mailers
    class BaseMail < ActionMailer::Base
      default from: Cartodb.get_config(:mailer, 'from')
      layout 'mail'
    end
  end
end