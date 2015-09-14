class OrganizationMailer < ActionMailer::Base
  default from: "cartodb.com <support@cartodb.com>"
  layout 'mail'

  def quota_limit(organization)
    @organization = organization
    @subject = "Your organization #{@organization.name} has reached its quota"
    @link = "mailto:support@cartodb.com"

    mail to: @organization.owner.email, 
         subject: @subject
  end

end
