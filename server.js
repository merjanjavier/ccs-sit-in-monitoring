const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const { dbHelpers } = require('./database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Root route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password, confirmPassword } = req.body;

    // Validation
    if (!idNumber || !lastname || !firstname || !courseLevel || !course || !address || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Check if user already exists
    const existingUserByIdNumber = await dbHelpers.getUserByIdNumber(idNumber);
    if (existingUserByIdNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Number already registered' 
      });
    }

    const existingUserByEmail = await dbHelpers.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      idNumber,
      lastname,
      firstname,
      middlename: middlename || '',
      courseLevel,
      course,
      address,
      email,
      password: hashedPassword
    };

    const result = await dbHelpers.createUser(userData);

    // Create notification for admin
    await dbHelpers.createAdminNotification(
      'registration',
      'New Student Registered',
      `${firstname} ${lastname} (${idNumber}) has registered an account.`
    );

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful',
      userId: result.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { idNumber, password } = req.body;

    // Validation
    if (!idNumber || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Number and password are required' 
      });
    }

    // Check if it's admin login
    if (idNumber === 'admin001') {
      const admin = await dbHelpers.getAdminByUsername(idNumber);
      
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid admin credentials' 
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid admin credentials' 
        });
      }

      // Generate JWT token for admin
      const token = jwt.sign(
        { 
          userId: admin.id, 
          username: admin.username,
          isAdmin: true
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      return res.json({ 
        success: true, 
        message: 'Admin login successful',
        token,
        isAdmin: true,
        user: {
          id: admin.id,
          username: admin.username
        }
      });
    }

    // Regular user login
    // Get user from database
    const user = await dbHelpers.getUserByIdNumber(idNumber);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ID Number or password' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ID Number or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        idNumber: user.id_number,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Return user data (without password)
    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      isAdmin: false,
      user: {
        id: user.id,
        idNumber: user.id_number,
        lastname: user.lastname,
        firstname: user.firstname,
        middlename: user.middlename,
        courseLevel: user.course_level,
        course: user.course,
        address: user.address,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get all users (for testing/admin purposes)
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbHelpers.getAllUsers();
    res.json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching users' 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Get user sit-in history
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const history = await dbHelpers.getUserSitInHistory(userId);
    res.json({ 
      success: true, 
      history 
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching history' 
    });
  }
});

// Submit feedback
app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sitInId, rating, comment } = req.body;
    
    if (!sitInId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sit-in ID and rating are required' 
      });
    }
    
    // Check if feedback already exists
    const exists = await dbHelpers.checkFeedbackExists(sitInId, userId);
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Feedback already submitted for this sit-in' 
      });
    }
    
    await dbHelpers.createFeedback(sitInId, userId, rating, comment);
    
    // Create notification for admin
    const user = await dbHelpers.getUserByIdNumber(req.user.idNumber);
    const userName = user ? `${user.firstname} ${user.lastname}` : 'A student';
    await dbHelpers.createAdminNotification(
      'feedback',
      'New Feedback Received',
      `${userName} has submitted new feedback with a rating of ${rating}/5.`
    );
    
    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error submitting feedback' 
    });
  }
});

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbHelpers.getUserByIdNumber(req.user.idNumber);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        idNumber: user.id_number,
        lastname: user.lastname,
        firstname: user.firstname,
        middlename: user.middlename,
        courseLevel: user.course_level,
        course: user.course,
        address: user.address,
        email: user.email,
        photo: user.photo,
        sessions: user.sessions || 30
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching profile' 
    });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstname, lastname, middlename, course, courseLevel, address, email, photo } = req.body;
    
    // Validation
    if (!firstname || !lastname || !course || !courseLevel || !address || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }

    const userId = req.user.userId;
    const result = await dbHelpers.updateUser(userId, {
      firstname,
      lastname,
      middlename: middlename || '',
      course,
      courseLevel,
      address,
      email,
      photo: photo || null
    });

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Create notification for admin
    await dbHelpers.createAdminNotification(
      'profile_update',
      'Student Profile Updated',
      `${firstname} ${lastname} has updated their profile information.`
    );

    res.json({ 
      success: true, 
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile' 
    });
  }
});

