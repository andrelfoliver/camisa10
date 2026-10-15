// Cálculo de saldo da carteira (customer_credits) respeitando a validade.
//
// Regras:
// - Créditos de defeito/reembolso (defect_compensation, refund) não expiram.
// - Demais créditos positivos (fidelidade, campanha, manual) expiram em expires_at.
// - Lançamentos negativos (resgates) sempre contam. Eles são abatidos primeiro
//   dos créditos restritos já expirados (foram usados antes de expirar),
//   depois dos restritos ativos e, por fim, dos sem restrição.

const NON_EXPIRING_TYPES = ['defect_compensation', 'refund'];

export const isNonExpiringCredit = (c) => NON_EXPIRING_TYPES.includes(c?.type);

export const isCreditExpired = (c, now = new Date()) =>
  parseFloat(c?.amount || 0) > 0 &&
  !isNonExpiringCredit(c) &&
  !!c?.expires_at &&
  new Date(c.expires_at) <= now;

export function computeCreditBalance(credits = [], now = new Date()) {
  let expiredRestricted = 0;
  let activeRestricted = 0;
  let unrestricted = 0;
  let redemptions = 0;

  (credits || []).forEach(c => {
    const val = parseFloat(c?.amount || 0);
    if (!val) return;
    if (val < 0) {
      redemptions += Math.abs(val);
      return;
    }
    const minOrder = parseFloat(c?.min_order_amount || 0);
    const isUnrestricted = isNonExpiringCredit(c) || minOrder <= 0;
    const expired = isCreditExpired(c, now);

    if (expired) {
      expiredRestricted += val;
    } else if (isUnrestricted) {
      unrestricted += val;
    } else {
      activeRestricted += val;
    }
  });

  let rem = redemptions;
  const take = (pool) => {
    const d = Math.min(pool, rem);
    rem -= d;
    return pool - d;
  };
  take(expiredRestricted);
  const restrictedBalance = Math.max(0, take(activeRestricted));
  const unrestrictedBalance = Math.max(0, take(unrestricted));

  return {
    totalBalance: restrictedBalance + unrestrictedBalance,
    restrictedBalance,
    unrestrictedBalance
  };
}
