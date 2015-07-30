class GeocoderMailer < ActionMailer::Base
  default from: "cartodb.com <support@cartodb.com>"
  layout 'mail'

  def geocoding_finished(user, state, table_name, error_code=nil, processable_rows, real_rows)
    @geocoding_failed = (state == "failed" ||  state == "timeout") ? true : false
    @state = state
    @subject = set_subject(state)
    @table_name = table_name
    @processable_rows = processable_rows
    @real_rows = real_rows
    @link = "#{user.public_url}#{CartoDB.path(self, 'public_tables_show', { id: @table_name })}"

    mail ({:to => user.email, :subject => @subject})
  end

  private

    def set_subject(state)
      if @geocoding_failed
        subject = "Your CartoDB dataset geocoding failed"
      else
        subject = "Your CartoDB dataset geocoding just finished"
      end

      subject
    end

end
