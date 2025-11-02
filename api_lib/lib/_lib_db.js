// Lightweight in-memory store (swap to SQLite/Postgres later easily)
const store = {
  profiles: new Map(), // userId -> { userId, traits, interests[] }
  answers: new Map(),  // userId -> { userId, quiz: { q1:..., q2:... } }
};

module.exports = {
  upsertProfile(user) {
    store.profiles.set(user.userId, user);
    return user;
  },
  getProfile(userId) {
    return store.profiles.get(userId) || null;
  },
  allProfiles() {
    return [...store.profiles.values()];
  },

  saveAnswers(payload) {
    store.answers.set(payload.userId, payload);
    return payload;
  },
  getAnswers(userId) {
    return store.answers.get(userId) || null;
  },
  allAnswers() {
    return [...store.answers.values()];
  },
};