// Admin middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    req.user = user;
    next();
  });
};

// Get all announcements (public - for user profile)
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await dbHelpers.getAllAnnouncements();
    res.json({ 
      success: true, 
      announcements 
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching announcements' 
    });
  }
});

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await dbHelpers.getNotifications(userId);
    const unreadCount = await dbHelpers.getUnreadNotificationCount(userId);
    res.json({ 
      success: true, 
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching notifications' 
    });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;
    await dbHelpers.markNotificationAsRead(notificationId, userId);
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error marking notification as read' 
    });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await dbHelpers.markAllNotificationsAsRead(userId);
    res.json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error marking notifications as read' 
    });
  }
});

// Get user reservations
app.get('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const reservations = await dbHelpers.getReservations(userId);
    res.json({ 
      success: true, 
      reservations 
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching reservations' 
    });
  }
});

// Create a reservation
app.post('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lab, seatNumber, purpose, reservationDate, pcNumber } = req.body;
    
    if (!lab || !reservationDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lab and reservation date are required' 
      });
    }
    
    const result = await dbHelpers.createReservation(userId, lab, seatNumber, purpose, reservationDate, pcNumber || null);
    
    // Create notification for admin
    const user = await dbHelpers.getUserByIdNumber(req.user.idNumber);
    const userName = user ? `${user.firstname} ${user.lastname}` : 'A student';
    await dbHelpers.createAdminNotification(
      'reservation',
      'New Reservation',
      `${userName} has reserved a seat in Lab ${lab} for ${new Date(reservationDate).toLocaleDateString()}.`
    );
    
    res.json({ 
      success: true, 
      message: 'Reservation created successfully',
      reservationId: result.id
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating reservation: ' + error.message 
    });
  }
});

// Cancel a reservation
app.put('/api/reservations/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const reservationId = req.params.id;
    
    const result = await dbHelpers.cancelReservation(reservationId, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Reservation cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error cancelling reservation' 
    });
  }
});

// Get admin statistics
app.get('/api/admin/statistics', authenticateAdmin, async (req, res) => {
  try {
    const stats = await dbHelpers.getStatistics();
    res.json({ 
      success: true, 
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching statistics' 
    });
  }
});

// Get all announcements
app.get('/api/admin/announcements', authenticateAdmin, async (req, res) => {
  try {
    const announcements = await dbHelpers.getAllAnnouncements();
    res.json({ 
      success: true, 
      announcements 
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching announcements' 
    });
  }
});

// Create announcement (admin only)
app.post('/api/admin/announcements', authenticateAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }

    const result = await dbHelpers.createAnnouncement(title, content);

    // Notify all users about the new announcement
    const users = await dbHelpers.getAllUsers();
    for (const user of users) {
      await dbHelpers.createNotification(user.id, 'announcement', 'New Announcement', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    }

    res.status(201).json({ 
      success: true, 
      message: 'Announcement created successfully',
      announcementId: result.id
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating announcement' 
    });
  }
});

// Get all students (admin)
app.get('/api/admin/students', authenticateAdmin, async (req, res) => {
  try {
    const students = await dbHelpers.getAllStudents();
    res.json({ 
      success: true, 
      students 
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching students' 
    });
  }
});

// Get student by ID number (admin)
app.get('/api/admin/students/:idNumber', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber } = req.params;
    const student = await dbHelpers.getStudentByIdNumber(idNumber);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    res.json({ 
      success: true, 
      student 
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching student' 
    });
  }
});

// Create new student (admin)
app.post('/api/admin/students', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password } = req.body;

    if (!idNumber || !lastname || !firstname || !courseLevel || !course || !address || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await dbHelpers.getUserByIdNumber(idNumber);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ID Number already registered' });
    }

    const existingUserByEmail = await dbHelpers.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const defaultPassword = password || 'student123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const userData = {
      idNumber,
      lastname,
      firstname,
      middlename: middlename || '',
      courseLevel,
      course,
      address,
      email,
      password: hashedPassword
    };

    const result = await dbHelpers.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      userId: result.id
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Server error creating student' });
  }
});

