const db = require('../db/index');

function categorise(description, merchantName) {
  const text = `${description || ''} ${merchantName || ''}`.toLowerCase();
  const rules = db.prepare('SELECT pattern, category FROM category_rules').all();
  for (const rule of rules) {
    if (text.includes(rule.pattern.toLowerCase())) return rule.category;
  }
  return 'Uncategorised';
}

module.exports = { categorise };
