# coding: UTF-8

class ImportState < Sequel::Model
  include CartoDB::MiniSequel
  
  property :id, Serial
  property :table_id, Integer
  property :user_id, Integer
  property :file_name, String
  property :upladed_at, DateTime
  property :trace, HASH
  
    
  state_machine :initial => :uploading do
    self.trace = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(:state => same)
    before_transition :log_state_change
    after_transition  :uploading => :preparing, :preparing => :importing, :importing => :cleaning, :cleaning => :succeeded do
      # send feedback to client
    end
 
    event :preparing do
      transition :uploading => :preparing
      self.trace[:state] = same
    end
    event :importing do
      transition :preparing => :importing
      self.trace[:state] = same
    end
    event :cleaning do
      transition :importing => :cleaning
      self.trace[:state] = same
    end
    event :succeeded do
      transition :cleaning => :succeeded
      self.trace[:state] = same
    end
    event :failed do
      #failed
      # state :pending, :value => nil
      # state :delivered, :if => lambda {|value| value}, :value => lambda {Time.now}
    end
    event :retry do
      #transition :authorized => same, :if => lambda {|p| p.amount_diff < 15}
      #retry
    end
    event :error do
      #log error
    end
  end
  
  def log_state_change(transition)
    event, from, to = transition.event, transition.from_name, transition.to_name
    #DataMapper.logger.info("#{id}: #{from} => #{to} on #{event}")
    p "#{id}: #{from} => #{to} on #{event}"
  end
end
