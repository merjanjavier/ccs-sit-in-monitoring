// Client-side JavaScript for history page

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (!userData && !authToken) {
    window.location.href = 'Login.html';
    return;
  }

  // Load history
  loadHistory();

  // Setup search
  setupSearch();

  // Setup entries per page
  setupEntriesPerPage();

  // Setup feedback modal
  setupFeedbackModal();
});

let allHistory = [];
let currentPage = 1;
let historyPerPage = 10;

// Load history from server
async function loadHistory() {
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
      allHistory = data.history || [];
      displayHistory();
    } else {
      console.error('Error loading history:', data.message);
      displayHistory([]);
    }
  } catch (error) {
    console.error('Error loading history:', error);
    displayHistory([]);
  }
}

// Display history in table
function displayHistory() {
  const tbody = document.getElementById('historyTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('historyEntriesSelect');
  historyPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = allHistory.length;
  const totalPages = Math.ceil(totalRecords / historyPerPage);
  const startIndex = (currentPage - 1) * historyPerPage;
  const endIndex = Math.min(startIndex + historyPerPage, totalRecords);
  const recordsToShow = allHistory.slice(startIndex, endIndex);
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No history records found</td></tr>';
    updatePaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach(record => {
    // Format times
    const loginTime = record.login_time ? new Date(record.login_time).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '-';
    const logoutTime = record.logout_time ? new Date(record.logout_time).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '-';
    const date = record.date ? new Date(record.date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric' }) : '-';
    
    html += `
      <tr>
        <td>${record.id_number}</td>
        <td>${record.name}</td>
        <td>${record.purpose || '-'}</td>
        <td>Lab ${record.lab || '-'}</td>
        <td>${loginTime}</td>
        <td>${logoutTime}</td>
        <td>${date}</td>
        <td class="actions-cell">
          <button class="feedback-btn" onclick="openFeedbackModal(${record.id})">
            <i class="fa-solid fa-comment"></i> Feedback
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updatePaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update pagination info
function updatePaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('historyShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('historyCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = currentPage;
  }
}

// Setup search
function setupSearch() {
  const searchInput = document.getElementById('historyTableSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterHistory(this.value);
    });
  }
}

// Filter history
function filterHistory(searchTerm) {
  const rows = document.querySelectorAll('#historyTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Setup entries per page
function setupEntriesPerPage() {
  const entriesSelect = document.getElementById('historyEntriesSelect');
  if (entriesSelect) {
    entriesSelect.addEventListener('change', function() {
      historyPerPage = parseInt(this.value);
      currentPage = 1;
      displayHistory();
    });
  }
}

// Pagination functions
function goToFirstPage() {
  currentPage = 1;
  displayHistory();
}

function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    displayHistory();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(allHistory.length / historyPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayHistory();
  }
}

function goToLastPage() {
  const totalPages = Math.ceil(allHistory.length / historyPerPage);
  currentPage = totalPages;
  displayHistory();
}

// Make pagination functions global
window.goToFirstPage = goToFirstPage;
window.goToPrevPage = goToPrevPage;
window.goToNextPage = goToNextPage;
window.goToLastPage = goToLastPage;

// Feedback modal
let currentSitInId = null;

function setupFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  const closeBtn = document.getElementById('closeFeedbackModal');
  const cancelBtn = document.getElementById('cancelFeedbackBtn');
  const form = document.getElementById('feedbackForm');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFeedbackModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeFeedbackModal);
  }
  
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeFeedbackModal();
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await submitFeedback();
    });
  }
}

function openFeedbackModal(sitInId) {
  currentSitInId = sitInId;
  const modal = document.getElementById('feedbackModal');
  if (modal) {
    modal.classList.add('show');
    // Reset form
    document.getElementById('feedbackRating').value = '';
    document.getElementById('feedbackComment').value = '';
  }
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) {
    modal.classList.remove('show');
  }
  currentSitInId = null;
}

// Make openFeedbackModal global
window.openFeedbackModal = openFeedbackModal;

async function submitFeedback() {
  const rating = document.getElementById('feedbackRating').value;
  const comment = document.getElementById('feedbackComment').value;
  
  if (!rating) {
    alert('Please select a rating');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sitInId: currentSitInId,
        rating: rating,
        comment: comment
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Feedback submitted successfully!');
      closeFeedbackModal();
    } else {
      alert(data.message || 'Failed to submit feedback');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert('Unable to submit feedback. Please try again.');
  }
}
