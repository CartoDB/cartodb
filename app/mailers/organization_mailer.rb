class OrganizationMailer < ActionMailer::Base
  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def quota_limit_reached(organization)
    @organization = organization
    @subject = "Your organization #{@organization.name} has reached its quota"
    @link = "mailto:support@cartodb.com"

    mail to: @organization.owner.email,
         subject: @subject
  end

  def invitation(invitation, email)
    @invitation = invitation

    @title = "You are invited to join the #{@invitation.organization.name} organization at CartoDB"

    base_url = CartoDB.base_url(@invitation.organization.name)
    token = invitation.token(email)
    @invitation_signup_link = "#{base_url}#{CartoDB.path(self, 'signup', invitation_token: token, email: email)}"

    mail to: email, subject: @title
  end

  def seat_limit_reached(organization)
    @organization = organization
    @subject = "Your organization #{@organization.name} has reached its seat limit"
    @link = "mailto:support@cartodb.com"

    mail to: @organization.owner.email,
         subject: @subject
  end

end
