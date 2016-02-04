# encoding: UTF-8
class AutomaticGeocoding < Sequel::Model

  MAX_RETRIES = 5

  many_to_one :table, class: :UserTable
  one_to_many :geocodings, order: :created_at

  def self.active
    AutomaticGeocoding.where("state IN ?", ['created', 'idle']).all.select do |ag|
      last_modified = ag.table.data_last_modified || 1.year.ago
      last_modified > ag.ran_at
    end
  end # active

  def before_create
    super
    self.created_at ||= Time.now
    self.ran_at     ||= Time.now
    self.state      ||= 'created'
  end # before_create

  def before_save
    super
    self.updated_at = Time.now
  end # before_save

  def validate
    super
    validates_presence :table_id
  end # validate

  def enqueue
    self.update(state: 'on_queue')
    Resque.enqueue(Resque::AutomaticGeocoderJobs, job_id: id)
  end # enqueue

  def run
    self.update(state: 'running')
    options = { 
      user_id:                table.owner.id,
      table_id:               table.id,
      formatter:              geocodings.first.formatter,
      automatic_geocoding_id: self.id
    }

    Geocoding.create(options).run!
    self.update(state: 'idle', ran_at: Time.now, retried_times: 0)
  rescue => e
    self.update(state: 'failed') and raise(e) if retried_times.to_i >= MAX_RETRIES
    self.update(retried_times: retried_times.to_i + 1, state: 'idle')
  end # run
end # AutomaticGeocoding
