require_relative '../../../services/datasources/lib/datasources'

# @see DB table 'synchronization_oauths'
class SynchronizationOauth < Sequel::Model

  many_to_one :user

  PUBLIC_ATTRIBUTES = [
      :id,
      :user_id,
      :service,
      :token
  ]

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
  end #public_values

  def validate
    super

    validates_presence :token

    if new?
      existing_oauth = SynchronizationOauth.filter(
          user_id:  user_id,
          service:  service
      ).first
      errors.add(:user_id, " already has an oauth token created for service #{:service}") unless existing_oauth.nil?
    else
      existing_oauth = SynchronizationOauth.filter(
          id:  id
      ).first
      errors.add(:id, ' cannot change user or service, only token') unless (existing_oauth.service == service && existing_oauth.user_id == user_id)
    end
  end #validate

  def before_save
    super
    self.updated_at = Time.now
  end #before_save

  def ==(oauth_object)
    return false unless oauth_object
    self.id == oauth_object.id
  end #==


  def get_service_datasource
    user = ::User.where(id: user_id).first
    datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(service, user, {
      http_timeout: ::DataImport.http_timeout_for(user)
    })
    datasource.token = token unless datasource.nil?
    datasource
  end #get_service_datasource

end
