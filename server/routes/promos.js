const express = require('express');
const { parseItems } = require('./orders');
const { appliedMessage, quotePromo } = require('../promos/calculate');
const { describePromo, promoView } = require('../promos/describe');
const { CODE_RE, normalizeCode, promoErrorBody, usesOf, validatePromo } = require('../promos/validate');

const router = express.Router();

router.get('/', (req, res) => {
  const { store, clock } = req.app.locals;
  const now = clock.now();
  res.json({ promos: store.promos.filter((p) => p.listed).map((p) => promoView(p, now, usesOf(store, p.code))) });
});

router.get('/:code', (req, res) => {
  const { store, clock } = req.app.locals;
  const code = normalizeCode(req.params.code);
  if (!CODE_RE.test(code)) return res.status(400).json({ errorCode: 'PROMO_INVALID_FORMAT', message: 'Promo codes contain only letters and numbers.' });
  const promo = store.promos.find((p) => p.code === code);
  if (!promo) return res.status(404).json({ errorCode: 'PROMO_NOT_FOUND', message: `We couldn't find the code ${code}.` });
  res.json(promoView(promo, clock.now(), usesOf(store, code)));
});

router.post('/apply', (req, res) => {
  const { store, clock } = req.app.locals;
  const { code, items: rawItems, email } = req.body || {};

  let items = [];
  if (!(Array.isArray(rawItems) && rawItems.length === 0)) {
    const parsed = parseItems(rawItems, store.products);
    if (parsed.error) {
      const { status, error, productId } = parsed;
      return res.status(status).json(productId ? { error, productId } : { error });
    }
    items = parsed.items;
  }

  const result = validatePromo({ store, now: clock.now(), rawCode: code, items, email: typeof email === 'string' ? email.trim() : undefined });
  if (!result.ok) return res.status(result.status).json(promoErrorBody(result));

  const quote = quotePromo(result.promo, items);
  res.json({
    code: result.code,
    type: result.promo.type,
    shortBenefit: describePromo(result.promo).shortBenefit,
    subtotal: quote.subtotal,
    discount: quote.discount,
    shipping: quote.shipping,
    total: quote.total,
    savings: quote.savings,
    message: appliedMessage(result.code, result.promo, quote),
  });
});

module.exports = router;
