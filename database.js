const { createClient } = require('@libsql/client');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:ccs_database.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

const db = {
  run: async (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const result = await client.execute({ sql, args: params || [] });
      if (callback) callback.call({ lastID: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : 0, changes: result.rowsAffected }, null);
    } catch (err) {
      if (callback) callback(err);
      else console.error('Database error:', err.message);
    }
  },
  get: async (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const result = await client.execute({ sql, args: params || [] });
      if (callback) callback(null, result.rows.length > 0 ? result.rows[0] : undefined);
    } catch (err) {
      if (callback) callback(err);
    }
  },
  all: async (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const result = await client.execute({ sql, args: params || [] });
      if (callback) callback(null, result.rows);
    } catch (err) {
      if (callback) callback(err);
    }
  },
  prepare: (sql) => {
    return {
      run: (param) => {
        client.execute({ sql, args: [param] }).catch(err => console.error(err));
      },
      finalize: () => {}
    };
  }
};

console.log('Connected to Turso/LibSQL database');
initializeDatabase();

// Initialize database tables
function initializeDatabase() {
  // Admin Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
  `, (err) => {
    if (err) {
      console.error('Error creating admin_notifications table:', err.message);
    } else {
      console.log('Admin notifications table ready');
    }
  });

  // Dynamic Dropdown Options table
  db.run(`
    CREATE TABLE IF NOT EXISTS dropdown_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL, -- e.g., 'lab', 'purpose', 'course'
      value TEXT NOT NULL,
      metadata TEXT, -- JSON string for extra info (like software for labs)
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
  `, (err) => {
    if (err) {
      console.error('Error creating dropdown_options table:', err.message);
    } else {
      console.log('Dropdown options table ready');
      
      // Seed initial labs if table is empty
      db.get("SELECT COUNT(*) as count FROM dropdown_options WHERE category = 'lab'", (err, row) => {
        if (!err && row.count === 0) {
          const labs = ['524', '526', '528', '530', '542', '544'];
          const stmt = db.prepare("INSERT INTO dropdown_options (category, value) VALUES ('lab', ?)");
          labs.forEach(lab => stmt.run(lab));
          stmt.finalize();
          console.log('Initial labs seeded');
        }
      });

      // Seed initial purposes if table is empty
      db.get("SELECT COUNT(*) as count FROM dropdown_options WHERE category = 'purpose'", (err, row) => {
        if (!err && row.count === 0) {
          const purposes = ['C Programming', 'C++', 'Java', 'Python', 'C#', 'ASP.Net', 'PHP', 'Other'];
          const stmt = db.prepare("INSERT INTO dropdown_options (category, value) VALUES ('purpose', ?)");
          purposes.forEach(purpose => stmt.run(purpose));
          stmt.finalize();
          console.log('Initial purposes seeded');
        }
      });

      // Seed initial courses if table is empty
      db.get("SELECT COUNT(*) as count FROM dropdown_options WHERE category = 'course'", (err, row) => {
        if (!err && row.count === 0) {
          const courses = [
            'Bachelor of Science in Computer Science (BSCS)',
            'Bachelor of Science in Information Technology (BSIT)',
            'Bachelor of Science in Artificial Intelligence (BSAI)',
            'Bachelor of Science in Information Systems (BSIS)',
            'Associate in Computer Technology (ACT)'
          ];
          const stmt = db.prepare("INSERT INTO dropdown_options (category, value) VALUES ('course', ?)");
          courses.forEach(course => stmt.run(course));
          stmt.finalize();
          console.log('Initial courses seeded');
        }
      });

      // Seed initial year levels if table is empty
      db.get("SELECT COUNT(*) as count FROM dropdown_options WHERE category = 'year_level'", (err, row) => {
        if (!err && row.count === 0) {
          const levels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
          const stmt = db.prepare("INSERT INTO dropdown_options (category, value) VALUES ('year_level', ?)");
          levels.forEach(level => stmt.run(level));
          stmt.finalize();
          console.log('Initial year levels seeded');
        }
      });
    }
  });

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_number TEXT UNIQUE NOT NULL,
      lastname TEXT NOT NULL,
      firstname TEXT NOT NULL,
      middlename TEXT,
      course_level TEXT NOT NULL,
      course TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready');
      // Add photo column if it doesn't exist (for existing databases)
      db.run(`ALTER TABLE users ADD COLUMN photo TEXT`, (err) => {
        if (err) {
          // Column might already exist
        }
      });
      // Add sessions column if it doesn't exist
      db.run(`ALTER TABLE users ADD COLUMN sessions INTEGER DEFAULT 30`, (err) => {
        if (err) {
          // Column might already exist
        }
      });
    }
  });

  // Admin table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating admin table:', err.message);
    } else {
      console.log('Admin table ready');
      // Insert default admin if not exists
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT OR IGNORE INTO admin (username, password) VALUES (?, ?)`, ['admin001', hashedPassword], (err) => {
        if (err) {
          console.error('Error inserting default admin:', err.message);
        } else {
          console.log('Default admin created');
        }
      });
    }
  });

  // Announcements table
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating announcements table:', err.message);
    } else {
      console.log('Announcements table ready');
    }
  });

  // Sit-in records table
  db.run(`
    CREATE TABLE IF NOT EXISTS sitin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      language TEXT NOT NULL,
      purpose TEXT,
      pc_number TEXT,
      time_in DATETIME DEFAULT (datetime('now', 'localtime')),
      time_out DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating sitin_records table:', err.message);
    } else {
      console.log('Sit-in records table ready');
      // Add created_at and pc_number columns if they don't exist (for existing databases)
      db.run('ALTER TABLE sitin_records ADD COLUMN created_at DATETIME', (err) => {});
      db.run('ALTER TABLE sitin_records ADD COLUMN pc_number TEXT', (err) => {});
    }
  });

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating notifications table:', err.message);
    } else {
      console.log('Notifications table ready');
    }
  });

  // Reservations table
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lab TEXT NOT NULL,
      seat_number TEXT,
      purpose TEXT,
      reservation_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating reservations table:', err.message);
    } else {
      console.log('Reservations table ready');
      // Add pc_number column if it doesn't exist
      db.run('ALTER TABLE reservations ADD COLUMN pc_number TEXT', (err) => {});
    }
  });

  // Feedback table
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sit_in_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (sit_in_id) REFERENCES sitin_records(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating feedback table:', err.message);
    } else {
      console.log('Feedback table ready');
    }
  });

  // PC statuses table
  db.run(`
    CREATE TABLE IF NOT EXISTS pcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab TEXT NOT NULL,
      pc_number TEXT NOT NULL,
      status TEXT DEFAULT 'enabled', -- 'enabled' or 'disabled'
      UNIQUE(lab, pc_number)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating pcs table:', err.message);
    } else {
      console.log('PCs status table ready');
    }
  });

}

