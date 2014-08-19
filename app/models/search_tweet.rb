# encoding: UTF-8'

class SearchTweet < Sequel::Model

  many_to_one :user
  many_to_one :table

  STATE_IMPORTING = 'importing'
  STATE_COMPLETE  = 'complete'
  STATE_FAILED  = 'failed'

  def set_importing_state
    @state = STATE_IMPORTING
    # For persisting into db
    self.state = @state
  end

  def set_complete_state
    @state = STATE_COMPLETE
    self.state = @state
  end

  def set_failed_state
    @state = STATE_FAILED
    self.state = @state
  end

  def before_save
    super
    self.updated_at = Time.now
  end
end