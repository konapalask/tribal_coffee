// app.cjs
// CommonJS Entrypoint wrapper for Phusion Passenger Node.js on cPanel
// Boots the ES Module server.js dynamically to avoid ERR_REQUIRE_ESM

import('./server.js').catch(err => {
    console.error("Passenger ES Module Bootstrap Failed:", err);
});