// Database helper functions
const dbHelpers = {
  // Get user by ID number
  getUserByIdNumber: (idNumber) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id_number = ?', [idNumber], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by numeric ID
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create new user
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password } = userData;
      
      db.run(
        `INSERT INTO users (id_number, lastname, firstname, middlename, course_level, course, address, email, password, sessions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 30)`,
        [idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Get all users
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, id_number, lastname, firstname, middlename, course_level, course, address, email, sessions, created_at FROM users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get admin by username
  getAdminByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM admin WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get all announcements
  getAllAnnouncements: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM announcements ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Create announcement
  createAnnouncement: (title, content) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO announcements (title, content) VALUES (?, ?)',
        [title, content],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Get statistics
  getStatistics: () => {
    return new Promise((resolve, reject) => {
      // Get total users
      db.get('SELECT COUNT(*) as count FROM users', [], (err, userRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Get currently active sit-ins
        db.get("SELECT COUNT(*) as count FROM sitin_records WHERE status = 'active'", [], (err, activeRow) => {
          if (err) {
            reject(err);
            return;
          }

          // Get total sit-ins
          db.get('SELECT COUNT(*) as count FROM sitin_records', [], (err, totalRow) => {
            if (err) {
              reject(err);
              return;
            }

            // Get language statistics
            db.all("SELECT language, COUNT(*) as count FROM sitin_records GROUP BY language", [], (err, langRows) => {
              if (err) {
                reject(err);
                return;
              }

              resolve({
                totalUsers: userRow.count,
                currentlySitIn: activeRow.count,
                totalSitIn: totalRow.count,
                languageStats: langRows
              });
            });
          });
        });
      });
    });
  },

  // Update user profile
  updateUser: (userId, userData) => {
    return new Promise((resolve, reject) => {
      const { firstname, lastname, middlename, course, courseLevel, address, email, photo } = userData;
      
      db.run(
        `UPDATE users SET 
          firstname = ?, 
          lastname = ?, 
          middlename = ?, 
          course = ?, 
          course_level = ?, 
          address = ?, 
          email = ?, 
          photo = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [firstname, lastname, middlename, course, courseLevel, address, email, photo, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    });
  },

  // Get all students (for admin)
  getAllStudents: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, id_number, lastname, firstname, middlename, course_level as year, course, email, sessions, photo, created_at FROM users ORDER BY lastname, firstname', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get student by ID number
  getStudentByIdNumber: (idNumber) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, id_number, lastname, firstname, middlename, course_level as year, course, address, email, sessions, photo, created_at FROM users WHERE id_number = ?', [idNumber], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Update student
  updateStudent: (idNumber, studentData) => {
    return new Promise((resolve, reject) => {
      const { firstname, lastname, middlename, course, courseLevel, email, sessions } = studentData;
      
      db.run(
        `UPDATE users SET 
          firstname = ?, 
          lastname = ?, 
          middlename = ?, 
          course = ?, 
          course_level = ?, 
          email = ?, 
          sessions = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id_number = ?`,
        [firstname, lastname, middlename, course, courseLevel, email, sessions, idNumber],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    });
  },

  // Delete student (including all cascade associations)
  deleteStudent: (idNumber) => {
    return new Promise((resolve, reject) => {
      // 1. Get user's ID
      db.get('SELECT id FROM users WHERE id_number = ?', [idNumber], (err, user) => {
        if (err) {
          return reject(err);
        }
        if (!user) {
          return resolve({ changes: 0 });
        }
        
        const userId = user.id;
        
        // 2. Cascade delete dependent records sequentially using callbacks (since the custom wrapper has no db.serialize)
        db.run('DELETE FROM feedback WHERE user_id = ?', [userId], (err) => {
          if (err) return reject(err);
          
          db.run('DELETE FROM notifications WHERE user_id = ?', [userId], (err) => {
            if (err) return reject(err);
            
            db.run('DELETE FROM reservations WHERE user_id = ?', [userId], (err) => {
              if (err) return reject(err);
              
              db.run('DELETE FROM sitin_records WHERE user_id = ?', [userId], (err) => {
                if (err) return reject(err);
                
                // 3. Delete the user
                db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
                  if (err) reject(err);
                  else resolve({ changes: this ? this.changes : 1 });
                });
              });
            });
          });
        });
      });
    });
  },

  // Reset all student sessions
  resetAllSessions: () => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET sessions = 30', function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Create Sit-In record
  createSitInRecord: (userId, purpose, lab, pcNumber = null) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO sitin_records (user_id, language, purpose, pc_number, status, time_in, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
        [userId, purpose, lab, pcNumber, 'active'],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Get sit-in record by ID
  getSitInRecordById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM sitin_records WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Update student sessions
  updateStudentSessions: (idNumber, sessions) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET sessions = ?, updated_at = CURRENT_TIMESTAMP WHERE id_number = ?',
        [sessions, idNumber],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

// Get all sit-in records
  getAllSitInRecords: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          u.id_number,
          u.firstname,
          u.lastname,
          s.language as purpose,
          s.purpose as lab,
          s.pc_number,
          s.time_in as timeIn,
          s.time_out as timeOut,
          s.created_at as createdAt,
          s.status
        FROM sitin_records s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.id DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else {
          // Transform data for display
          const records = rows.map(row => ({
            id: row.id,
            id_number: row.id_number,
            name: `${row.firstname} ${row.lastname}`,
            purpose: row.purpose,
            lab: row.lab,
            pc_number: row.pc_number,
            login_time: row.timeIn,
            logout_time: row.timeOut,
            created_at: row.createdAt,
            status: row.status
          }));
          resolve(records);
        }
      });
    });
  },

  // Get current/active sit-in records
  getCurrentSitInRecords: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          u.id_number,
          u.firstname,
          u.lastname,
          s.language as purpose,
          s.purpose as lab,
          s.pc_number,
          s.time_in as timeIn,
          s.status,
          u.sessions
        FROM sitin_records s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
        ORDER BY s.id DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else {
          const records = rows.map(row => ({
            id: row.id,
            id_number: row.id_number,
            name: `${row.firstname} ${row.lastname}`,
            purpose: row.purpose,
            lab: row.lab,
            pc_number: row.pc_number,
            timeIn: row.timeIn,
            status: row.status,
            session: row.sessions || 30
          }));
          resolve(records);
        }
      });
    });
  },

  // Complete sit-in record and decrement session
  completeSitInRecord: (id) => {
    return new Promise((resolve, reject) => {
      // First get the user id from the sitin record
      db.get('SELECT user_id FROM sitin_records WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        if (!row) {
          resolve({ changes: 0 });
          return;
        }
        
        // Update sitin record status
        db.run(
          `UPDATE sitin_records SET status = 'completed', time_out = datetime('now', 'localtime') WHERE id = ?`,
          [id],
          function(err) {
            if (err) reject(err);
            
            // Decrement user session
            db.run(
              "UPDATE users SET sessions = sessions - 1, updated_at = datetime('now', 'localtime') WHERE id = ?",
              [row.user_id],
              function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
              }
            );
          }
        );
      });
    });
  },

  // Clear all sit-in records (for fresh start)
  clearSitInRecords: () => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM sitin_records', [], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Decrement student session by 1 (on logout)
  decrementSession: (idNumber) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET sessions = sessions - 1, updated_at = CURRENT_TIMESTAMP WHERE id_number = ?',
        [idNumber],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // Reset all user sessions to 30
  resetAllSessions: () => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET sessions = 30', [], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Get notifications for a user
  getNotifications: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get unread notification count
  getUnreadNotificationCount: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ? AND is_read = 0
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  },

  // Mark notification as read
  markNotificationAsRead: (notificationId, userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: (userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // Create a notification
  createNotification: (userId, type, title, message) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [userId, type, title, message],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Get reservations for a user
  getReservations: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM reservations 
        WHERE user_id = ? 
        ORDER BY reservation_date DESC, created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Create a reservation
  createReservation: (userId, lab, seatNumber, purpose, reservationDate, pcNumber = null) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO reservations (user_id, lab, seat_number, purpose, reservation_date, status, pc_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, lab, seatNumber, purpose, reservationDate, 'pending', pcNumber],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Cancel a reservation
  cancelReservation: (reservationId, userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE reservations SET status = ? WHERE id = ? AND user_id = ?',
        ['cancelled', reservationId, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // Admin: Get all reservations
  getAllReservations: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT r.*, u.id_number, u.firstname, u.lastname, u.middlename 
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.reservation_date DESC, r.created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Admin: Update reservation status
  updateReservationStatus: (reservationId, status, pcNumber = null) => {
    return new Promise((resolve, reject) => {
      const query = pcNumber 
        ? 'UPDATE reservations SET status = ?, pc_number = ? WHERE id = ?'
        : 'UPDATE reservations SET status = ? WHERE id = ?';
      const params = pcNumber ? [status, pcNumber, reservationId] : [status, reservationId];
      
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Get a single reservation by ID
  getReservationById: (reservationId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM reservations WHERE id = ?',
        [reservationId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Get user sit-in history
  getUserSitInHistory: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          u.id_number,
          u.firstname,
          u.lastname,
          s.language as purpose,
          s.purpose as lab,
          s.pc_number,
          s.time_in as loginTime,
          s.time_out as logoutTime,
          s.created_at as date,
          s.status
        FROM sitin_records s
        JOIN users u ON s.user_id = u.id
        WHERE u.id = ?
        ORDER BY s.created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else {
          const records = rows.map(row => ({
            id: row.id,
            id_number: row.id_number,
            name: `${row.firstname} ${row.lastname}`,
            purpose: row.purpose,
            lab: row.lab,
            pc_number: row.pc_number,
            login_time: row.loginTime,
            logout_time: row.logoutTime,
            date: row.date,
            status: row.status
          }));
          resolve(records);
        }
      });
    });
  },

  // Create feedback
  createFeedback: (sitInId, userId, rating, comment) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO feedback (sit_in_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [sitInId, userId, rating, comment],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Check if feedback already exists for a sit-in
  checkFeedbackExists: (sitInId, userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM feedback WHERE sit_in_id = ? AND user_id = ?',
        [sitInId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  },

  // Get all feedback reports for admin
  getAllFeedbackReports: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          f.id,
          u.firstname || ' ' || u.lastname as student_name,
          s.purpose as lab,
          s.language as purpose,
          f.rating,
          f.comment,
          f.created_at as date
        FROM feedback f
        JOIN users u ON f.user_id = u.id
        JOIN sitin_records s ON f.sit_in_id = s.id
        ORDER BY f.created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getLeaderboard: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.id_number, u.firstname, u.lastname, u.middlename, u.course, u.course_level, u.photo,
               COUNT(s.id) as total_sessions,
               COALESCE(SUM(CASE 
                 WHEN s.time_in IS NOT NULL AND s.time_out IS NOT NULL 
                 THEN (strftime('%s', s.time_out) - strftime('%s', s.time_in)) / 60
                 ELSE 0 
               END), 0) as total_minutes
        FROM users u
        LEFT JOIN sitin_records s ON u.id = s.user_id
        GROUP BY u.id
        ORDER BY total_minutes DESC, total_sessions DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) {
          console.error('Leaderboard query error:', err);
          reject(err);
        } else {
          console.log('Leaderboard rows found:', rows.length);
          resolve(rows);
        }
      });
    });
  },

  // Admin: Get notifications
  getAdminNotifications: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM admin_notifications 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Admin: Get unread notification count
  getAdminUnreadNotificationCount: () => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM admin_notifications 
        WHERE is_read = 0
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
  },

  // Admin: Mark notification as read
  markAdminNotificationAsRead: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE admin_notifications SET is_read = 1 WHERE id = ?',
        [notificationId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // Admin: Mark all notifications as read
  markAllAdminNotificationsAsRead: () => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE admin_notifications SET is_read = 1',
        [],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // Admin: Create a notification
  createAdminNotification: (type, title, message) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO admin_notifications (type, title, message) VALUES (?, ?, ?)',
        [type, title, message],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Dropdown Management
  getDropdownOptions: (category, onlyActive = true) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM dropdown_options';
      const params = [];
      
      if (category) {
        query += ' WHERE category = ?';
        params.push(category);
        if (onlyActive) query += ' AND is_active = 1';
      } else if (onlyActive) {
        query += ' WHERE is_active = 1';
      }
      
      query += ' ORDER BY category, value';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  addDropdownOption: (category, value, metadata = null) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO dropdown_options (category, value, metadata) VALUES (?, ?, ?)',
        [category, value, metadata],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  updateDropdownOption: (id, data) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const params = [];
      
      if (data.value !== undefined) {
        fields.push('value = ?');
        params.push(data.value);
      }
      if (data.is_active !== undefined) {
        fields.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
      }
      if (data.metadata !== undefined) {
        fields.push('metadata = ?');
        params.push(data.metadata);
      }
      
      if (fields.length === 0) return resolve({ changes: 0 });
      
      params.push(id);
      db.run(
        `UPDATE dropdown_options SET ${fields.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  deleteDropdownOption: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM dropdown_options WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  updatePcStatus: (lab, pcNumber, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO pcs (lab, pc_number, status) VALUES (?, ?, ?) ON CONFLICT(lab, pc_number) DO UPDATE SET status = excluded.status',
        [lab, pcNumber, status],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  getPcsStatus: (lab, date) => {
    return new Promise(async (resolve, reject) => {
      try {
        const disabledPcs = await new Promise((res, rej) => {
          db.all("SELECT pc_number FROM pcs WHERE lab = ? AND status = 'disabled'", [lab], (err, rows) => {
            if (err) rej(err);
            else res(rows ? rows.map(r => r.pc_number) : []);
          });
        });

        const reservedPcs = await new Promise((res, rej) => {
          db.all("SELECT pc_number FROM reservations WHERE lab = ? AND (reservation_date = ? OR reservation_date LIKE ?) AND status = 'approved' AND pc_number IS NOT NULL", [lab, date, `${date}%`], (err, rows) => {
            if (err) rej(err);
            else res(rows ? rows.map(r => r.pc_number) : []);
          });
        });

        let activeSitInPcs = [];
        const options = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(new Date());
        const y = parts.find(p => p.type === 'year').value;
        const m = parts.find(p => p.type === 'month').value;
        const d = parts.find(p => p.type === 'day').value;
        const todayStr = `${y}-${m}-${d}`;
        
        const utcDate = new Date();
        const utcy = utcDate.getUTCFullYear();
        const utcm = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
        const utcd = String(utcDate.getUTCDate()).padStart(2, '0');
        const utcTodayStr = `${utcy}-${utcm}-${utcd}`;

        if (date === todayStr || date === utcTodayStr) {
          activeSitInPcs = await new Promise((res, rej) => {
            db.all("SELECT pc_number FROM sitin_records WHERE purpose = ? AND status = 'active' AND pc_number IS NOT NULL", [lab], (err, rows) => {
              if (err) rej(err);
              else res(rows ? rows.map(r => r.pc_number) : []);
            });
          });
        }

        const pcsList = [];
        for (let i = 1; i <= 50; i++) {
          const pcNum = `PC-${String(i).padStart(2, '0')}`;
          let status = 'available';
          if (disabledPcs.includes(pcNum)) {
            status = 'disabled';
          } else if (reservedPcs.includes(pcNum) || activeSitInPcs.includes(pcNum)) {
            status = 'occupied';
          }
          pcsList.push({ pc_number: pcNum, status });
        }
        resolve(pcsList);
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = { db, dbHelpers };
