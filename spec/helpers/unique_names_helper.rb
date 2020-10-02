# These helpers are meant to be used in tests to generate random data which may collide, e.g: usernames
# The methods are parameter-less in purpose, so it is easier to modify the name generation if needed
module UniqueNamesHelper

  @@item_count = 0

  def unique_string
    format '%08d', unique_integer
  end

  def unique_email
    r = unique_string
    "e#{r}@d#{r}.com"
  end

  def unique_name(prefix)
    prefix + unique_string
  end

  def unique_integer
    @@item_count += 1
    test_run_id * 1_000_000 + @@item_count
  end

  def test_run_id
    @@test_run_id ||= if ENV['PARALLEL_SEQ']
                        ENV['PARALLEL_SEQ'].to_i
                      elsif ENV['CHECK_SPEC']
                        ENV['CHECK_SPEC'].to_i
                      else
                        0
                      end
  end

end
