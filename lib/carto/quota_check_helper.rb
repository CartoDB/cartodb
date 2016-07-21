# enconding utf-8

require_dependency 'carto/tracking/events'

module Carto
  module QuotaCheckHelper
    def raise_if_over_storage_quota(quota_requested: 0, quota_available: 0, user_id: nil)
      quota_overage = quota_requested - quota_available

      if quota_overage > 0
        report_over_storage_quota(user_id, quota_overage: quota_overage) if user_id

        raise StorageQuotaExceededError.new
      end
    end

    def report_over_quota(user_id, quota_overage: 0)
      user = Carto::User.find(user_id)

      Carto::Tracking::Events::ExceededQuota.new(user, quota_overage: quota_overage).report
    end
  end
end
