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

    @title = "You have been invited to the #{@invitation.organization.name} organization in CartoDB"

    @invitation_signup_link = "#{CartoDB.base_url(@invitation.organization.name)}#{CartoDB.path(self, 'signup', { invitation_token: invitation.token(email) })}"

    mail to: email, subject: @title
  end

end
