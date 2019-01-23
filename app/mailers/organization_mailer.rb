class OrganizationMailer < ActionMailer::Base
  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def quota_limit_reached(organization)
    @organization = organization
    @subject = "Your organization #{@organization.name} has reached its quota"
    @link = Cartodb.get_config(:mailer, 'template', 'support_link')

    mail to: @organization.owner.email,
         subject: @subject
  end

  def invitation(invitation, email)
    @invitation = invitation
    @organization = invitation.organization

    app_name = Cartodb.get_config(:mailer, 'template', 'app_name')
    @subject = "You are invited to join the #{@organization.name} organization at #{app_name} #{@invitation.viewer? ? 'as a viewer' : ''}"

    base_url = CartoDB.base_url(@organization.name)
    token = invitation.token(email)
    @invitation_signup_link = "#{base_url}#{CartoDB.path(self, 'signup', invitation_token: token, email: email)}"

    mail to: email, subject: @subject
  end

  def seat_limit_reached(organization)
    @organization = organization
    @subject = "Your organization #{@organization.name} has reached its seat limit"
    @link = Cartodb.get_config(:mailer, 'template', 'support_link')

    mail to: @organization.owner.email,
         subject: @subject
  end

end
