// Admin Page JavaScript

function formatStudentName(firstname, middlename, lastname, type = 'full') {
  const first = (firstname || '').trim();
  const last = (lastname || '').trim();
  const middle = (middlename || '').trim();
  
  if (!middle || middle.toUpperCase() === 'N/A') {
    return `${first} ${last}`.trim();
  }
  
  if (type === 'initial') {
    const initial = middle.charAt(0).toUpperCase();
    return `${first} ${initial}. ${last}`.trim();
  }
  
  return `${first} ${middle} ${last}`.trim();
}

let mainContent, studentInfoSection, viewSitInRecordsSection, currentSitInSection, reservationSection, feedbackReportsSection, sitinReportsSection, dropdownManagerSection, pcManagementSection;
let allSitinReports = []; // Store all reports for filtering and export
let currentFilteredSitinReports = []; // Store currently filtered reports for export

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated as admin
  checkAdminAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial data (with a small delay to ensure auth is checked)
  setTimeout(function() {
    loadStatistics();
    loadAnnouncements();
    loadAdminNotifications();
    refreshDropdownsInUI();
    // Poll for notifications every 30 seconds
    setInterval(loadAdminNotifications, 30000);
  }, 100);
});

async function checkAdminAuth() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (!token) {
    // Not logged in, redirect to login
    window.location.href = 'Login.html';
    return;
  }
  
  // Check if user is admin from stored data
  if (userData) {
    const parsed = JSON.parse(userData);
    // Verify token validity via API
    await verifyAdminToken(token);
  }
}

