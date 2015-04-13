class Carto::Api::SynchronizationPresenter

  def initialize(synchronization)
    @synchronization = synchronization
  end

  def to_poro
    # TODO
    @synchronization.nil? ? nil : {}
  end

end
