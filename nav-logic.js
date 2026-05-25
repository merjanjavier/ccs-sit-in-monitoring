// Shared Navigation Logic for Notifications and Logout

document.addEventListener('DOMContentLoaded', function() {
  // Setup notification dropdown
  setupNotificationDropdown();

  // Setup logout button
  setupLogoutButton();

  // Setup mobile menu toggle
  setupMobileMenu();

  // Load initial notifications
  loadUserNotifications();
  // Poll for notifications every 30 seconds
  setInterval(loadUserNotifications, 30000);
});

// Setup notification dropdown toggle
function setupNotificationDropdown() {
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('show');
      }
    });
  }

  // Mark all as read button
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
  }
}

// Load user notifications from server
async function loadUserNotifications() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch('/api/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      updateNotificationBadge(data.unreadCount);
      displayUserNotifications(data.notifications);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Display notifications in dropdown
function displayUserNotifications(notifications) {
  const notifList = document.getElementById('notifList');
  if (!notifList) return;
  
  if (!notifications || notifications.length === 0) {
    notifList.innerHTML = '<div class="no-notif">No new notifications</div>';
    return;
  }
  
  let html = '';
  notifications.forEach(notif => {
    const date = formatNotifDate(notif.created_at);
    const unreadClass = notif.is_read ? '' : 'unread';
    
    html += `
      <div class="notif-item ${unreadClass}" onclick="markNotificationAsRead(${notif.id})">
        <span class="notif-item-title">${escapeHtml(notif.title)}</span>
        <span class="notif-item-message">${escapeHtml(notif.message)}</span>
        <span class="notif-item-date">${date}</span>
      </div>
    `;
  });
  
  notifList.innerHTML = html;
}

function formatNotifDate(dateStr) {
  if (!dateStr) return '';
  // Convert "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SSZ" if it lacks timezone specifier
  let formattedDateStr = dateStr;
  if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
    // Replace space between date and time with 'T' and append 'Z'
    formattedDateStr = dateStr.replace(' ', 'T') + 'Z';
  }
  
  const date = new Date(formattedDateStr);
  const now = new Date();
  const diffInMs = now - date;
  
  // Calculate relative times including seconds
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInMs / (1000 * 60));
  const diffInHrs = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInSecs < 30) return 'Just now';
  if (diffInSecs < 60) return `${diffInSecs}s ago`;
  if (diffInMin < 60) return `${diffInMin}m ago`;
  if (diffInHrs < 24) return `${diffInHrs}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
}

// Mark notification as read
async function markNotificationAsRead(id) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      loadUserNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllNotificationsAsRead() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      loadUserNotifications();
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Setup logout button functionality
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      logout();
    });
  }
}

// Logout function
function logout() {
  // Clear authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redirect to login page
  window.location.href = 'Login.html';
}

// Setup mobile menu toggle
function setupMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const links = document.querySelector('.links');

  if (menuToggle && links) {
    menuToggle.addEventListener('click', function() {
      links.classList.toggle('active');
    });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