async function verifyAdminToken(token) {
  try {
    const response = await fetch('/api/admin/statistics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Only logout if we get a specific auth error (401 or 403)
    if (response.status === 401 || response.status === 403) {
      const data = await response.json();
      // Only logout if it's an auth error, not just a data error
      if (data.message && (data.message.includes('token') || data.message.includes('Admin'))) {
        logout();
      }
    }
  } catch (error) {
    console.error('Token verification error:', error);
    // If server is not running, still allow access if token exists
  }
}


function hideAllSections() {
  const sections = [
    document.querySelector('.admin-main'),
    document.getElementById('studentInfoSection'),
    document.getElementById('viewSitInRecordsSection'),
    document.getElementById('currentSitInSection'),
    document.getElementById('reservationSection'),
    document.getElementById('feedbackReportsSection'),
    document.getElementById('sitinReportsSection'),
    document.getElementById('dropdownManagerSection'),
    document.getElementById('pcManagementSection'),
    document.getElementById('adminLeaderboardSection')
  ];
  sections.forEach(section => {
    if (section) section.style.display = 'none';
  });
}

function setupEventListeners() {
  // Initialize all section variables first
  mainContent = document.querySelector('.admin-main');
  studentInfoSection = document.getElementById('studentInfoSection');
  viewSitInRecordsSection = document.getElementById('viewSitInRecordsSection');
  currentSitInSection = document.getElementById('currentSitInSection');
  reservationSection = document.getElementById('reservationSection');
  feedbackReportsSection = document.getElementById('feedbackReportsSection');
  sitinReportsSection = document.getElementById('sitinReportsSection');
  dropdownManagerSection = document.getElementById('dropdownManagerSection');
  adminLeaderboardSection = document.getElementById('adminLeaderboardSection');
  pcManagementSection = document.getElementById('pcManagementSection');
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Submit announcement button
  const submitBtn = document.getElementById('submitAnnouncement');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitAnnouncement);
  }
  
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Notification toggle
  const notifBtn = document.getElementById('adminNotifBtn');
  const notifDropdown = document.getElementById('adminNotifDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('show');
      }
    });
  }
  
  // Mark all as read button
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
  }

  // Sit-In Sidebar Dropdown
  const sitinDropdownBtn = document.getElementById('sitinDropdownBtn');
  const sitinDropdown = sitinDropdownBtn?.parentElement;
  if (sitinDropdownBtn && sitinDropdown) {
    sitinDropdownBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      sitinDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
      if (!sitinDropdown.contains(e.target)) {
        sitinDropdown.classList.remove('active');
      }
    });
  }

  // Reservation Table Event Delegation
  const reservationTableBody = document.getElementById('reservationTableBody');
  if (reservationTableBody) {
    reservationTableBody.addEventListener('click', function(e) {
      const target = e.target.closest('.action-icon');
      if (!target) return;

      const reservationId = target.getAttribute('data-id');
      const action = target.classList.contains('approve-btn') ? 'approved' : 
                     target.classList.contains('reject-btn') ? 'rejected' : null;

      if (reservationId && action) {
        if (action === 'approved') {
          openApproveModal(reservationId);
        } else {
          updateReservationStatus(reservationId, action);
        }
      }
    });
  }

  // Sit-In Lab Change Listener for Software Availability & PC Selection Grid
  const sitinLab = document.getElementById('sitinLab');
  if (sitinLab) {
    sitinLab.addEventListener('change', function() {
      const selectedLab = this.value;
      updateSoftwareAvailability(selectedLab);
      loadSitinPcGrid(selectedLab);
    });
  }

  // Reservation Approval Confirmation
  const confirmApproveBtn = document.getElementById('confirmApproveBtn');
  if (confirmApproveBtn) {
    confirmApproveBtn.addEventListener('click', function() {
      const reservationId = document.getElementById('approveReservationId').value;
      const pcNumber = document.getElementById('approvePcNumber').value.trim();
      
      if (!pcNumber) {
        alert('Please assign a PC number');
        return;
      }
      
      updateReservationStatus(reservationId, 'approved', pcNumber);
      closeApproveModal();
    });
  }
  
  // Search Students modal
  const searchStudentsLink = document.getElementById('searchLink');
  const searchModal = document.getElementById('searchStudentModal');
  const closeSearchModal = document.getElementById('closeSearchModal');
  const searchStudentBtn = document.getElementById('searchStudentBtn');
  
  if (searchStudentsLink && searchModal) {
    searchStudentsLink.addEventListener('click', function(e) {
      e.preventDefault();
      searchModal.classList.add('show');
    });
  }
  
  if (closeSearchModal && searchModal) {
    closeSearchModal.addEventListener('click', function() {
      searchModal.classList.remove('show');
    });
  }
  
  if (searchModal) {
    searchModal.addEventListener('click', function(e) {
      if (e.target === searchModal) {
        searchModal.classList.remove('show');
      }
    });
  }
  
  if (searchStudentBtn) {
    searchStudentBtn.addEventListener('click', searchStudentById);
  }
  
  // Search on Enter key
  const searchInput = document.getElementById('searchStudentId');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchStudentById();
      }
    });
  }
  
  // Home link - show main content (Statistics and Announcement)
  const homeLink = document.getElementById('homeLink');
  
  if (homeLink) {
    homeLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Show main content (Statistics and Announcement)
      hideAllSections();
      if (mainContent) mainContent.style.display = 'block';
    });
  }
  
  // Students link
  const studentsLink = document.getElementById('studentsLink');
  
  if (studentsLink) {
    studentsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content, show student info section
      if (mainContent) mainContent.style.display = 'none';
      hideAllSections();
      if (studentInfoSection) studentInfoSection.style.display = 'block';
      // Load students
      loadStudents();
    });
  }
  
  // Add Student button (Unified Modal)
  const addStudentBtn = document.getElementById('addStudentBtn');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', function() {
      document.getElementById('studentModalTitle').textContent = 'Add New Student';
      document.getElementById('studentActionType').value = 'add';
      
      // Reset inputs
      document.getElementById('studentIdNumber').value = '';
      document.getElementById('studentIdNumber').readOnly = false;
      document.getElementById('studentFirstname').value = '';
      document.getElementById('studentMiddlename').value = '';
      document.getElementById('studentLastname').value = '';
      document.getElementById('studentCourse').value = '';
      document.getElementById('studentYearLevel').value = '';
      document.getElementById('studentAddress').value = '';
      document.getElementById('studentEmail').value = '';
      document.getElementById('studentPassword').value = '';
      document.getElementById('studentSessions').value = '30';
      
      // Form group visibility
      document.getElementById('studentPasswordGroup').style.display = 'block';
      document.getElementById('studentSessionsGroup').style.display = 'none';
      
      document.getElementById('studentModal').classList.add('show');
    });
  }

  // Close Student Modal handlers
  const closeStudentModal = document.getElementById('closeStudentModal');
  if (closeStudentModal) {
    closeStudentModal.addEventListener('click', () => {
      document.getElementById('studentModal').classList.remove('show');
    });
  }
  
  const cancelStudentBtn = document.getElementById('cancelStudentBtn');
  if (cancelStudentBtn) {
    cancelStudentBtn.addEventListener('click', () => {
      document.getElementById('studentModal').classList.remove('show');
    });
  }

  const studentSubmitBtn = document.getElementById('studentSubmitBtn');
  if (studentSubmitBtn) {
    studentSubmitBtn.addEventListener('click', async function() {
      const actionType = document.getElementById('studentActionType').value;
      const idNumber = document.getElementById('studentIdNumber').value.trim();
      const firstname = document.getElementById('studentFirstname').value.trim();
      const middlename = document.getElementById('studentMiddlename').value.trim();
      const lastname = document.getElementById('studentLastname').value.trim();
      const course = document.getElementById('studentCourse').value;
      const courseLevel = document.getElementById('studentYearLevel').value;
      const address = document.getElementById('studentAddress').value.trim();
      const email = document.getElementById('studentEmail').value.trim();
      const password = document.getElementById('studentPassword').value.trim();
      const sessions = parseInt(document.getElementById('studentSessions').value) || 30;

      if (!idNumber || !firstname || !lastname || !course || !courseLevel || !address || !email) {
        alert('Please fill out all required fields.');
        return;
      }

      const token = localStorage.getItem('authToken');
      
      try {
        let response;
        if (actionType === 'add') {
          response = await fetch('/api/admin/students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              idNumber,
              firstname,
              middlename,
              lastname,
              courseLevel,
              course,
              address,
              email,
              password
            })
          });
        } else {
          response = await fetch(`/api/admin/students/${idNumber}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              firstname,
              middlename,
              lastname,
              courseLevel,
              course,
              address,
              email,
              sessions
            })
          });
        }

        const data = await response.json();
        if (data.success) {
          alert(actionType === 'add' ? 'Student added successfully!' : 'Student updated successfully!');
          document.getElementById('studentModal').classList.remove('show');
          loadStudents();
        } else {
          alert(data.message || 'An error occurred.');
        }
      } catch (error) {
        console.error('Error saving student:', error);
        alert('An error occurred while saving student.');
      }
    });
  }
  
  // Reset All Sessions button
  const resetSessionsBtn = document.getElementById('resetSessionsBtn');
  if (resetSessionsBtn) {
    resetSessionsBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset all student sessions?')) {
        resetAllSessions();
      }
    });
  }
  
  // Student table search
  const studentTableSearch = document.getElementById('studentTableSearch');
  if (studentTableSearch) {
    studentTableSearch.addEventListener('input', function() {
      filterStudents(this.value);
    });
  }
  
  // Entries per page
  const entriesSelect = document.getElementById('entriesSelect');
  if (entriesSelect) {
    entriesSelect.addEventListener('change', function() {
      loadStudents();
    });
  }
  
  // Sit-In modal
  const sitinLink = document.getElementById('sitinLink');
  const sitinModal = document.getElementById('sitinModal');
  const closeSitInModal = document.getElementById('closeSitInModal');
  const closeSitInBtn = document.getElementById('closeSitInBtn');
  const sitinSubmitBtn = document.getElementById('sitinSubmitBtn');
  const sitinIdNumber = document.getElementById('sitinIdNumber');
  
  // Sit-In link - show Current Sit-In page instead of opening modal
  if (sitinLink) {
    sitinLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Show Current Sit-In section
      hideAllSections();
      if (currentSitInSection) currentSitInSection.style.display = 'block';
      loadCurrentSitIn();
    });
  }
  
  if (closeSitInModal && sitinModal) {
    closeSitInModal.addEventListener('click', function() {
      sitinModal.classList.remove('show');
      clearSitInForm();
    });
  }
  
  if (closeSitInBtn && sitinModal) {
    closeSitInBtn.addEventListener('click', function() {
      sitinModal.classList.remove('show');
      clearSitInForm();
    });
  }
  
  if (sitinModal) {
    sitinModal.addEventListener('click', function(e) {
      if (e.target === sitinModal) {
        sitinModal.classList.remove('show');
        clearSitInForm();
      }
    });
  }
  
  // When ID Number is entered in Sit-In, fetch student info
  if (sitinIdNumber) {
    sitinIdNumber.addEventListener('change', async function() {
      const idNumber = this.value.trim();
      if (idNumber) {
        await fetchStudentForSitIn(idNumber);
      }
    });
  }
  
  // Submit Sit-In
  if (sitinSubmitBtn) {
    sitinSubmitBtn.addEventListener('click', submitSitIn);
  }
  
  // View Sit-in Records link
  const viewSitInRecordsLink = document.getElementById('viewSitInRecordsLink');
  // viewSitInRecordsSection already declared above
  
  if (viewSitInRecordsLink && viewSitInRecordsSection) {
    viewSitInRecordsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content and student section, show sit-in records
      hideAllSections();
      if (viewSitInRecordsSection) viewSitInRecordsSection.style.display = 'block';
      // Load sit-in records
      loadSitInRecords();
    });
  }
  
  // Reservation link
  const reservationLink = document.getElementById('reservationLink');
  
  if (reservationLink && reservationSection) {
    reservationLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content and other sections, show reservation section
      hideAllSections();
      if (reservationSection) reservationSection.style.display = 'block';
      // Load reservations
      loadReservations();
    });
  }
  
  // Feedback Reports link
  const feedbackReportsLink = document.getElementById('feedbackReportsLink');
  
  if (feedbackReportsLink && feedbackReportsSection) {
    feedbackReportsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content and other sections, show feedback section
      hideAllSections();
      if (feedbackReportsSection) feedbackReportsSection.style.display = 'block';
      // Load feedback reports
      loadFeedbackReports();
    });
  }

  // Sit-In Reports link
  const sitinReportsLink = document.getElementById('sitinReportsLink');
  
  if (sitinReportsLink && sitinReportsSection) {
    sitinReportsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide main content and other sections, show sit-in reports section
      hideAllSections();
      if (sitinReportsSection) sitinReportsSection.style.display = 'block';
      // Load sit-in reports
      loadSitInReports();
    });
  }

  // Dropdown Manager link
  const dropdownManagerLink = document.getElementById('dropdownManagerLink');
  
  if (dropdownManagerLink && dropdownManagerSection) {
    dropdownManagerLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide all other sections
      hideAllSections();
      if (dropdownManagerSection) dropdownManagerSection.style.display = 'block';
      if (adminLeaderboardSection) adminLeaderboardSection.style.display = 'none';
      // Load dropdown options
      loadDropdownOptions();
    });
  }

  if (adminLeaderboardLink && adminLeaderboardSection) {
    adminLeaderboardLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Hide all other sections
      hideAllSections();
      if (adminLeaderboardSection) adminLeaderboardSection.style.display = 'block';
      // Load leaderboard
      loadAdminLeaderboard();
    });
  }

  // PC Management link
  const pcManagementLink = document.getElementById('pcManagementLink');
  if (pcManagementLink && pcManagementSection) {
    pcManagementLink.addEventListener('click', function(e) {
      e.preventDefault();
      hideAllSections();
      if (pcManagementSection) pcManagementSection.style.display = 'block';
      loadPcManagementLabs();
    });
  }

  const pcManageLabSelect = document.getElementById('pcManageLabSelect');
  if (pcManageLabSelect) {
    pcManageLabSelect.addEventListener('change', function() {
      const selectedLab = this.value;
      if (selectedLab) {
        renderPcManagementGrid(selectedLab);
      } else {
        document.getElementById('pcManageGrid').innerHTML = `
          <div class="no-pcs-message" style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px 0; font-style: italic;">
            Please select a laboratory to manage PCs.
          </div>
        `;
      }
    });
  }

  // Admin Leaderboard Search
  const adminLeaderboardSearch = document.getElementById('adminLeaderboardSearch');
  if (adminLeaderboardSearch) {
    adminLeaderboardSearch.addEventListener('input', function(e) {
      filterAdminLeaderboard(e.target.value);
    });
  }
  
  // Dropdown Manager Action Listener
  const managerGrid = document.querySelector('.manager-grid');
  if (managerGrid) {
    managerGrid.addEventListener('click', function(e) {
      const btn = e.target.closest('.icon-btn');
      if (!btn) return;
      
      const { id, category, value, metadata, status } = btn.dataset;
      
      if (btn.classList.contains('edit-btn')) {
        openEditDropdownModal(id, category, value, metadata);
      } else if (btn.classList.contains('status-btn')) {
        toggleDropdownOption(id, status === 'true' || status === '1');
      } else if (btn.classList.contains('delete-btn')) {
        deleteDropdownOption(id);
      }
    });
  }

  // Sit-In Reports Filter and Reset
  const filterReportsBtn = document.getElementById('filterReportsBtn');
  if (filterReportsBtn) {
    filterReportsBtn.addEventListener('click', filterSitinReportsByCriteria);
  }

  const resetReportsBtn = document.getElementById('resetReportsBtn');
  if (resetReportsBtn) {
    resetReportsBtn.addEventListener('click', function() {
      document.getElementById('sitinDateFrom').value = '';
      document.getElementById('sitinDateTo').value = '';
      document.getElementById('sitinReportsTableSearch').value = '';
      currentFilteredSitinReports = allSitinReports;
      displaySitInReports(allSitinReports);
    });
  }

  // Export Buttons
  document.getElementById('exportCSV')?.addEventListener('click', () => exportToCSV(currentFilteredSitinReports));
  document.getElementById('exportExcel')?.addEventListener('click', () => exportToExcel(currentFilteredSitinReports));
  document.getElementById('exportPDF')?.addEventListener('click', exportToPDF);
  document.getElementById('printReports')?.addEventListener('click', () => window.print());

  // Sit-in table search
  const sitinTableSearch = document.getElementById('sitinTableSearch');
  if (sitinTableSearch) {
    sitinTableSearch.addEventListener('input', function() {
      filterSitInRecords(this.value);
    });
  }
  
  // Sit-in entries per page
  const sitinEntriesSelect = document.getElementById('sitinEntriesSelect');
  if (sitinEntriesSelect) {
    sitinEntriesSelect.addEventListener('change', function() {
      loadSitInRecords();
    });
  }

  // Current Sit-In table search
  const currentSitInTableSearch = document.getElementById('currentSitInTableSearch');
  if (currentSitInTableSearch) {
    currentSitInTableSearch.addEventListener('input', function() {
      filterCurrentSitIn(this.value);
    });
  }

  // Current Sit-In entries per page
  const currentSitInEntriesSelect = document.getElementById('currentSitInEntriesSelect');
  if (currentSitInEntriesSelect) {
    currentSitInEntriesSelect.addEventListener('change', function() {
      loadCurrentSitIn();
    });
  }
  
  // Reservation table search
  const reservationTableSearch = document.getElementById('reservationTableSearch');
  if (reservationTableSearch) {
    reservationTableSearch.addEventListener('input', function() {
      filterReservations(this.value);
    });
  }
  
  // Reservation entries per page
  const reservationEntriesSelect = document.getElementById('reservationEntriesSelect');
  if (reservationEntriesSelect) {
    reservationEntriesSelect.addEventListener('change', function() {
      loadReservations();
    });
  }

  // Feedback table search
  const feedbackTableSearch = document.getElementById('feedbackTableSearch');
  if (feedbackTableSearch) {
    feedbackTableSearch.addEventListener('input', function() {
      filterFeedback(this.value);
    });
  }

  // Feedback entries per page
  const feedbackEntriesSelect = document.getElementById('feedbackEntriesSelect');
  if (feedbackEntriesSelect) {
    feedbackEntriesSelect.addEventListener('change', function() {
      loadFeedbackReports();
    });
  }

  // Sit-In Reports table search
  const sitinReportsTableSearch = document.getElementById('sitinReportsTableSearch');
  if (sitinReportsTableSearch) {
    sitinReportsTableSearch.addEventListener('input', function() {
      filterSitinReports(this.value);
    });
  }

  // Sit-In Reports entries per page
  const sitinReportsEntriesSelect = document.getElementById('sitinReportsEntriesSelect');
  if (sitinReportsEntriesSelect) {
    sitinReportsEntriesSelect.addEventListener('change', function() {
      loadSitInReports();
    });
  }
}

function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

function logout() {
  // Clear authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redirect to login page
  window.location.href = 'Login.html';
}

// Load Statistics
async function loadStatistics() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/statistics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.statistics) {
      const stats = data.statistics;
      
      // Update stat values
      document.getElementById('studentsRegistered').textContent = stats.totalUsers || 0;
      document.getElementById('currentlySitIn').textContent = stats.currentlySitIn || 0;
      document.getElementById('totalSitIn').textContent = stats.totalSitIn || 0;
      
      // Update language graph
      await updateLanguageGraph(stats.languageStats || []);
      
      console.log('Statistics loaded:', stats);
    } else {
      console.error('Error loading statistics:', data.message || 'Unknown error');
      showDemoStatistics();
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    // Show demo data if server is not available
    showDemoStatistics();
  }
}

function showDemoStatistics() {
  document.getElementById('studentsRegistered').textContent = '0';
  document.getElementById('currentlySitIn').textContent = '0';
  document.getElementById('totalSitIn').textContent = '0';
  
  // Show demo language data - but note this is fallback when server is down
  console.log('Showing demo statistics - server may be unreachable');
  
  // Show empty pie chart with "No Data" message
  updateLanguageGraph([]);
}

async function updateLanguageGraph(languageStats) {
  const canvas = document.getElementById('languageRadarChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 30;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let activeLanguages = [];
  try {
    const purposeRes = await fetch('/api/dropdowns/purpose');
    const purposeData = await purposeRes.json();
    if (purposeData.success && purposeData.options) {
      // Use active purposes, excluding any literal "Other"/"Others" option to keep a consolidated category
      activeLanguages = purposeData.options
        .map(opt => opt.value)
        .filter(val => val.toLowerCase() !== 'other' && val.toLowerCase() !== 'others');
    }
  } catch (error) {
    console.error('Error fetching dynamic purposes for chart:', error);
  }

  // Fallback if fetch fails or is empty (e.g. server down or offline demo)
  if (activeLanguages.length === 0) {
    activeLanguages = ['C Programming', 'C++', 'C#', 'Java', 'Python', 'ASP.Net', 'PHP'];
  }
  
  // Aggregate counts for active languages and group the rest under "Others"
  const activeCounts = {};
  activeLanguages.forEach(lang => {
    activeCounts[lang.toLowerCase()] = 0;
  });
  
  let othersCount = 0;
  
  languageStats.forEach(stat => {
    const statLang = stat.language || '';
    const statLangLower = statLang.toLowerCase();
    
    let matchedActive = false;
    for (const lang of activeLanguages) {
      if (lang.toLowerCase() === statLangLower) {
        activeCounts[lang.toLowerCase()] += stat.count;
        matchedActive = true;
        break;
      }
    }
    
    if (!matchedActive) {
      // If it's disabled, literally "Other"/"Others", or legacy, aggregate under "Others"
      othersCount += stat.count;
    }
  });
  
  // Build final lists for chart rendering
  const finalLanguages = [...activeLanguages];
  const finalCounts = activeLanguages.map(lang => activeCounts[lang.toLowerCase()]);
  
  if (othersCount > 0) {
    finalLanguages.push('Others');
    finalCounts.push(othersCount);
  }
  
  // Calculate total
  const total = finalCounts.reduce((sum, count) => sum + count, 0);
  
  // Dynamic harmonious premium color palette
  const colors = [
    '#1a1a2e', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#00cec9', 
    '#e84393', '#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#d63031', '#2d3436', 
    '#ffeaa7', '#fab1a0', '#ff7675', '#fd79a8', '#a29bfe', '#74b9ff'
  ];
  
  // Draw pie chart only if there's data
  if (total > 0) {
    // Draw pie chart
    let startAngle = 0;
    
    finalCounts.forEach((count, i) => {
      if (count === 0) return;
      
      const sliceAngle = (count / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      // Draw slice border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Calculate label position (midpoint of slice)
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + (radius * 0.65) * Math.cos(midAngle);
      const labelY = centerY + (radius * 0.65) * Math.sin(midAngle);
      
      // Draw percentage label if slice is big enough
      if (count / total > 0.05) {
        const percentage = Math.round((count / total) * 100);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(percentage + '%', labelX, labelY);
      }
      
      startAngle = endAngle;
    });
  }
  
  // Draw center circle (for donut effect)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
  ctx.fillStyle = '#f8f9fa';
  ctx.fill();
  
  // Draw total or "No Data" in center
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (total > 0) {
    ctx.fillText(total.toString(), centerX, centerY - 8);
    ctx.font = '12px Arial';
    ctx.fillText('Total', centerX, centerY + 10);
  } else {
    ctx.font = 'bold 14px Arial';
    ctx.fillText('No Data', centerX, centerY);
  }
  
  // Update legend
  updateRadarLegend(finalLanguages, finalCounts, colors, total);
}

function updateRadarLegend(languages, counts, colors, total) {
  const legend = document.getElementById('radarLegend');
  if (!legend) return;
  
  let html = '';
  languages.forEach((lang, i) => {
    const percentage = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
    html += `
      <div class="radar-legend-item">
        <div class="radar-legend-color" style="background-color: ${colors[i % colors.length]}"></div>
        <span>${lang}: ${counts[i]} (${percentage}%)</span>
      </div>
    `;
  });
  
  legend.innerHTML = html;
}

// Load Announcements
async function loadAnnouncements() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/announcements', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayAnnouncements(data.announcements || []);
    } else {
      console.error('Error loading announcements:', data.message);
      displayAnnouncements([]);
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
    displayAnnouncements([]);
  }
}

function displayAnnouncements(announcements) {
  const listContainer = document.getElementById('announcementsList');
  
  if (!listContainer) return;
  
  if (announcements.length === 0) {
    listContainer.innerHTML = '<div class="no-announcements">No announcements yet</div>';
    return;
  }
  
  let html = '';
  announcements.forEach(announcement => {
    const date = new Date(announcement.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    html += `
      <div class="announcement-item">
        <div class="announcement-date">${date}</div>
        <div class="announcement-content">${escapeHtml(announcement.content)}</div>
      </div>
    `;
  });
  
  listContainer.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Submit Announcement
async function submitAnnouncement() {
  const content = document.getElementById('announcementContent').value.trim();
  
  if (!content) {
    alert('Please enter an announcement');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Announcement',
        content: content
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear textarea
      document.getElementById('announcementContent').value = '';
      
      // Show success message
      alert('Announcement posted successfully!');
      
      // Reload announcements
      loadAnnouncements();
    } else {
      alert(data.message || 'Failed to post announcement');
    }
  } catch (error) {
    console.error('Error posting announcement:', error);
    alert('Unable to post announcement. Please try again.');
  }
}

// Check for session timeout
setInterval(() => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = 'Login.html';
  }
}, 60000); // Check every minute

// Search Student by ID
async function searchStudentById() {
  const studentId = document.getElementById('searchStudentId').value.trim();
  
  if (!studentId) {
    alert('Please enter a student ID number');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Display student info
      const student = data.student;
      const remainingSessions = student.sessions || 30;
      
      // Close search modal
      document.getElementById('searchStudentModal').classList.remove('show');
      document.getElementById('searchStudentId').value = '';
      
      // Refresh dropdowns to ensure we have the latest options from the database
      await refreshDropdownsInUI();

      // Open Sit-In modal and fill in the data
      const sitinModal = document.getElementById('sitinModal');
      if (sitinModal) {
        document.getElementById('sitinIdNumber').value = student.id_number;
        document.getElementById('sitinStudentName').value = formatStudentName(student.firstname, student.middlename, student.lastname, 'full');
        document.getElementById('sitinRemainingSessions').value = remainingSessions;
        sitinModal.classList.add('show');
      }
    } else {
      alert(data.message || 'Student not found');
    }
  } catch (error) {
    console.error('Error searching student:', error);
    alert('Unable to search student. Please try again.');
  }
}

// Load Students
async function loadStudents() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/students', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayStudents(data.students || []);
    } else {
      console.error('Error loading students:', data.message);
      displayStudents([]);
    }
  } catch (error) {
    console.error('Error loading students:', error);
    displayStudents([]);
  }
}

// Display Students in table
function displayStudents(students) {
  const tbody = document.getElementById('studentTableBody');
  
  if (!tbody) return;
  
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found</td></tr>';
    return;
  }
  
  let html = '';
  students.forEach(student => {
    html += `
      <tr>
        <td>${student.id_number}</td>
        <td>${formatStudentName(student.firstname, student.middlename, student.lastname, 'initial')}</td>
        <td>${student.year}</td>
        <td>${student.course}</td>
        <td>${student.sessions || 30}</td>
        <td class="actions-cell">
          <button class="action-icon edit-btn" onclick="editStudent('${student.id_number}')" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-icon delete-btn" onclick="deleteStudent('${student.id_number}')" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

// Filter Students
function filterStudents(searchTerm) {
  const rows = document.querySelectorAll('#studentTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Edit Student
async function editStudent(studentId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const student = data.student;
      
      document.getElementById('studentModalTitle').textContent = 'Edit Student Information';
      document.getElementById('studentActionType').value = 'edit';
      
      // Populate inputs
      document.getElementById('studentIdNumber').value = student.id_number;
      document.getElementById('studentIdNumber').readOnly = true;
      document.getElementById('studentFirstname').value = student.firstname;
      document.getElementById('studentMiddlename').value = student.middlename || '';
      document.getElementById('studentLastname').value = student.lastname;
      document.getElementById('studentCourse').value = student.course;
      document.getElementById('studentYearLevel').value = student.course_level;
      document.getElementById('studentAddress').value = student.address || '';
      document.getElementById('studentEmail').value = student.email;
      document.getElementById('studentSessions').value = student.sessions !== undefined ? student.sessions : 30;
      
      // Form group visibility
      document.getElementById('studentPasswordGroup').style.display = 'none';
      document.getElementById('studentSessionsGroup').style.display = 'block';
      
      document.getElementById('studentModal').classList.add('show');
    } else {
      alert(data.message || 'Failed to fetch student details');
    }
  } catch (error) {
    console.error('Error fetching student details:', error);
    alert('Unable to load student details. Please try again.');
  }
}

// Delete Student
function deleteStudent(studentId) {
  if (confirm('Are you sure you want to delete this student?')) {
    deleteStudentById(studentId);
  }
}

// Delete Student by ID
async function deleteStudentById(studentId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Student deleted successfully');
      loadStudents();
    } else {
      alert(data.message || 'Failed to delete student');
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    alert('Unable to delete student. Please try again.');
  }
}

// Reset All Sessions
async function resetAllSessions() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/students/reset-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('All student sessions have been reset');
      loadStudents();
    } else {
      alert(data.message || 'Failed to reset sessions');
    }
  } catch (error) {
    console.error('Error resetting sessions:', error);
    alert('Unable to reset sessions. Please try again.');
  }
}