// Update student (admin)
app.put('/api/admin/students/:idNumber', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber } = req.params;
    const { firstname, lastname, middlename, course, courseLevel, email, sessions } = req.body;

    // Get current student data to check if sessions changed
    const currentStudent = await dbHelpers.getStudentByIdNumber(idNumber);
    
    const result = await dbHelpers.updateStudent(idNumber, { firstname, lastname, middlename, course, courseLevel, email, sessions });

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Notify user if sessions were changed
    if (currentStudent && sessions !== undefined && sessions !== currentStudent.sessions) {
      await dbHelpers.createNotification(
        currentStudent.id, 
        'sessions_updated', 
        'Sessions Updated', 
        `Your sessions have been updated to ${sessions}.`
      );
    }

    res.json({ 
      success: true, 
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating student' 
    });
  }
});

// Delete student (admin)
app.delete('/api/admin/students/:idNumber', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber } = req.params;
    const result = await dbHelpers.deleteStudent(idNumber);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting student' 
    });
  }
});

// Reset all student sessions (admin)
app.post('/api/admin/students/reset-sessions', authenticateAdmin, async (req, res) => {
  try {
    const result = await dbHelpers.resetAllSessions();
    res.json({ 
      success: true, 
      message: 'All student sessions have been reset',
      affected: result.changes
    });
  } catch (error) {
    console.error('Error resetting sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error resetting sessions' 
    });
  }
});

// Create Sit-In record
app.post('/api/admin/sitin', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber, purpose, lab, pcNumber } = req.body;

    if (!idNumber || !purpose || !lab) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Number, Purpose, and Lab are required' 
      });
    }

    // Get student
    const student = await dbHelpers.getUserByIdNumber(idNumber);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Check if student has remaining sessions
    const sessions = student.sessions || 30;
    if (sessions <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No remaining sessions' 
      });
    }

    // Create sit-in record
    const result = await dbHelpers.createSitInRecord(student.id, purpose, lab, pcNumber);
    
    // Do NOT decrement session here - will decrement on logout
    // Session will be decremented when student logs out

    res.json({ 
      success: true, 
      message: 'Sit-In recorded successfully',
      remainingSessions: sessions
    });
  } catch (error) {
    console.error('Error creating sit-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating sit-in: ' + error.message 
    });
  }
});

// Get all sit-in records
app.get('/api/admin/sitin-records', authenticateAdmin, async (req, res) => {
  try {
    const records = await dbHelpers.getAllSitInRecords();
    res.json({ 
      success: true, 
      records 
    });
  } catch (error) {
    console.error('Error fetching sit-in records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching sit-in records' 
    });
  }
});

// Get current/active sit-in records
app.get('/api/admin/current-sitin', authenticateAdmin, async (req, res) => {
  try {
    const records = await dbHelpers.getCurrentSitInRecords();
    res.json({ 
      success: true, 
      records 
    });
  } catch (error) {
    console.error('Error fetching current sit-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching current sit-in' 
    });
  }
});

// Complete sit-in record
app.put('/api/admin/sitin-records/:id/complete', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbHelpers.completeSitInRecord(id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sit-in record not found' 
      });
    }

    // Get sit-in record details to notify the user
    const sitinRecord = await dbHelpers.getSitInRecordById(id);
    if (sitinRecord) {
      // Get user info for notification
      const users = await dbHelpers.getAllUsers();
      const user = users.find(u => u.id === sitinRecord.user_id);
      
      if (user) {
        await dbHelpers.createNotification(
          sitinRecord.user_id, 
          'sitin_completed', 
          'Sit-In Completed', 
          `Your sit-in session has been completed. You now have ${user.sessions - 1} sessions remaining.`
        );
      }
    }

    res.json({ 
      success: true, 
      message: 'Sit-in completed successfully'
    });
  } catch (error) {
    console.error('Error completing sit-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error completing sit-in' 
    });
  }
});

// Clear all sit-in records (reset for fresh start)
app.post('/api/admin/clear-records', authenticateAdmin, async (req, res) => {
  try {
    await dbHelpers.clearSitInRecords();
    res.json({ 
      success: true, 
      message: 'All sit-in records cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error clearing records' 
    });
  }
});

