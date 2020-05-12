require 'active_record'

class Carto::AutomaticGeocoding < ActiveRecord::Base
  has_many :geocodings, -> { order(:created_at) }
  belongs_to :table, class_name: Carto::UserTable, inverse_of: :automatic_geocodings, foreign_key: :id
  belongs_to :user, class_name: Carto::User, inverse_of: :automatic_geocodings

  validates :table_id, presence: true

  before_create :set_initial_fields
  before_save :set_updated_at

  MAX_RETRIES = 5

  def enqueue
    update_attributes(state: 'on_queue')
    Resque.enqueue(Resque::AutomaticGeocoderJobs, job_id: id)
  end

  def run
    update_attributes(state: 'running')
    options = {
      user_id: table.owner.id,
      table_id: table.id,
      formatter: geocodings.first.formatter,
      automatic_geocoding_id: id
    }

    Geocoding.create(options).run!
    update_attributes(state: 'idle', ran_at: Time.current, retried_times: 0)
  rescue StandardError => e
    if retried_times.to_i >= MAX_RETRIES
      update_attributes(state: 'failed')
      raise(e)
    end
    update_attributes(retried_times: retried_times.to_i + 1, state: 'idle')
  end

  private

  def set_initial_fields
    self.created_at = Time.current
    self.ran_at = Time.current
    self.state = 'created'
  end

  def set_updated_at
    self.updated_at = Time.current
  end
end
