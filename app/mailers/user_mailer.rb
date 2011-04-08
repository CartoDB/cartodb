class UserMailer < ActionMailer::Base
  default :from => "cartodb.com <wadus@cartodb.com>"
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
  def invitation_sent(user, protocol, host)
    @setup_user_link = "#{protocol}#{host}#{edit_invitation_path(user, :invite_token => user.invite_token)}"
    mail :to => user.email
  end
end
