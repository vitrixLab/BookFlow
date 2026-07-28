// manual_scripts/add-chat-interactions-table.js
const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('out.db');
  const db = new SQL.Database(buffer);

  // Ensure table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      source TEXT NOT NULL,
      user_id INTEGER,
      role TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // Check if table is empty
  const countRow = db.exec('SELECT COUNT(*) as cnt FROM chat_interactions');
  const isEmpty =
    countRow.length === 0 ||
    countRow[0].values[0][0] === 0;

  if (isEmpty) {
    console.log('Inserting demo chat interactions...');

    const demos = [
      {
        question: 'How many appointments today?',
        answer: 'You have 7 appointment(s) today.',
        source: 'live_data',
        userId: 1,
        role: 'ADMIN',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        question: 'Who is my next client?',
        answer:
          'Your next appointment is “Haircut” with Emily on Thu, 2:00 PM.',
        source: 'live_data',
        userId: 3,
        role: 'EMPLOYEE',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
      {
        question: 'Show my bookings this week',
        answer:
          'Your upcoming bookings:\n• Massage with Lisa on Wed, 11:00 AM (CONFIRMED)\n• Manicure with Tom on Fri, 3:30 PM (PENDING)',
        source: 'live_data',
        userId: 5,
        role: 'CLIENT',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        question: 'How to add a service?',
        answer:
          'Go to Admin > Services, use the Add Service form, enter name and description, then click Add Service.',
        source: 'knowledge_base',
        userId: 2,
        role: 'ADMIN',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        question: 'What is BookFlow?',
        answer:
          'BookFlow is a smart appointment scheduling and workflow management tool for service businesses.',
        source: 'knowledge_base',
        userId: null,
        role: null,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        question: 'How does the reminder system work?',
        answer:
          'Reminders are sent via email and SMS 24 hours before the appointment. You can configure them in Settings > Notifications.',
        source: 'nvidia_llm',
        userId: 4,
        role: 'EMPLOYEE',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        question: 'Can I integrate with Google Calendar?',
        answer:
          'Yes, you can sync your BookFlow calendar with Google Calendar via the Integrations page.',
        source: 'nvidia_llm',
        userId: 1,
        role: 'ADMIN',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        question: 'Where can I change my business hours?',
        answer:
          'I couldn’t find relevant documentation to answer that.',
        source: 'fallback',
        userId: 2,
        role: 'ADMIN',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        question: 'Why did my appointment disappear?',
        answer:
          'I’m not sure about that. Could you rephrase or ask something about BookFlow?',
        source: 'fallback',
        userId: 5,
        role: 'CLIENT',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const stmt = db.prepare(
      `INSERT INTO chat_interactions (question, answer, source, user_id, role, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const d of demos) {
      stmt.run([d.question, d.answer, d.source, d.userId, d.role, d.timestamp]);
    }
    stmt.free();

    console.log(`✅ Inserted ${demos.length} demo interactions.`);
  } else {
    console.log('ℹ️  chat_interactions table already contains data – skipping demo insert.');
  }

  // Write back
  fs.writeFileSync('out.db', Buffer.from(db.export()));
  db.close();

  console.log('✅ chat_interactions table is ready.');
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});