class UserMailer < ActionMailer::Base
  default :from => "wadus@cartodb.com"
  layout 'mail'

  # Subject defined atconfig/locales/en.yml
  #
  #   en.user_mailer.ask_for_invitation.subject
  #
  def ask_for_invitation(user)
    mail :to => user.email
  end

  # Subject defined atconfig/locales/en.yml
  #
  #   en.user_mailer.invitation_sent.subject
  #
  def invitation_sent(user)
    mail :to => user.email
  end
end
