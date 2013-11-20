# encoding: UTF-8'
class AutomaticGeocoder < Sequel::Model

  one_to_one :table  

  def before_save
    super
    self.updated_at = Time.now
  end # before_save

  def validate
    super
    validates_presence :formatter
    validates_presence :table_name
  end # validate

  def enqueue
    Resque.enqueue(Resque::SynchronizationJobs, job_id: id)
  end # enqueue

  def run
    self.state = 'running'
    # Run geocoding
    self.run_at   = Time.now + interval
  end # run
end
