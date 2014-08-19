# encoding: UTF-8'

class SearchTweet < Sequel::Model

  # @param id
  # @param user_id
  # @param table_id
  # @param data_import_id
  # @param service_item_id
  # @param retrieved_items
  # @param state
  # @param created_at
  # @param updated_at

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

  def calculate_used_credits
    return 0 unless self.state == STATE_COMPLETE

    total_rows = self.retrieved_items
    quota = user.organization.present? ? user.organization.twitter_datasource_quota : user.twitter_datasource_quota

    # User#get_twitter_imports_count includes this run, so we discount it
    remaining_quota  = quota + total_rows - user.get_twitter_imports_count
    remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
    used_credits     = total_rows - remaining_quota
    (used_credits > 0 ? used_credits : 0)
  end

  def price
    return 0 unless self.retrieved_items > 0
    (user.effective_twitter_block_price * calculate_used_credits) / user.effective_twitter_datasource_block_size.to_f
  end

end