// Reset all student sessions to 30
app.post('/api/admin/reset-sessions', authenticateAdmin, async (req, res) => {
  try {
    await dbHelpers.resetAllSessions();
    res.json({ 
      success: true, 
      message: 'All student sessions reset to 30' 
    });
  } catch (error) {
    console.error('Error resetting sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error resetting sessions' 
    });
  }
});

// Get all feedback reports (admin)
app.get('/api/admin/feedback-reports', authenticateAdmin, async (req, res) => {
  try {
    const reports = await dbHelpers.getAllFeedbackReports();
    res.json({ 
      success: true, 
      reports 
    });
  } catch (error) {
    console.error('Error fetching feedback reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching feedback reports' 
    });
  }
});

// Start server
// Admin: Get all reservations
app.get('/api/admin/reservations', authenticateAdmin, async (req, res) => {
  try {
    const reservations = await dbHelpers.getAllReservations();
    res.json({ 
      success: true, 
      reservations 
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching reservations' 
    });
  }
});

// Admin: Update reservation status (approve/reject)
app.put('/api/admin/reservations/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status, pcNumber } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const result = await dbHelpers.updateReservationStatus(reservationId, status, pcNumber);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }
    
    // Get reservation details to notify the user
    const reservation = await dbHelpers.getReservationById(reservationId);
    
    let autoCheckedIn = false;
    let autoCheckInMessage = '';
    
    if (reservation) {
      // Create notification for the user
      const notifType = status === 'approved' ? 'reservation_approved' : 'reservation_rejected';
      const notifTitle = status === 'approved' ? 'Reservation Approved' : 'Reservation Rejected';
      const notifMessage = status === 'approved' 
        ? `Your reservation for Lab ${reservation.lab} on ${new Date(reservation.reservation_date).toLocaleDateString()} has been approved!`
        : `Your reservation for Lab ${reservation.lab} on ${new Date(reservation.reservation_date).toLocaleDateString()} has been rejected.`;
      
      await dbHelpers.createNotification(reservation.user_id, notifType, notifTitle, notifMessage);
      
        // Get today's date in Asia/Manila timezone (YYYY-MM-DD)
        const options = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(new Date());
        const y = parts.find(p => p.type === 'year').value;
        const m = parts.find(p => p.type === 'month').value;
        const d = parts.find(p => p.type === 'day').value;
        const todayStr = `${y}-${m}-${d}`;
        
        // Also get UTC date for today
        const utcDate = new Date();
        const utcy = utcDate.getUTCFullYear();
        const utcm = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
        const utcd = String(utcDate.getUTCDate()).padStart(2, '0');
        const utcTodayStr = `${utcy}-${utcm}-${utcd}`;
        
        let resDateStr = '';
        let resDateUTCStr = '';
        
        if (reservation.reservation_date) {
          const rDate = new Date(reservation.reservation_date);
          if (!isNaN(rDate.getTime())) {
            // Manila timezone
            try {
              const rParts = formatter.formatToParts(rDate);
              const ry = rParts.find(p => p.type === 'year').value;
              const rm = rParts.find(p => p.type === 'month').value;
              const rd = rParts.find(p => p.type === 'day').value;
              resDateStr = `${ry}-${rm}-${rd}`;
            } catch (e) {}
            
            // UTC timezone
            const rUtcy = rDate.getUTCFullYear();
            const rUtcm = String(rDate.getUTCMonth() + 1).padStart(2, '0');
            const rUtcd = String(rDate.getUTCDate()).padStart(2, '0');
            resDateUTCStr = `${rUtcy}-${rUtcm}-${rUtcd}`;
          }
        }
        
        // Direct string match if stored as simple string in database
        let directMatchStr = '';
        if (typeof reservation.reservation_date === 'string') {
          const match = reservation.reservation_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            directMatchStr = `${match[1]}-${match[2]}-${match[3]}`;
          }
        }
        
        const isToday = 
          (resDateStr && resDateStr === todayStr) || 
          (resDateUTCStr && resDateUTCStr === utcTodayStr) ||
          (directMatchStr && (directMatchStr === todayStr || directMatchStr === utcTodayStr));
        
        if (isToday) {
          try {
            // Get user details
            const student = await dbHelpers.getUserById(reservation.user_id);
            
            if (student) {
              const sessions = student.sessions || 30;
              if (sessions > 0) {
                await dbHelpers.createSitInRecord(student.id, reservation.purpose || 'Reservation', reservation.lab, pcNumber);
                autoCheckedIn = true;
                autoCheckInMessage = 'Student automatically checked-in for today\'s reservation.';
              } else {
                autoCheckInMessage = 'Could not auto check-in: Student has no remaining sessions.';
              }
            } else {
              autoCheckInMessage = 'Could not auto check-in: Student not found.';
            }
          } catch (sitinErr) {
            console.error('Error during auto sit-in creation:', sitinErr);
            autoCheckInMessage = 'Error during auto check-in: ' + sitinErr.message;
          }
        }
    }
    
    res.json({ 
      success: true, 
      message: `Reservation ${status} successfully`,
      autoCheckedIn,
      autoCheckInMessage
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating reservation' 
    });
  }
});