// Fetch student for Sit-In
async function fetchStudentForSitIn(idNumber) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/students/${idNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const student = data.student;
      document.getElementById('sitinStudentName').value = formatStudentName(student.firstname, student.middlename, student.lastname, 'full');
      document.getElementById('sitinRemainingSessions').value = student.sessions || 30;
    } else {
      document.getElementById('sitinStudentName').value = '';
      document.getElementById('sitinRemainingSessions').value = '';
      alert('Student not found');
    }
  } catch (error) {
    console.error('Error fetching student:', error);
  }
}

// Submit Sit-In
async function submitSitIn() {
  const idNumber = document.getElementById('sitinIdNumber').value.trim();
  const purpose = document.getElementById('sitinPurpose').value;
  const lab = document.getElementById('sitinLab').value.trim();
  const pcNumber = document.getElementById('sitinPcNumber').value.trim();
  
  if (!lab) {
    alert('Please select a Lab');
    return;
  }

  if (!pcNumber) {
    alert('Please assign a PC Number');
    return;
  }

  if (!idNumber) {
    alert('Please enter ID Number');
    return;
  }
  
  if (!purpose) {
    alert('Please select a Purpose/Language');
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        idNumber: idNumber,
        purpose: purpose,
        lab: lab,
        pcNumber: pcNumber
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Sit-In recorded successfully!');
      document.getElementById('sitinModal').classList.remove('show');
      clearSitInForm();
      
      // Hide all sections
      document.querySelector('.admin-main').style.display = 'none';
      document.getElementById('studentInfoSection').style.display = 'none';
      document.getElementById('viewSitInRecordsSection').style.display = 'none';
      document.getElementById('reservationSection').style.display = 'none';
      
      // Show current sit-in section
      const currentSection = document.getElementById('currentSitInSection');
      if (currentSection) {
        currentSection.style.display = 'block';
        loadCurrentSitIn();
      }
    } else {
      alert(data.message || 'Failed to record Sit-In');
    }
  } catch (error) {
    console.error('Error submitting sit-in:', error);
    alert('Unable to submit Sit-In. Please try again.');
  }
}

