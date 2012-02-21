# coding: UTF-8

class ImportState < Sequel::Model
  include CartoDB::MiniSequel
  
  property :id, Serial
  property :table_id, Integer
  property :user_id, Integer
  property :file_name, String
  property :upladed_at, DateTime
    
  state_machine :initial => :uploading do
    before_transition :log_state_change
    after_transition  :uploading => :preparing, :preparing => :importing, :importing => :cleaning, :cleaning => :succeeded do
      # send feedback to client
    end
 
    event :preparing do
      transition :uploading => :preparing
    end
    event :importing do
      transition :preparing => :importing
    end
    event :cleaning do
      transition :importing => :cleaning
    end
    event :succeeded do
      transition :cleaning => :succeeded
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
    DataMapper.logger.info("#{id}: #{from} => #{to} on #{event}")
  end
end
