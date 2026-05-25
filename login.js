// Client-side JavaScript for login

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('.Login form');
  const loginButton = document.querySelector('.Login .btn button');

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleLogin();
    });
  } else if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
  }

  // Mobile menu toggle
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const links = document.querySelector('.links');
  if (menuToggle && links) {
    menuToggle.addEventListener('click', function() {
      links.classList.toggle('active');
    });
  }

  // Check if user is already logged in
  const token = localStorage.getItem('authToken');
  if (token) {
    // Optionally verify token is still valid
    verifyToken(token);
  }
});

async function verifyToken(token) {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Token is valid, user is already logged in
      // Optionally redirect to dashboard or home
      console.log('User already logged in');
    } else {
      // Token is invalid, remove it
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  } catch (error) {
    console.error('Token verification error:', error);
  }
}

async function handleLogin() {
  // Get form values
  const idNumber = document.getElementById('idnumber').value.trim();
  const password = document.getElementById('password').value;

  // Validation
  if (!idNumber || !password) {
    alert('Please enter both ID Number and password');
    return;
  }

  // Prepare data
  const loginData = {
    idNumber,
    password
  };

  try {
    // Show loading state
    const loginButton = document.querySelector('.Login .btn button');
    const originalText = loginButton.textContent;
    loginButton.textContent = 'Logging in...';
    loginButton.disabled = true;

    // Send login request
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    // Reset button state
    loginButton.textContent = originalText;
    loginButton.disabled = false;

    if (data.success) {
      // Store token and user data
      localStorage.setItem('authToken', data.token);
      
      // Preserve photo from previous login if exists
      const previousUserData = localStorage.getItem('userData');
      let previousPhoto = null;
      if (previousUserData) {
        const parsed = JSON.parse(previousUserData);
        previousPhoto = parsed.photo;
      }
      
      // Merge new user data with previous photo if exists
      const userData = { ...data.user };
      if (previousPhoto) {
        userData.photo = previousPhoto;
      }
      
      localStorage.setItem('userData', JSON.stringify(userData));

      // Check if admin login
      if (data.isAdmin) {
        alert('Welcome, Admin!');
        // Redirect to admin page
        window.location.href = 'admin.html';
      } else {
        alert(`Welcome back, ${data.user.firstname}!`);
        // Redirect to profile page
        window.location.href = 'Profile.html';
      }
    } else {
      alert(data.message || 'Login failed. Please check your credentials.');
    }

  } catch (error) {
    console.error('Login error:', error);
    alert('Unable to connect to server. Please make sure the server is running.');
    
    // Reset button state
    const loginButton = document.querySelector('.Login .btn button');
    loginButton.textContent = 'Login';
    loginButton.disabled = false;
  }
}

// Function to logout (can be called from other pages)
function logout() {
  // Save user data before clearing (to preserve photo and other settings)
  const userData = localStorage.getItem('userData');
  
  // Clear authentication token
  localStorage.removeItem('authToken');
  
  // Keep userData for next login (photo will persist)
  // But redirect to login page
  window.location.href = 'Login.html';
}

// Function to get current user (can be called from other pages)
function getCurrentUser() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// Function to check if user is authenticated (can be called from other pages)
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null;
}