// Clear Sit-In Form
function clearSitInForm() {
  document.getElementById('sitinIdNumber').value = '';
  document.getElementById('sitinStudentName').value = '';
  document.getElementById('sitinPurpose').value = '';
  document.getElementById('sitinLab').value = '';
  document.getElementById('sitinPcNumber').value = '';
  document.getElementById('sitinSoftwareContainer').style.display = 'none';
  document.getElementById('sitinRemainingSessions').value = '';
  
  // Clear PC grid
  const pcGroup = document.getElementById('sitinPcSelectionGroup');
  if (pcGroup) pcGroup.style.display = 'none';
  const grid = document.getElementById('sitinPcGrid');
  if (grid) grid.innerHTML = '';
}

// Update Software Availability display in Sit-In Form
async function updateSoftwareAvailability(labValue) {
  const container = document.getElementById('sitinSoftwareContainer');
  const list = document.getElementById('sitinSoftwareList');
  
  if (!labValue) {
    container.style.display = 'none';
    return;
  }

  try {
    const response = await fetch('/api/dropdowns/lab');
    const data = await response.json();
    
    if (data.success) {
      const labInfo = data.options.find(opt => opt.value === labValue);
      if (labInfo && labInfo.metadata) {
        const software = JSON.parse(labInfo.metadata);
        if (software && software.length > 0) {
          list.innerHTML = software.map(s => `
            <span class="software-tag" style="background: #e9ecef; color: #1a1a2e; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              ${escapeHtml(s)}
            </span>
          `).join('');
          container.style.display = 'block';
        } else {
          list.innerHTML = '<p style="color: #666; font-size: 12px;">No software information available</p>';
          container.style.display = 'block';
        }
      } else {
        container.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error fetching software availability:', err);
    container.style.display = 'none';
  }
}

// Global variables for pagination
let sitInRecords = [];
let currentSitInPage = 1;
let sitInRecordsPerPage = 10;

// Global variables for current sit-in (active sessions)
let currentSitInList = [];
let currentSitInPageNum = 1;
let currentSitInPerPage = 10;

// Load Sit-In Records
async function loadSitInRecords() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin-records', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      sitInRecords = data.records || [];
      displaySitInRecords();
    } else {
      console.error('Error loading sit-in records:', data.message);
      displaySitInRecords([]);
    }
  } catch (error) {
    console.error('Error loading sit-in records:', error);
    displaySitInRecords([]);
  }
}

// Load Current Sit-In (active sessions)
async function loadCurrentSitIn() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/current-sitin', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentSitInList = data.records || [];
      displayCurrentSitIn();
    } else {
      console.error('Error loading current sit-in:', data.message);
      displayCurrentSitIn([]);
    }
  } catch (error) {
    console.error('Error loading current sit-in:', error);
    displayCurrentSitIn([]);
  }
}

