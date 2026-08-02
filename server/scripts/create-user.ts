import { pool } from "../db";
import { storage } from "../storage";
import { hashPassword } from "../passwords";

async function main() {
  const [, , email, senha, ...nomeParts] = process.argv;
  const name = nomeParts.join(" ").trim();

  if (!email || !senha || !name) {
    console.error("Uso: npx tsx server/scripts/create-user.ts <email> <senha> <nome completo>");
    await pool.end();
    process.exit(1);
  }

  const emailNormalizado = email.trim().toLowerCase();
  const existente = await storage.getUserByEmail(emailNormalizado);
  if (existente) {
    console.error(`Ja existe usuario com email ${emailNormalizado}.`);
    await pool.end();
    process.exit(1);
  }

  const passwordHash = await hashPassword(senha);
  const user = await storage.createUser({ email: emailNormalizado, passwordHash, name });

  console.log(`Usuario criado: id=${user.id} email=${user.email} name=${user.name}`);
  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
