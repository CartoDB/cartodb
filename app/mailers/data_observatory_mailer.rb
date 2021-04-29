class DataObservatoryMailer < ActionMailer::Base

  CARTO_REQUEST_RECIPIENT = 'dataobservatory@carto.com'.freeze
  EXCLUDED_ORGS = %w(team solutionscdb).freeze

  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def carto_request(user, dataset_id, delivery_days)
    subject = 'Dataset request'
    @user_name = user.name
    @user_email = user.email
    @dataset_id = dataset_id
    @delivery_days = delivery_days

    unless Rails.env.staging? || EXCLUDED_ORGS.include?(user.organization&.name) || not_configured?
      mail to: CARTO_REQUEST_RECIPIENT, subject: subject
    end
  end

  def carto_full_access_request(user, dataset_id)
    subject = 'DO Full Access request'
    @user_name = user.name
    @user_email = user.email
    @dataset_id = dataset_id

    unless Rails.env.staging? || EXCLUDED_ORGS.include?(user.organization&.name) || not_configured?
      mail to: CARTO_REQUEST_RECIPIENT, subject: subject
    end
  end

  def configured?
    ActionMailer::Base.smtp_settings[:address].present? || Rails.env.test?
  end

  def not_configured?
    !configured?
  end

end