// Display Current Sit-In in table
function displayCurrentSitIn() {
  const tbody = document.getElementById('currentSitInTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('currentSitInEntriesSelect');
  currentSitInPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = currentSitInList.length;
  const totalPages = Math.ceil(totalRecords / currentSitInPerPage);
  const startIndex = (currentSitInPageNum - 1) * currentSitInPerPage;
  const endIndex = Math.min(startIndex + currentSitInPerPage, totalRecords);
  const recordsToShow = currentSitInList.slice(startIndex, endIndex);
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No active sit-in sessions</td></tr>';
    updateCurrentSitInPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach(record => {
    // Capitalize first letter of status
    const status = record.status.charAt(0).toUpperCase() + record.status.slice(1);
    html += `
      <tr>
        <td>${record.id}</td>
        <td>${record.id_number}</td>
        <td>${record.name}</td>
        <td>${record.purpose}</td>
        <td>${record.lab}</td>
        <td><strong>${record.pc_number || '-'}</strong></td>
        <td>${record.session || 1}</td>
        <td><span class="status-badge status-${record.status}">${status}</span></td>
        <td class="actions-cell">
          <button class="action-icon edit-btn" onclick="completeSitIn('${record.id}')" title="Logout">
            <i class="fa-solid fa-sign-out-alt"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateCurrentSitInPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update current sit-in pagination info
function updateCurrentSitInPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('currentSitInShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('currentSitInCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = currentSitInPageNum;
  }
}

// Filter Current Sit-In
function filterCurrentSitIn(searchTerm) {
  const rows = document.querySelectorAll('#currentSitInTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Display Sit-In Records in table
function displaySitInRecords() {
  const tbody = document.getElementById('sitinTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('sitinEntriesSelect');
  sitInRecordsPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = sitInRecords.length;
  const totalPages = Math.ceil(totalRecords / sitInRecordsPerPage);
  const startIndex = (currentSitInPage - 1) * sitInRecordsPerPage;
  const endIndex = Math.min(startIndex + sitInRecordsPerPage, totalRecords);
  const recordsToShow = sitInRecords.slice(startIndex, endIndex);
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No records found</td></tr>';
    updateSitInPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach(record => {
    // Format login time, logout time, and date (Philippines timezone)
    const loginTime = record.login_time ? new Date(record.login_time).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' }) : '-';
    const logoutTime = record.logout_time ? new Date(record.logout_time).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' }) : '-';
    const date = record.created_at ? new Date(record.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : '-';
    
    html += `
      <tr>
        <td>${record.id}</td>
        <td>${record.id_number}</td>
        <td>${record.name}</td>
        <td>${record.purpose}</td>
        <td>${record.lab}</td>
        <td><strong>${record.pc_number || '-'}</strong></td>
        <td>${loginTime}</td>
        <td>${logoutTime}</td>
        <td>${date}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateSitInPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update pagination info
function updateSitInPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('sitinShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('sitinCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = currentSitInPage;
  }
}

// Filter Sit-In Records
function filterSitInRecords(searchTerm) {
  const rows = document.querySelectorAll('#sitinTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Pagination functions
function goToFirstPage() {
  currentSitInPage = 1;
  displaySitInRecords();
}

function goToPrevPage() {
  const totalPages = Math.ceil(sitInRecords.length / sitInRecordsPerPage);
  if (currentSitInPage > 1) {
    currentSitInPage--;
    displaySitInRecords();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(sitInRecords.length / sitInRecordsPerPage);
  if (currentSitInPage < totalPages) {
    currentSitInPage++;
    displaySitInRecords();
  }
}

function goToLastPage() {
  const totalPages = Math.ceil(sitInRecords.length / sitInRecordsPerPage);
  currentSitInPage = totalPages;
  displaySitInRecords();
}

// Complete Sit-In
function completeSitIn(recordId) {
  if (confirm('Mark this sit-in as completed?')) {
    completeSitInRecord(recordId);
  }
}

async function completeSitInRecord(recordId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/sitin-records/${recordId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Sit-in completed successfully');
      console.log('Sit-in completed, moving to View Sit-In Records');
      
      // Hide all sections
      document.querySelector('.admin-main').style.display = 'none';
      document.getElementById('studentInfoSection').style.display = 'none';
      document.getElementById('currentSitInSection').style.display = 'none';
      document.getElementById('reservationSection').style.display = 'none';
      
      // Show view sit-in records section
      const viewSection = document.getElementById('viewSitInRecordsSection');
      if (viewSection) {
        viewSection.style.display = 'block';
        console.log('View section shown, loading records...');
        loadSitInRecords();
      }
    } else {
      alert(data.message || 'Failed to complete sit-in');
    }
  } catch (error) {
    console.error('Error completing sit-in:', error);
    alert('Unable to complete sit-in. Please try again.');
  }
}

// Load Reservations
let allReservations = [];
let reservationPage = 1;
let reservationsPerPage = 10;

async function loadReservations() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/reservations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      allReservations = data.reservations || [];
      displayReservations();
    } else {
      console.error('Error loading reservations:', data.message);
      displayReservations([]);
    }
  } catch (error) {
    console.error('Error loading reservations:', error);
    displayReservations([]);
  }
}

// Display Reservations in table
function displayReservations() {
  const tbody = document.getElementById('reservationTableBody');
  
  if (!tbody) return;
  
  // Get entries per page
  const entriesSelect = document.getElementById('reservationEntriesSelect');
  reservationsPerPage = entriesSelect ? parseInt(entriesSelect.value) : 10;
  
  // Calculate pagination
  const totalRecords = allReservations.length;
  const totalPages = Math.ceil(totalRecords / reservationsPerPage);
  const startIndex = (reservationPage - 1) * reservationsPerPage;
  const endIndex = Math.min(startIndex + reservationsPerPage, totalRecords);
  const recordsToShow = allReservations.slice(startIndex, endIndex);
  
  if (recordsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No reservations found</td></tr>';
    updateReservationPaginationInfo(0, 0, 0);
    return;
  }
  
  let html = '';
  recordsToShow.forEach(res => {
    const date = new Date(res.reservation_date);
    const formattedDate = date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const name = formatStudentName(res.firstname, res.middlename, res.lastname, 'initial');
    
    // Status badge
    let statusBadge = '';
    if (res.status === 'pending') {
      statusBadge = '<span class="status-badge status-pending">Pending</span>';
    } else if (res.status === 'approved') {
      statusBadge = '<span class="status-badge status-approved">Approved</span>';
    } else if (res.status === 'rejected') {
      statusBadge = '<span class="status-badge status-rejected">Rejected</span>';
    } else if (res.status === 'cancelled') {
      statusBadge = '<span class="status-badge status-cancelled">Cancelled</span>';
    }
    
    // Action buttons
    let actions = '';
    if (res.status === 'pending') {
      actions = `
        <button class="action-icon approve-btn" data-id="${res.id}" title="Approve">
          <i class="fa-solid fa-check"></i>
        </button>
        <button class="action-icon reject-btn" data-id="${res.id}" title="Reject">
          <i class="fa-solid fa-times"></i>
        </button>
      `;
    } else {
      actions = '<span style="color: #999; font-size: 12px;">No actions</span>';
    }
    
    html += `
      <tr>
        <td>${res.id}</td>
        <td>${res.id_number}</td>
        <td>${name}</td>
        <td>Lab ${res.lab}</td>
        <td><strong>${res.pc_number || '-'}</strong></td>
        <td>${res.purpose || '-'}</td>
        <td>${formattedDate}</td>
        <td>${statusBadge}</td>
        <td class="actions-cell">${actions}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  updateReservationPaginationInfo(startIndex + 1, endIndex, totalRecords);
}

// Update reservation pagination info
function updateReservationPaginationInfo(start, end, total) {
  const showingEntries = document.getElementById('reservationShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
  const currentPageEl = document.getElementById('reservationCurrentPage');
  if (currentPageEl) {
    currentPageEl.textContent = reservationPage;
  }
}

// Update Reservation Status (Approve/Reject)
async function updateReservationStatus(reservationId, status, pcNumber = null) {
  console.log('Updating reservation status:', { reservationId, status, pcNumber });
  if (status === 'rejected' && !confirm('Reject this reservation?')) return;
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/reservations/${reservationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, pcNumber })
    });
    
    const data = await response.json();
    console.log('Status update response:', data);
    
    if (data.success) {
      // Fast state update: update local list immediately to remove lag
      const index = allReservations.findIndex(r => r.id == reservationId);
      if (index !== -1) {
        allReservations[index].status = status;
        if (pcNumber) {
          allReservations[index].pc_number = pcNumber;
        }
      }
      displayReservations();
      
      if (status === 'approved') {
        if (data.autoCheckedIn) {
          showToast('Reservation approved and student checked-in!', 'success');
          hideAllSections();
          if (currentSitInSection) {
            currentSitInSection.style.display = 'block';
            loadCurrentSitIn();
          }
          return;
        }
        showToast('Reservation approved successfully!', 'success');
      } else {
        showToast('Reservation rejected successfully!', 'info');
      }
      
      // Load in background just to make sure it's fully in sync
      loadReservations();
    } else {
      showToast(data.message || 'Failed to update reservation', 'error');
    }
  } catch (error) {
    console.error('Error updating reservation:', error);
    showToast('Error updating reservation. Please try again.', 'error');
  }
}

// Make it global just in case
window.updateReservationStatus = updateReservationStatus;

// Show custom toast notification (Admin)
function showToast(message, type = 'success') {
  let container = document.getElementById('adminToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'adminToastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate__animated animate__fadeInRight`;
  
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="toast-content">${message}</div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

// Filter Reservations
function filterReservations(searchTerm) {
  const rows = document.querySelectorAll('#reservationTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Load Feedback Reports
async function loadFeedbackReports() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/feedback-reports', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayFeedbackReports(data.reports || []);
    } else {
      console.error('Error loading feedback reports:', data.message);
      displayFeedbackReports([]);
    }
  } catch (error) {
    console.error('Error loading feedback reports:', error);
    displayFeedbackReports([]);
  }
}

// Display Feedback Reports in table
function displayFeedbackReports(reports) {
  const tbody = document.getElementById('feedbackTableBody');
  
  if (!tbody) return;
  
  if (reports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No feedback reports found</td></tr>';
    return;
  }
  
  let html = '';
  reports.forEach(report => {
    const formattedDate = new Date(report.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create rating stars
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= report.rating) {
        stars += '<i class="fa-solid fa-star" style="color: #f1c40f;"></i>';
      } else {
        stars += '<i class="fa-regular fa-star" style="color: #ccc;"></i>';
      }
    }
    
    html += `
      <tr>
        <td>${report.student_name}</td>
        <td>Lab ${report.lab}</td>
        <td>${report.purpose}</td>
        <td>${stars} (${report.rating})</td>
        <td>${report.comment || '-'}</td>
        <td>${formattedDate}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  
  // Update showing entries
  const showingEntries = document.getElementById('feedbackShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing 1 to ${reports.length} of ${reports.length} entries`;
  }
}

// Filter Feedback Reports
function filterFeedback(searchTerm) {
  const rows = document.querySelectorAll('#feedbackTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// Load Sit-In Reports
async function loadSitInReports() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/sitin-records', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      allSitinReports = data.records || [];
      currentFilteredSitinReports = allSitinReports;
      displaySitInReports(allSitinReports);
    } else {
      console.error('Error loading sit-in reports:', data.message);
      displaySitInReports([]);
    }
  } catch (error) {
    console.error('Error loading sit-in reports:', error);
    displaySitInReports([]);
  }
}

// Filter Sit-In Reports by Multiple Criteria (Date and Search)
function filterSitinReportsByCriteria() {
  const fromDate = document.getElementById('sitinDateFrom').value;
  const toDate = document.getElementById('sitinDateTo').value;
  const searchTerm = document.getElementById('sitinReportsTableSearch').value.toLowerCase();
  
  let filtered = allSitinReports;
  
  // Date filtering
  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter(report => new Date(report.created_at) >= from);
  }
  
  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(report => new Date(report.created_at) <= to);
  }
  
  // Search filtering
  if (searchTerm) {
    filtered = filtered.filter(report => 
      report.name.toLowerCase().includes(searchTerm) || 
      report.id_number.toString().includes(searchTerm)
    );
  }
  
  currentFilteredSitinReports = filtered;
  displaySitInReports(filtered);
}

// Display Sit-In Reports in table
function displaySitInReports(reports) {
  const tbody = document.getElementById('sitinReportsTableBody');
  
  if (!tbody) return;
  
  if (reports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No sit-in reports found</td></tr>';
    return;
  }
  
  let html = '';
  reports.forEach(report => {
    const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const timeIn = report.login_time ? new Date(report.login_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
    const timeOut = report.logout_time ? new Date(report.logout_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
    
    html += `
      <tr>
        <td>${report.name}</td>
        <td>${report.id_number}</td>
        <td>${report.purpose}</td>
        <td>Lab ${report.lab}</td>
        <td><strong>${report.pc_number || '-'}</strong></td>
        <td>${timeIn}</td>
        <td>${timeOut}</td>
        <td>${formattedDate}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  
  // Update showing entries
  const showingEntries = document.getElementById('sitinReportsShowingEntries');
  if (showingEntries) {
    showingEntries.textContent = `Showing 1 to ${reports.length} of ${reports.length} entries`;
  }
}

// Export functions
function exportToCSV(data) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = ['Student', 'ID Number', 'Purpose', 'Laboratory', 'Login', 'Logout', 'Date'];
  const rows = data.map(report => [
    report.name,
    report.id_number,
    report.purpose,
    `Lab ${report.lab}`,
    report.login_time ? new Date(report.login_time).toLocaleTimeString() : '-',
    report.logout_time ? new Date(report.logout_time).toLocaleTimeString() : '-',
    new Date(report.created_at).toLocaleDateString()
  ]);
  
  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `SitIn_Report_${new Date().toLocaleDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data) {
  // Excel can open CSV files perfectly if they use tab separator and UTF-16, 
  // but for a simple implementation, we can just use the CSV method with a different extension
  // or a slightly different format that Excel likes better.
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = ['Student', 'ID Number', 'Purpose', 'Laboratory', 'Login', 'Logout', 'Date'];
  const rows = data.map(report => [
    report.name,
    report.id_number,
    report.purpose,
    `Lab ${report.lab}`,
    report.login_time ? new Date(report.login_time).toLocaleTimeString() : '-',
    report.logout_time ? new Date(report.logout_time).toLocaleTimeString() : '-',
    new Date(report.created_at).toLocaleDateString()
  ]);
  
  let excelContent = "<table><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
  rows.forEach(row => {
    excelContent += "<tr>" + row.map(cell => `<td>${cell}</td>`).join("") + "</tr>";
  });
  excelContent += "</table>";
  
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `SitIn_Report_${new Date().toLocaleDateString()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF() {
  // Simplest way to "export to PDF" without external libraries is to use print
  // but we can also trigger the print dialog specifically for the report section
  window.print();
}

// Filter Sit-In Reports (Search only)
function filterSitinReports(searchTerm) {
  // If user types in the search box, we can just call the criteria filter
  filterSitinReportsByCriteria();
}

// Admin Notifications
async function loadAdminNotifications() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      updateNotificationBadge(data.unreadCount);
      displayAdminNotifications(data.notifications);
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

function displayAdminNotifications(notifications) {
  const notifList = document.getElementById('adminNotifList');
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
      <div class="notif-item ${unreadClass}" onclick="markNotificationAsRead(${notif.id}, '${notif.type}')">
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

async function markNotificationAsRead(id, type) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      loadAdminNotifications();
      
      // If notification is about reservation or feedback, navigate to those sections
      if (type === 'reservation') {
        const reservationLink = document.getElementById('reservationLink');
        if (reservationLink) reservationLink.click();
      } else if (type === 'feedback') {
        const feedbackReportsLink = document.getElementById('feedbackReportsLink');
        if (feedbackReportsLink) feedbackReportsLink.click();
      }
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllNotificationsAsRead() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      loadAdminNotifications();
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Dropdown Manager Functions
let currentLabSoftwareInModal = [];

async function loadDropdownOptions() {
  try {
    const token = localStorage.getItem('authToken');
    
    // Fetch all categories
    const categories = ['course', 'lab', 'purpose'];
    const results = await Promise.all(categories.map(cat => 
      fetch(`/api/admin/dropdowns?category=${cat}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    ));
    
    results.forEach((data, index) => {
      if (data.success) {
        displayDropdownCategory(categories[index], data.options);
      }
    });
    
    // Update the select elements in other parts of the UI
    refreshDropdownsInUI();
  } catch (error) {
    console.error('Error loading dropdown options:', error);
  }
}

function displayDropdownCategory(category, options) {
  const listId = `${category}List`;
  const listElement = document.getElementById(listId);
  if (!listElement) return;
  
  if (!options || options.length === 0) {
    listElement.innerHTML = '<div class="no-notif">No items found</div>';
    return;
  }
  
  let html = '';
  options.forEach(option => {
    const statusText = option.is_active ? 'Active' : 'Inactive';
    const statusColor = option.is_active ? '#28a745' : '#dc3545';
    const toggleIcon = option.is_active ? 'fa-toggle-on' : 'fa-toggle-off';
    const toggleTitle = option.is_active ? 'Deactivate' : 'Activate';
    
    html += `
      <div class="item-row">
        <div class="item-info">
          <span class="item-name">${escapeHtml(option.value)}</span>
          <span class="item-status" style="color: ${statusColor}">${statusText}</span>
        </div>
        <div class="item-actions">
          <button class="icon-btn edit-btn" 
                  data-id="${option.id}" 
                  data-category="${category}" 
                  data-value="${escapeHtml(option.value)}" 
                  data-metadata='${escapeHtml(option.metadata || "")}'
                  title="Edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="icon-btn status-btn" 
                  data-id="${option.id}" 
                  data-status="${option.is_active}" 
                  title="${toggleTitle}">
            <i class="fa-solid ${toggleIcon}"></i>
          </button>
          <button class="icon-btn delete-btn" 
                  data-id="${option.id}" 
                  title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  listElement.innerHTML = html;
}

// Modal logic for Add/Edit
function openAddDropdownModal(category) {
  document.getElementById('dropdownModalTitle').textContent = `Add New ${category.charAt(0).toUpperCase() + category.slice(1)}`;
  document.getElementById('dropdownEditId').value = '';
  document.getElementById('dropdownCategory').value = category;
  document.getElementById('dropdownValueInput').value = '';
  
  // Handle Lab Software Section
  const softwareSection = document.getElementById('labSoftwareSection');
  if (category === 'lab') {
    softwareSection.style.display = 'block';
    currentLabSoftwareInModal = [];
    renderSoftwareTagsInModal();
  } else {
    softwareSection.style.display = 'none';
  }
  
  document.getElementById('dropdownOptionModal').classList.add('show');
}

function openEditDropdownModal(id, category, value, metadata = '') {
  document.getElementById('dropdownModalTitle').textContent = `Edit ${category.charAt(0).toUpperCase() + category.slice(1)}`;
  document.getElementById('dropdownEditId').value = id;
  document.getElementById('dropdownCategory').value = category;
  document.getElementById('dropdownValueInput').value = value;
  
  // Handle Lab Software Section
  const softwareSection = document.getElementById('labSoftwareSection');
  if (category === 'lab') {
    softwareSection.style.display = 'block';
    try {
      currentLabSoftwareInModal = metadata ? JSON.parse(metadata) : [];
    } catch (e) {
      currentLabSoftwareInModal = [];
    }
    renderSoftwareTagsInModal();
  } else {
    softwareSection.style.display = 'none';
  }
  
  document.getElementById('dropdownOptionModal').classList.add('show');
}

function closeDropdownModal() {
  document.getElementById('dropdownOptionModal').classList.remove('show');
}

// Unified Software Management in Modal
function renderSoftwareTagsInModal() {
  const container = document.getElementById('modalSoftwareTagsContainer');
  if (!container) return;
  
  if (currentLabSoftwareInModal.length === 0) {
    container.innerHTML = '<p style="color: #999; font-size: 13px; margin: auto;">No software added yet</p>';
    return;
  }
  
  container.innerHTML = currentLabSoftwareInModal.map((s, index) => `
    <div class="software-tag">
      ${escapeHtml(s)}
      <i class="fa-solid fa-xmark remove-tag" onclick="removeSoftwareTagInModal(${index})"></i>
    </div>
  `).join('');
}

function addSoftwareTagInModal() {
  const input = document.getElementById('modalNewSoftwareInput');
  const value = input.value.trim();
  
  if (value && !currentLabSoftwareInModal.includes(value)) {
    currentLabSoftwareInModal.push(value);
    input.value = '';
    renderSoftwareTagsInModal();
  }
}

function removeSoftwareTagInModal(index) {
  currentLabSoftwareInModal.splice(index, 1);
  renderSoftwareTagsInModal();
}

function useSuggestionInModal(value) {
  if (!currentLabSoftwareInModal.includes(value)) {
    currentLabSoftwareInModal.push(value);
    renderSoftwareTagsInModal();
  }
}

// Save Option logic
document.getElementById('saveDropdownBtn').addEventListener('click', async function() {
  const id = document.getElementById('dropdownEditId').value;
  const category = document.getElementById('dropdownCategory').value;
  const value = document.getElementById('dropdownValueInput').value.trim();
  
  if (!value) {
    alert('Please enter a value');
    return;
  }
  
  const payload = { category, value };
  if (category === 'lab') {
    payload.metadata = JSON.stringify(currentLabSoftwareInModal);
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/dropdowns/${id}` : '/api/admin/dropdowns';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (data.success) {
      closeDropdownModal();
      loadDropdownOptions();
    } else {
      alert(data.message || 'Error saving option');
    }
  } catch (error) {
    console.error('Error saving dropdown option:', error);
  }
});

async function toggleDropdownOption(id, currentStatus) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/dropdowns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: !currentStatus })
    });
    
    const data = await response.json();
    if (data.success) {
      loadDropdownOptions();
    }
  } catch (error) {
    console.error('Error toggling dropdown option:', error);
  }
}

