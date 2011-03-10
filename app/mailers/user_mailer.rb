class UserMailer < ActionMailer::Base
  default :from => "wadus@cartodb.com"
  layout 'mail'

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.user_mailer.ask_for_invitation.subject
  #
  def ask_for_invitation(user)
    @user = user
    mail :to => user.email
  end

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.user_mailer.invitation_sent.subject
  #
  def invitation_sent
    @greeting = "Hi"

    mail :to => "to@example.org"
  end
end
