class ReporterMailer < ActionMailer::Base
  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def trending_maps_report(mail_to, trending_visualizations)
    @subject = "Daily trending maps report"
    @trending_visualizations = trending_visualizations

    mail to: mail_to, subject: @subject
  end

  def named_maps_near_the_limit(message)
    mail to: 'support-internal@cartodb.com', subject: message
  end
end
