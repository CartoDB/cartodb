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

end
