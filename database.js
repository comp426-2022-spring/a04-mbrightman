// look on website for sqlite3 resources
const database = require('better-sqlite3')

const logdb = new database('log.db')

// look to see if the db already exists, if it doesn't then create new one
const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get(); // get() gives one row | more db interactions in documentation (all() gives all rows)

if (row === undefined) {
    // create db
    console.log('Log database appears to be empty. Creating log database...')

    const sqlInit = `
        CREATE TABLE accesslog ( id INTEGER PRIMARY KEY,
                              remoteaddr VARCHAR, 
                              remoteuser VARCHAR, 
                              time NUMERIC, 
                              method VARCHAR, 
                              url VARCHAR, 
                              protocol VARCHAR,
                              httpversion NUMERIC, 
                              status INTEGER,
                              referer VARCHAR, 
                              useragent TEVARCHARXT )
    `
    logdb.exec(sqlInit)
} else {
    // db exists
    console.log('Log database exists.')
}

module.exports = logdb