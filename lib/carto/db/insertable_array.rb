# This is a hack for a bug in activerecord-postgres-array 0.0.9
# We can remove this when the upgrade to Rails 4 allows us to remove that gem
class Carto::InsertableArray < Array
  # Omit quotes is set as `new_record?`, so quotes should be omitted for inserts. This is incorrect, we override it
  # to never escape quotes. This quick hack would be a problem if we used nested postgres arrays.
  def to_postgres_array(omit_quotes = false)
    super(false)
  end
end
