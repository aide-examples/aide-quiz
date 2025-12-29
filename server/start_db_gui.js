const sqlite3 = require("sqlite3").verbose();
const { SqliteGuiNode } = require("sqlite-gui-node");

// Path to database file (relative from server directory)
const DB_PATH = "./data.sqlite";

// Port configurable via environment variable or default 3002
const PORT = process.env.DB_GUI_PORT || 3002;

// Open database with sqlite3 (GUI requires write access for metadata)
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    } else {
        console.log(`Successfully connected to ${DB_PATH}`);

        // Start GUI
        SqliteGuiNode(db, PORT)
            .then((server) => {
                console.log(`GUI started. Open: http://localhost:${PORT}/home`);
                console.log("NOTE: Server should be stopped to avoid DB conflicts");
                console.log("To exit: Press CTRL-C");
                
                // Graceful shutdown handler
                const shutdown = (signal) => {
                    console.log(`\n${signal} received - shutting down DB-GUI...`);

                    // Close HTTP server if available
                    if (server && server.close) {
                        server.close(() => {
                            console.log("HTTP Server closed");
                            closeAndExit();
                        });
                    } else {
                        closeAndExit();
                    }

                    // Force exit after 5 seconds
                    setTimeout(() => {
                        console.error("Timeout - forcing shutdown");
                        process.exit(1);
                    }, 5000);
                };
                
                const closeAndExit = () => {
                    // Close database
                    db.close((err) => {
                        if (err) {
                            console.error("Error closing database:", err.message);
                            process.exit(1);
                        } else {
                            console.log("Database closed");
                            console.log("DB-GUI cleanly shut down ✓");
                            process.exit(0);
                        }
                    });
                };
                
                // Listen for termination signals
                process.on('SIGTERM', () => shutdown('SIGTERM'));
                process.on('SIGINT', () => shutdown('SIGINT'));
            })
            .catch(err => {
                console.error("Error starting GUI:", err);
                db.close();
                process.exit(1);
            });
    }
});