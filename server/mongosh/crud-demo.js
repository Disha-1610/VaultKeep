// Run:  docker exec -i vaultkeeper-mongo mongosh < server/mongosh/crud-demo.js
//  or inside mongosh:  load("server/mongosh/crud-demo.js")
// Uses demo-only documents ("auth-demo", "demo-site") so your real vault is untouched.

db = db.getSiblingDB("passwordManagerDB");

print("\n=== CREATE collections ===");
["auth", "passwords"].forEach((name) => {
  if (!db.getCollectionNames().includes(name)) db.createCollection(name);
});
db.getCollection("auth").createIndex({ type: 1 }, { unique: true });
db.passwords.createIndex({ sourceKey: 1 }, { unique: true });
printjson(db.getCollectionNames());

print("\n=== CREATE (insert) ===");
// sample bcrypt-shaped hash for demo only (never a plain-text password)
db.getCollection("auth").insertOne({
  type: "auth-demo",
  hash: "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234",
  saltRounds: 12,
});
db.passwords.insertMany([
  { source: "Demo-Site", sourceKey: "demo-site", username: "demo@mail.com", password: "aa11:bb22:cc33" },
  { source: "Demo-App", sourceKey: "demo-app", username: "demo_user", password: "dd44:ee55:ff66" },
]);

print("\n=== READ ===");
printjson(db.getCollection("auth").find({ type: "auth-demo" }).toArray());
printjson(db.passwords.find({ sourceKey: /^demo-/ }, { _id: 0 }).toArray());
print("Total passwords:", db.passwords.countDocuments());

print("\n=== UPDATE ===");
db.getCollection("auth").updateOne({ type: "auth-demo" }, { $set: { saltRounds: 10 } });
db.passwords.updateOne({ sourceKey: "demo-site" }, { $set: { username: "updated@mail.com" } });
printjson(db.passwords.findOne({ sourceKey: "demo-site" }, { _id: 0 }));

print("\n=== DELETE ===");
db.getCollection("auth").deleteOne({ type: "auth-demo" });
db.passwords.deleteMany({ sourceKey: /^demo-/ });
print("Remaining passwords:", db.passwords.countDocuments());
