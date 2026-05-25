// Client-side JavaScript for Sit-In Summary page

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (!userData && !authToken) {
    window.location.href = 'Login.html';
    return;
  }

  // Load summary statistics
  loadSummaryStats();
});

async function loadSummaryStats() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      calculateAndDisplayStats(data.history || []);
    } else {
      console.error('Error loading history for summary:', data.message);
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

function calculateAndDisplayStats(history) {
  let totalMinutes = 0;
  let sessionsCount = 0;
  let longestMinutes = 0;
  
  history.forEach(record => {
    if (record.login_time && record.logout_time) {
      const login = new Date(record.login_time);
      const logout = new Date(record.logout_time);
      
      // Calculate duration in minutes
      const durationMs = logout - login;
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      
      if (durationMinutes > 0) {
        totalMinutes += durationMinutes;
        sessionsCount++;
        if (durationMinutes > longestMinutes) {
          longestMinutes = durationMinutes;
        }
      }
    }
  });
  
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgMinutes = sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : 0;
  
  // Display stats
  document.getElementById('totalHours').textContent = totalHours;
  document.getElementById('totalSessions').textContent = history.length; // Show all sessions including active ones if needed, or just sessionsCount
  document.getElementById('avgDuration').textContent = formatMinutes(avgMinutes);
  document.getElementById('longestSession').textContent = formatMinutes(longestMinutes);
}

function formatMinutes(minutes) {
  if (minutes < 60) {
    return minutes + 'm';
  } else {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}


