const sql = require('./src/lib/db.js');

sql`
  SELECT u.name, u.email, u.role, COUNT(g.id) as guests_created
  FROM users u 
  LEFT JOIN guests g ON g.created_by = u.id 
  WHERE u.role IN ('admin', 'organizer')
  GROUP BY u.id, u.name, u.email, u.role
  ORDER BY guests_created DESC
`.then(console.log);
