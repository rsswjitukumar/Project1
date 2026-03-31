const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportToSQL() {
  console.log("Starting Database Backup to SQL...");
  let sql = "-- SkillSpin Arena Database Export\n";
  sql += "-- Generated on: " + new Date().toISOString() + "\n\n";

  try {
    // 1. Export Users
    const users = await prisma.user.findMany();
    sql += "-- Table: User\n";
    users.forEach(u => {
      sql += `INSERT INTO User (id, username, phone, password, name, role, walletBalance, totalWinnings, referredBy, referralEarnings, createdAt) VALUES ('${u.id}', ${u.username ? `'${u.username}'` : 'NULL'}, '${u.phone}', '${u.password}', ${u.name ? `'${u.name}'` : 'NULL'}, '${u.role}', ${u.walletBalance}, ${u.totalWinnings}, ${u.referredBy ? `'${u.referredBy}'` : 'NULL'}, ${u.referralEarnings}, '${u.createdAt.toISOString()}');\n`;
    });
    sql += "\n";

    // 2. Export Transactions
    const txs = await prisma.transaction.findMany();
    sql += "-- Table: Transaction\n";
    txs.forEach(t => {
      sql += `INSERT INTO Transaction (id, amount, type, status, gateway, orderId, userId, createdAt) VALUES ('${t.id}', ${t.amount}, '${t.type}', '${t.status}', '${t.gateway}', ${t.orderId ? `'${t.orderId}'` : 'NULL'}, '${t.userId}', '${t.createdAt.toISOString()}');\n`;
    });
    sql += "\n";

    // 3. Export Matches
    const matches = await prisma.match.findMany();
    sql += "-- Table: Match\n";
    matches.forEach(m => {
      sql += `INSERT INTO Match (id, entryFee, status, player1Id, player2Id, winnerId, createdAt, updatedAt, gameState) VALUES ('${m.id}', ${m.entryFee}, '${m.status}', '${m.player1Id}', ${m.player2Id ? `'${m.player2Id}'` : 'NULL'}, ${m.winnerId ? `'${m.winnerId}'` : 'NULL'}, '${m.createdAt.toISOString()}', '${m.updatedAt.toISOString()}', '${m.gameState.replace(/'/g, "''")}');\n`;
    });
    sql += "\n";

    // 4. Export Otps
    const otps = await prisma.otp.findMany();
    sql += "-- Table: Otp\n";
    otps.forEach(o => {
      sql += `INSERT INTO Otp (id, phone, code, expiresAt, isUsed, createdAt, userId) VALUES ('${o.id}', '${o.phone}', '${o.code}', '${o.expiresAt.toISOString()}', ${o.isUsed ? 1 : 0}, '${o.createdAt.toISOString()}', ${o.userId ? `'${o.userId}'` : 'NULL'});\n`;
    });

    fs.writeFileSync('database_backup.sql', sql);
    console.log("SUCCESS! Database exported to: database_backup.sql");
  } catch (error) {
    console.error("Export Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportToSQL();
