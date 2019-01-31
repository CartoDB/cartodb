export function isOrganizationAdmin (organizationData = {}, userData = {}) {
  return organizationData.owner.id === userData.id ||
    Boolean((organizationData.admins || []).find(u => u.id === userData.id));
}