// Admin Notifications
app.get('/api/admin/notifications', authenticateAdmin, async (req, res) => {
  try {
    const notifications = await dbHelpers.getAdminNotifications();
    const unreadCount = await dbHelpers.getAdminUnreadNotificationCount();
    res.json({ 
      success: true, 
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching notifications' 
    });
  }
});

app.put('/api/admin/notifications/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    await dbHelpers.markAdminNotificationAsRead(notificationId);
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error marking notification as read' 
    });
  }
});

app.put('/api/admin/notifications/read-all', authenticateAdmin, async (req, res) => {
  try {
    await dbHelpers.markAllAdminNotificationsAsRead();
    res.json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error marking notifications as read' 
    });
  }
});

// Get Leaderboard data
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await dbHelpers.getLeaderboard();
    res.json({ 
      success: true, 
      leaderboard 
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching leaderboard' 
    });
  }
});

// Get PC status list for a lab and date
app.get('/api/pcs', authenticateToken, async (req, res) => {
  try {
    const { lab, date } = req.query;
    if (!lab || !date) {
      return res.status(400).json({ success: false, message: 'Lab and date are required' });
    }
    const pcs = await dbHelpers.getPcsStatus(lab, date);
    res.json({ success: true, pcs });
  } catch (error) {
    console.error('Error fetching PC status:', error);
    res.status(500).json({ success: false, message: 'Server error fetching PC status: ' + error.message });
  }
});

// Admin: Toggle PC status (enable/disable)
app.put('/api/admin/pcs/status', authenticateAdmin, async (req, res) => {
  try {
    const { lab, pcNumber, status } = req.body;
    if (!lab || !pcNumber || !status) {
      return res.status(400).json({ success: false, message: 'Lab, PC Number, and Status are required' });
    }
    if (!['enabled', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await dbHelpers.updatePcStatus(lab, pcNumber, status);
    res.json({ success: true, message: `PC status updated to ${status} successfully` });
  } catch (error) {
    console.error('Error updating PC status:', error);
    res.status(500).json({ success: false, message: 'Server error updating PC status' });
  }
});

// Get Dropdown Options (Public/Student)
app.get('/api/dropdowns/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const options = await dbHelpers.getDropdownOptions(category, true);
    res.json({ success: true, options });
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get all dropdown options
app.get('/api/admin/dropdowns', authenticateAdmin, async (req, res) => {
  try {
    const category = req.query.category;
    const options = await dbHelpers.getDropdownOptions(category, false);
    res.json({ success: true, options });
  } catch (error) {
    console.error('Error fetching admin dropdown options:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Add dropdown option
app.post('/api/admin/dropdowns', authenticateAdmin, async (req, res) => {
  try {
    const { category, value, metadata } = req.body;
    if (!category || !value) {
      return res.status(400).json({ success: false, message: 'Category and value are required' });
    }
    const result = await dbHelpers.addDropdownOption(category, value, metadata);
    res.status(201).json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error adding dropdown option:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Update dropdown option
app.put('/api/admin/dropdowns/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, is_active, metadata } = req.body;
    const result = await dbHelpers.updateDropdownOption(id, { value, is_active, metadata });
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error updating dropdown option:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Delete dropdown option
app.delete('/api/admin/dropdowns/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbHelpers.deleteDropdownOption(id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error deleting dropdown option:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
