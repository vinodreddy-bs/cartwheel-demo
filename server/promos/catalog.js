// Launch promo codes (spec §5). Money in paise; dates are IST calendar days.
const SEED_PROMOS = [
  { code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 99900, maxDiscount: 30000, category: null, startsOn: null, endsOn: null, usageLimit: null, oncePerEmail: true, listed: true },
  { code: 'FLAT250', type: 'flat', value: 25000, minOrder: 199900, maxDiscount: null, category: null, startsOn: null, endsOn: null, usageLimit: null, oncePerEmail: false, listed: true },
  { code: 'FREESHIP', type: 'free_shipping', value: 0, minOrder: null, maxDiscount: null, category: null, startsOn: null, endsOn: null, usageLimit: null, oncePerEmail: false, listed: true },
  { code: 'BOOKS20', type: 'category', value: 20, minOrder: null, maxDiscount: null, category: 'Books', startsOn: null, endsOn: null, usageLimit: null, oncePerEmail: false, listed: true },
  { code: 'DIWALI25', type: 'percentage', value: 25, minOrder: 299900, maxDiscount: 100000, category: null, startsOn: '2026-10-15', endsOn: '2026-11-05', usageLimit: null, oncePerEmail: false, listed: true },
  { code: 'MONSOON15', type: 'percentage', value: 15, minOrder: 49900, maxDiscount: 20000, category: null, startsOn: '2026-07-01', endsOn: '2026-09-15', usageLimit: null, oncePerEmail: false, listed: true },
  { code: 'LIMITED5', type: 'flat', value: 10000, minOrder: null, maxDiscount: null, category: null, startsOn: null, endsOn: null, usageLimit: 5, oncePerEmail: false, listed: false },
];

module.exports = { SEED_PROMOS };