async function deleteDropdownOption(id) {
  if (!confirm('Are you sure you want to delete this option?')) return;
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/dropdowns/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      loadDropdownOptions();
    }
  } catch (error) {
    console.error('Error deleting dropdown option:', error);
  }
}

async function refreshDropdownsInUI() {
  try {
    // Fetch active labs
    const labRes = await fetch('/api/dropdowns/lab');
    const labData = await labRes.json();
    if (labData.success) {
      updateSelectElement('sitinLab', labData.options, 'Select Lab');
    }
    
    // Fetch active purposes
    const purposeRes = await fetch('/api/dropdowns/purpose');
    const purposeData = await purposeRes.json();
    if (purposeData.success) {
      updateSelectElement('sitinPurpose', purposeData.options, 'Select Language');
    }

    // Also update courses if any selects exist
    const courseRes = await fetch('/api/dropdowns/course');
    const courseData = await courseRes.json();
    // ... update course selects if needed
  } catch (error) {
    console.error('Error refreshing UI dropdowns:', error);
  }
}

function updateSelectElement(elementId, options, defaultText) {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  const currentValue = select.value;
  let html = `<option value="">${defaultText}</option>`;
  
  options.forEach(opt => {
    const selected = opt.value === currentValue ? 'selected' : '';
    html += `<option value="${escapeHtml(opt.value)}" ${selected}>${escapeHtml(opt.value)}</option>`;
  });
  
  select.innerHTML = html;
}

