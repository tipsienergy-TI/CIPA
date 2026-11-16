// Uso:  npm run hash -- "SuaSenhaForte"
const bcrypt = require("bcryptjs");

const pwd = process.argv[2];
if (!pwd) {
  console.error('Uso: npm run hash -- "SuaSenhaForte"');
  process.exit(1);
}

const hash = bcrypt.hashSync(pwd, 12);
console.log("\n✔ Hash gerado.\n");
console.log("Vercel (Settings > Environment Variables) — cole EXATAMENTE assim:");
console.log(hash);
console.log("\n.env.local — com cada $ escapado como \\$ :");
console.log(hash.replace(/\$/g, "\\$"));
console.log("");
