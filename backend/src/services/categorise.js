const db = require('../db/index');

async function categorise(description, merchantName) {
  const text = `${description || ''} ${merchantName || ''}`.toLowerCase();
  const rules = await db.query('SELECT pattern, category FROM category_rules');
  for (const rule of rules) {
    if (text.includes(rule.pattern.toLowerCase())) return rule.category;
  }
  return 'Uncategorised';
}

module.exports = { categorise };
