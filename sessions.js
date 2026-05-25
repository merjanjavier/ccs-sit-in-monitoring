// Client-side JavaScript for Sessions page

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (!userData && !authToken) {
    window.location.href = 'Login.html';
    return;
  }

  // Load sessions
  loadSessions();

  // Setup controls
  setupControls();
});

let allSessions = [];
let currentPage = 1;
let sessionsPerPage = 10;

async function loadSessions() {
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
      allSessions = data.history || [];
      displaySessions();
    } else {
      console.error('Error loading sessions:', data.message);
      displaySessions([]);
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
    displaySessions([]);
  }
}

function displaySessions() {
  const tbody = document.getElementById('sessionTableBody');
  if (!tbody) return;
  
  // Filtering could be added here if search is implemented
  const searchTerm = document.getElementById('sessionTableSearch').value.toLowerCase();
  const filtered = allSessions.filter(s => {
    const dateStr = s.date ? new Date(s.date).toLocaleDateString() : '';
    const statusStr = s.status || '';
    const labStr = s.lab || '';
    return dateStr.toLowerCase().includes(searchTerm) || 
           statusStr.toLowerCase().includes(searchTerm) || 
           labStr.toLowerCase().includes(searchTerm);
  });
  
  const totalRecords = filtered.length;
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const endIndex = Math.min(startIndex + sessionsPerPage, totalRecords);
  const toShow = filtered.slice(startIndex, endIndex);
  
  if (toShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No session records found</td></tr>';
    updatePaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  toShow.forEach(s => {
    const date = s.date ? new Date(s.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
    const timeIn = s.login_time ? new Date(s.login_time).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '-';
    const timeOut = s.logout_time ? new Date(s.logout_time).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '-';
    
    let duration = '-';
    if (s.login_time && s.logout_time) {
      const diff = new Date(s.logout_time) - new Date(s.login_time);
      const mins = Math.floor(diff / (1000 * 60));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      duration = `${h}h ${m}m`;
    }
    
    const statusClass = (s.status || '').toLowerCase();
    
    html += `
      <tr>
        <td>${date}</td>
        <td>${timeIn}</td>
        <td>${timeOut}</td>
        <td>${duration}</td>
        <td>${s.pc_number || '-'}</td>
        <td><span class="status-pill ${statusClass}">${s.status || 'Unknown'}</span></td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updatePaginationInfo(startIndex + 1, endIndex, totalRecords);
}

function updatePaginationInfo(start, end, total) {
  document.getElementById('sessionShowingEntries').textContent = `Showing ${start} to ${end} of ${total} entries`;
  document.getElementById('sessionCurrentPage').textContent = currentPage;
}

function setupControls() {
  document.getElementById('sessionEntriesSelect').addEventListener('change', function() {
    sessionsPerPage = parseInt(this.value);
    currentPage = 1;
    displaySessions();
  });
  
  document.getElementById('sessionTableSearch').addEventListener('input', function() {
    currentPage = 1;
    displaySessions();
  });
  
  document.getElementById('firstPage').addEventListener('click', () => { currentPage = 1; displaySessions(); });
  document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; displaySessions(); } });
  document.getElementById('nextPage').addEventListener('click', () => { 
    const totalPages = Math.ceil(allSessions.length / sessionsPerPage);
    if (currentPage < totalPages) { currentPage++; displaySessions(); } 
  });
  document.getElementById('lastPage').addEventListener('click', () => { 
    const totalPages = Math.ceil(allSessions.length / sessionsPerPage);
    currentPage = totalPages || 1;
    displaySessions(); 
  });
}