// Leaderboard Functions
let allAdminLeaderboardData = [];

async function loadAdminLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    
    if (data.success) {
      allAdminLeaderboardData = data.leaderboard || [];
      
      // Process data (1 min = 1 pt + 10 bonus per session)
      allAdminLeaderboardData = allAdminLeaderboardData.map(item => ({
        ...item,
        points: Math.floor(item.total_minutes || 0) + (item.total_sessions * 10)
      })).sort((a, b) => b.points - a.points);

      displayAdminTopPerformers(allAdminLeaderboardData.slice(0, 3));
      displayAdminFullLeaderboard(allAdminLeaderboardData);
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

function displayAdminTopPerformers(top3) {
  const container = document.getElementById('adminTopPerformersContainer');
  if (!container) return;

  const placeholders = [
    { name: 'N/A', points: 0, rank: 1, class: 'first' },
    { name: 'N/A', points: 0, rank: 2, class: 'second' },
    { name: 'N/A', points: 0, rank: 3, class: 'third' }
  ];

  const podium = [
    top3[1] || placeholders[1],
    top3[0] || placeholders[0],
    top3[2] || placeholders[2]
  ];

  let html = '';
  podium.forEach((item, index) => {
    const rankClass = index === 1 ? 'first' : (index === 0 ? 'second' : 'third');
    const rankNum = index === 1 ? 1 : (index === 0 ? 2 : 3);
    const name = item.firstname ? formatStudentName(item.firstname, item.middlename, item.lastname, 'initial') : 'Empty';
    const points = item.points || 0;
    const photoUrl = item.photo || './images/defaultpfp.jpg';

    html += `
      <div class="podium-item ${rankClass} animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.2}s">
        <div class="avatar" style="overflow: hidden; display: flex; align-items: center; justify-content: center; background: #e2e8f0;">
          <img src="${photoUrl}" alt="${name}" onerror="this.onerror=null; this.src='./images/defaultpfp.jpg';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />
        </div>
        <div class="podium-rank">${rankNum}</div>
        <div class="podium-name">${name}</div>
        <div class="podium-points">${points} pts</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function displayAdminFullLeaderboard(data) {
  const tbody = document.getElementById('adminLeaderboardTableBody');
  if (!tbody) return;

  let html = '';
  data.forEach((student, index) => {
    const rank = index + 1;
    const name = formatStudentName(student.firstname, student.middlename, student.lastname, 'initial');
    const courseYear = `${student.course} - ${student.course_level}`;
    const hours = Math.floor(student.total_minutes / 60);
    const mins = Math.floor(student.total_minutes % 60);
    const timeStr = `${hours}h ${mins}m`;
    
    let rankBadge = `<span class="rank-badge">${rank}</span>`;
    if (rank === 1) rankBadge = `<span class="rank-badge rank-1">1</span>`;
    if (rank === 2) rankBadge = `<span class="rank-badge rank-2">2</span>`;
    if (rank === 3) rankBadge = `<span class="rank-badge rank-3">3</span>`;

    html += `
      <tr>
        <td>${rankBadge}</td>
        <td>${name}</td>
        <td>${courseYear}</td>
        <td>${student.total_sessions}</td>
        <td>${timeStr}</td>
        <td><strong>${student.points}</strong></td>
      </tr>
    `;
  });

  tbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center;">No data found</td></tr>';
}

function filterAdminLeaderboard(searchTerm) {
  const term = searchTerm.toLowerCase();
  const filtered = allAdminLeaderboardData.filter(student => 
    formatStudentName(student.firstname, student.middlename, student.lastname, 'initial').toLowerCase().includes(term) ||
    student.id_number.toString().includes(term)
  );
  displayAdminFullLeaderboard(filtered);
}
async function openApproveModal(reservationId) {
  const modal = document.getElementById('approveReservationModal');
  const details = document.getElementById('approveReservationDetails');
  const reservation = allReservations.find(r => r.id == reservationId);
  
  if (reservation) {
    details.innerHTML = `Student: <strong>${formatStudentName(reservation.firstname, reservation.middlename, reservation.lastname, 'full')}</strong><br>Lab: <strong>Lab ${reservation.lab}</strong><br>Date: <strong>${new Date(reservation.reservation_date).toLocaleDateString()}</strong>`;
    
    // Clear selected PC number
    document.getElementById('approvePcNumber').value = '';
    
    // Load PC selection grid
    const grid = document.getElementById('approvePcGrid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">Loading PCs...</div>';
    
    try {
      const token = localStorage.getItem('authToken');
      const dateObj = new Date(reservation.reservation_date);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${y}-${m}-${d}`;
      
      const response = await fetch(`/api/pcs?lab=${reservation.lab}&date=${formattedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.pcs) {
        grid.innerHTML = '';
        data.pcs.forEach(pc => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `pc-select-btn pc-status-${pc.status}`;
          btn.style.padding = '8px';
          btn.style.borderRadius = '6px';
          btn.style.border = '1px solid';
          btn.style.fontSize = '12px';
          btn.style.fontWeight = '600';
          btn.style.cursor = pc.status === 'available' ? 'pointer' : 'not-allowed';
          
          if (pc.status === 'available') {
            btn.style.background = '#ecfdf5';
            btn.style.borderColor = '#10b981';
            btn.style.color = '#065f46';
          } else if (pc.status === 'occupied') {
            btn.style.background = '#fee2e2';
            btn.style.borderColor = '#ef4444';
            btn.style.color = '#991b1b';
            btn.disabled = true;
          } else {
            // disabled
            btn.style.background = '#f1f5f9';
            btn.style.borderColor = '#cbd5e1';
            btn.style.color = '#64748b';
            btn.style.opacity = '0.6';
            btn.disabled = true;
          }
          
          btn.innerHTML = `<i class="fa-solid fa-desktop" style="display:block; font-size:14px; margin-bottom:4px;"></i> ${pc.pc_number}`;
          
          if (pc.status === 'available') {
            btn.addEventListener('click', function() {
              // Deselect others
              grid.querySelectorAll('.pc-select-btn').forEach(b => {
                if (b.classList.contains('pc-status-available')) {
                  b.style.background = '#ecfdf5';
                  b.style.borderColor = '#10b981';
                  b.style.color = '#065f46';
                  b.style.boxShadow = 'none';
                }
              });
              
              // Select this one
              btn.style.background = '#3b82f6';
              btn.style.borderColor = '#2563eb';
              btn.style.color = '#ffffff';
              btn.style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.5)';
              
              document.getElementById('approvePcNumber').value = pc.pc_number;
            });
          }
          grid.appendChild(btn);
        });
      } else {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">Failed to load PCs</div>';
      }
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">Error loading PCs</div>';
    }
  }
  
  document.getElementById('approveReservationId').value = reservationId;
  modal.classList.add('show');
}

function closeApproveModal() {
  document.getElementById('approveReservationModal').classList.remove('show');
}

async function loadPcManagementLabs() {
  try {
    const res = await fetch('/api/dropdowns/lab');
    const data = await res.json();
    const select = document.getElementById('pcManageLabSelect');
    if (!select) return;
    
    if (data.success && data.options) {
      select.innerHTML = '<option value="">Select Lab</option>' + data.options.map(opt => `<option value="${opt.value}">Lab ${opt.value}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading labs for PC management:', error);
  }
}

async function renderPcManagementGrid(lab) {
  const grid = document.getElementById('pcManageGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px 0;">Loading PCs...</div>';
  
  try {
    const token = localStorage.getItem('authToken');
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(`/api/pcs?lab=${lab}&date=${today}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success && data.pcs) {
      grid.innerHTML = '';
      data.pcs.forEach(pc => {
        const pcCard = document.createElement('div');
        pcCard.className = `pc-manage-card pc-status-${pc.status}`;
        pcCard.style.padding = '15px';
        pcCard.style.borderRadius = '8px';
        pcCard.style.border = '1px solid';
        pcCard.style.textAlign = 'center';
        pcCard.style.display = 'flex';
        pcCard.style.flexDirection = 'column';
        pcCard.style.alignItems = 'center';
        pcCard.style.gap = '10px';
        pcCard.style.transition = 'all 0.2s ease';
        
        const isCurrentlyDisabled = pc.status === 'disabled';
        
        if (isCurrentlyDisabled) {
          pcCard.style.background = '#fee2e2';
          pcCard.style.borderColor = '#fecaca';
          pcCard.style.color = '#991b1b';
        } else {
          pcCard.style.background = '#f8fafc';
          pcCard.style.borderColor = '#cbd5e1';
          pcCard.style.color = '#334155';
        }
        
        const iconHtml = `<i class="fa-solid fa-desktop" style="font-size: 24px;"></i>`;
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.padding = '6px 12px';
        btn.style.borderRadius = '4px';
        btn.style.border = 'none';
        btn.style.fontSize = '12px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.width = '100%';
        btn.style.transition = 'background 0.2s';
        
        if (isCurrentlyDisabled) {
          btn.textContent = 'Enable PC';
          btn.style.background = '#10b981';
          btn.style.color = '#fff';
        } else {
          btn.textContent = 'Disable PC';
          btn.style.background = '#ef4444';
          btn.style.color = '#fff';
        }
        
        btn.addEventListener('click', async function() {
          try {
            const newStatus = isCurrentlyDisabled ? 'enabled' : 'disabled';
            const toggleRes = await fetch('/api/admin/pcs/status', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ lab, pcNumber: pc.pc_number, status: newStatus })
            });
            const toggleData = await toggleRes.json();
            if (toggleData.success) {
              renderPcManagementGrid(lab);
            } else {
              alert('Failed to update PC status: ' + toggleData.message);
            }
          } catch (e) {
            console.error('Error toggling PC status:', e);
            alert('Error updating PC status.');
          }
        });
        
        pcCard.innerHTML = `
          ${iconHtml}
          <div style="font-weight: bold; font-size: 14px;">${pc.pc_number}</div>
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; opacity: 0.8;">
            ${isCurrentlyDisabled ? 'Disabled' : 'Enabled'}
          </div>
        `;
        pcCard.appendChild(btn);
        grid.appendChild(pcCard);
      });
    } else {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px 0;">Failed to load PCs list</div>';
    }
  } catch (error) {
    console.error('Error rendering PC grid:', error);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px 0;">Error loading PC grid</div>';
  }
}

window.closeApproveModal = closeApproveModal;

async function loadSitinPcGrid(lab) {
  const pcGroup = document.getElementById('sitinPcSelectionGroup');
  const grid = document.getElementById('sitinPcGrid');
  const selectedInput = document.getElementById('sitinPcNumber');
  
  if (!lab) {
    if (pcGroup) pcGroup.style.display = 'none';
    if (selectedInput) selectedInput.value = '';
    return;
  }
  
  if (pcGroup) pcGroup.style.display = 'block';
  if (selectedInput) selectedInput.value = '';
  if (grid) grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px; font-size: 13px;">Loading PCs...</div>';
  
  try {
    const token = localStorage.getItem('authToken');
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(`/api/pcs?lab=${lab}&date=${today}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success && data.pcs) {
      grid.innerHTML = '';
      data.pcs.forEach(pc => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pc-select-btn pc-status-${pc.status}`;
        btn.style.padding = '6px';
        btn.style.borderRadius = '5px';
        btn.style.border = '1px solid';
        btn.style.fontSize = '11px';
        btn.style.fontWeight = '600';
        btn.style.cursor = pc.status === 'available' ? 'pointer' : 'not-allowed';
        
        if (pc.status === 'available') {
          btn.style.background = '#ecfdf5';
          btn.style.borderColor = '#10b981';
          btn.style.color = '#065f46';
        } else if (pc.status === 'occupied') {
          btn.style.background = '#fee2e2';
          btn.style.borderColor = '#ef4444';
          btn.style.color = '#991b1b';
          btn.disabled = true;
        } else {
          // disabled
          btn.style.background = '#f1f5f9';
          btn.style.borderColor = '#cbd5e1';
          btn.style.color = '#64748b';
          btn.style.opacity = '0.6';
          btn.disabled = true;
        }
        
        btn.innerHTML = `<i class="fa-solid fa-desktop" style="display:block; font-size:12px; margin-bottom:2px;"></i> ${pc.pc_number}`;
        
        if (pc.status === 'available') {
          btn.addEventListener('click', function() {
            // Deselect others
            grid.querySelectorAll('.pc-select-btn').forEach(b => {
              if (b.classList.contains('pc-status-available')) {
                b.style.background = '#ecfdf5';
                b.style.borderColor = '#10b981';
                b.style.color = '#065f46';
                b.style.boxShadow = 'none';
              }
            });
            
            // Select this one
            btn.style.background = '#3b82f6';
            btn.style.borderColor = '#2563eb';
            btn.style.color = '#ffffff';
            btn.style.boxShadow = '0 0 6px rgba(59, 130, 246, 0.5)';
            
            selectedInput.value = pc.pc_number;
          });
        }
        grid.appendChild(btn);
      });
    } else {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px; font-size: 13px;">Failed to load PCs</div>';
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px; font-size: 13px;">Error loading PCs</div>';
  }
}
