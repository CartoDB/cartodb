# encoding: utf-8

module CartoDB
  module Importer2
    module QuotaCheckHelpers
      def raise_if_over_storage_quota(requested_quota: 0, available_quota: 0, user_id: nil)
        quota_overage = requested_quota - available_quota

        if quota_overage > 0
          report_over_quota(user_id, quota_overage: quota_overage) if user_id

          raise StorageQuotaExceededError.new
        end
      end

      def report_over_quota(user_id, quota_overage: 0)
        Carto::Tracking::Events::ExceededQuota.new(user_id,
                                                   user_id: user_id,
                                                   quota_overage: quota_overage).report
      end
    end
  end
end
