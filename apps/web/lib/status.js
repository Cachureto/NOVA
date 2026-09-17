export const DROP_STATUS = {
  scheduled: { label: 'Próximamente', badge: 'badge-accent' },
  live: { label: 'En vivo', badge: 'badge-live' },
  sold_out: { label: 'Agotado', badge: 'badge-danger' },
  ended: { label: 'Finalizado', badge: 'badge' },
  cancelled: { label: 'Cancelado', badge: 'badge' },
};

export const ORDER_STATUS = {
  pending: { label: 'Pendiente', badge: 'badge-warning' },
  paid: { label: 'Pagado', badge: 'badge-accent' },
  shipped: { label: 'Enviado', badge: 'badge-accent' },
  delivered: { label: 'Entregado', badge: 'badge-live' },
  cancelled: { label: 'Cancelado', badge: 'badge-danger' },
  refunded: { label: 'Reembolsado', badge: 'badge' },
};
