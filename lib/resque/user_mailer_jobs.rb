module Resque
  module Mailer
    module User

      module AskForInvitation
        @queue = :mailer

        def self.perform(user)
          UserMailer.ask_for_invitation(user).deliver
        end
      end

      module InvitationSent
        @queue = :mailer

        def self.perform(user, protocol, host)
          UserMailer.invitation_sent(user, protocol, host).deliver
        end
      end
    end
  end
end