# encoding: UTF-8'
class AutomaticGeocoding < Sequel::Model

  one_to_one :table
  many_to_one :original_geocoding, class: :Geocoding

  def before_save
    super
    self.updated_at = Time.now
  end # before_save

  def validate
    super
    validates_presence :table_id
  end # validate

  def enqueue
    Resque.enqueue(Resque::SynchronizationJobs, job_id: id)
  end # enqueue

  def run
    self.state = 'running'
    options = { 
      user_id:     table.owner.id,
      table_name:  table.name,
      formatter:   formatter
    }
      
    Geocoding.create(options).run!
    self.run_at   = Time.now + interval
  end # run
end
