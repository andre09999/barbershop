export function auditData({ actorId, businessId, action, entityType, entityId, metadata }) {
  return {
    actorId: actorId || null,
    businessId: businessId || null,
    action,
    entityType,
    entityId: entityId || null,
    metadata: metadata || undefined,
  };
}
