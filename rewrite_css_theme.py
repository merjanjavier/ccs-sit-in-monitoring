from pathlib import Path

css_files = {
    'style.css': """/* Global theme */
:root {
  color-scheme: dark;
  --bg-start: #071b2f;
  --bg-end: #143d5b;
  --surface: rgba(255, 255, 255, 0.94);
  --surface-strong: rgba(255, 255, 255, 0.98);
  --surface-soft: rgba(255, 255, 255, 0.16);
  --text: #071b2f;
  --text-muted: #5b7185;
  --accent: #2edbce;
  --accent-strong: #0ca89f;
  --border: rgba(255, 255, 255, 0.25);
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: radial-gradient(circle at top left, rgba(46, 219, 206, 0.18), transparent 28%),
              radial-gradient(circle at right, rgba(255, 255, 255, 0.12), transparent 22%),
              linear-gradient(135deg, var(--bg-start), var(--bg-end));
  color: var(--text);
  min-height: 100vh;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 18px 6vw;
  background: rgba(10, 35, 58, 0.88);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo .img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.title {
  color: #f7fafc;
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 700;
  letter-spacing: 0.03em;
}

.links {
  display: flex;
  align-items: center;
  gap: clamp(18px, 3.5vw, 40px);
}

.links a {
  color: rgba(247, 250, 252, 0.9);
  text-decoration: none;
  font-size: clamp(14px, 1.4vw, 18px);
  transition: color 0.25s ease, transform 0.25s ease;
}

.links a:hover {
  color: #ffffff;
  transform: translateY(-1px);
}

.mobile-menu-toggle {
  display: none;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-direction: column;
  gap: 6px;
}

.mobile-menu-toggle span {
  width: 26px;
  height: 3px;
  border-radius: 999px;
  background: #f8fafc;
}

.main {
  min-height: calc(100vh - 100px);
  display: grid;
  place-items: center;
  padding: 70px 20px 40px;
}

.content {
  width: min(100%, 1100px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.82));
  border-radius: 32px;
  box-shadow: var(--shadow);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
}

.content::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at left 20% top 20%, rgba(46, 219, 206, 0.18), transparent 20%),
              radial-gradient(circle at right 18% bottom 18%, rgba(71, 123, 255, 0.14), transparent 25%);
}

.content > * {
  position: relative;
  z-index: 1;
}

.content img.main-logo {
  max-width: 280px;
  width: 100%;
  object-fit: contain;
}

.content .hero-text {
  padding: 60px 60px 60px 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
}

.welcome-text {
  margin: 0;
  font-size: clamp(2.6rem, 4vw, 4.4rem);
  line-height: 1.04;
  color: #081d32;
}

.subtitle {
  margin: 0;
  max-width: 580px;
  font-size: clamp(1rem, 1.6vw, 1.4rem);
  color: var(--text-muted);
  line-height: 1.8;
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.btn-primary,
.btn-secondary {
  padding: 14px 34px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent), #41c5c0);
  color: #07222d;
  box-shadow: 0 18px 32px rgba(46, 219, 206, 0.28);
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.88);
  color: #0f334b;
  border: 1px solid rgba(15, 51, 75, 0.14);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 1);
}

.leaderboard-section {
  padding: 60px 6vw 80px;
}

.leaderboard-header {
  max-width: 760px;
  margin: 0 auto 40px;
  text-align: center;
  color: #f8fafc;
}

.section-title {
  margin: 0 0 16px;
  font-size: clamp(2rem, 3vw, 2.6rem);
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: #ffffff;
}

.section-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: clamp(1rem, 1.2vw, 1.15rem);
}

.leaderboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.leaderboard-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 55, 97, 0.1);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
}

.card-title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  color: #102840;
  display: flex;
  align-items: center;
  gap: 12px;
}

.podium-wrapper,
.preview-table-container {
  min-height: 220px;
}

.loading-state,
.loading-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-muted);
}

.spinner,
.spinner-small {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(15, 51, 75, 0.12);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border-width: 3px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  color: #20314d;
}

.preview-table th,
.preview-table td {
  padding: 14px 16px;
  text-align: left;
}

.preview-table th {
  color: #0d2c45;
  font-weight: 700;
  font-size: 0.95rem;
  border-bottom: 1px solid rgba(15, 55, 97, 0.12);
}

.preview-table tbody tr {
  transition: background 0.25s ease;
}

.preview-table tbody tr:hover {
  background: rgba(46, 219, 206, 0.08);
}

.view-more-container {
  margin-top: 24px;
  text-align: right;
}

.btn-view-more {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  border-radius: 999px;
  background: rgba(15, 51, 75, 0.08);
  color: #102840;
  text-decoration: none;
  font-weight: 700;
}

.btn-view-more:hover {
  background: rgba(15, 51, 75, 0.14);
}

@media screen and (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }
  .content .hero-text {
    padding: 50px 40px;
  }
  .leaderboard-grid {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 768px) {
  .nav {
    padding: 18px 20px;
  }
  .links {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background: rgba(10, 35, 58, 0.96);
    flex-direction: column;
    gap: 0;
    padding: 18px;
    display: none;
  }
  .links.active {
    display: flex;
  }
  .mobile-menu-toggle {
    display: flex;
  }
  .cta-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  .main {
    padding-top: 100px;
  }
}
""",
    'admin.css': """/* Admin dashboard theme */
:root {
  --bg-start: #041926;
  --bg-end: #0f3d5f;
  --panel: rgba(255, 255, 255, 0.92);
  --panel-strong: rgba(255, 255, 255, 0.98);
  --text-main: #112a45;
  --text-muted: #536d86;
  --accent: #52c7b8;
  --accent-strong: #1aa79d;
  --border: rgba(16, 36, 61, 0.14);
  --shadow: 0 24px 60px rgba(3, 18, 37, 0.16);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(180deg, #071824 0%, #102f4b 55%, #163f5f 100%);
  color: var(--text-main);
  min-height: 100vh;
}

.admin-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 18px 5vw;
  background: rgba(9, 28, 48, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.college-name {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.admin-label {
  color: var(--accent);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.nav-link {
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  padding: 10px 16px;
  border-radius: 999px;
  transition: all 0.25s ease;
  font-size: 0.95rem;
}

.nav-link:hover,
.nav-link.active {
  background: rgba(82, 199, 184, 0.16);
  color: #ffffff;
}

.nav-dropdown {
  position: relative;
}

.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 12px 0;
}

.nav-dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: #1b3b55;
  text-decoration: none;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(82, 199, 184, 0.14);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notif-btn {
  position: relative;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #ecf6ff;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.2s ease, background 0.2s ease;
}

.notif-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.14);
}

.notif-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ff5d72;
  color: white;
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logout-btn {
  background: linear-gradient(135deg, #ff6e7f, #ff9a7f);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 700;
}

.logout-btn:hover {
  filter: brightness(1.05);
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  flex-direction: column;
  gap: 6px;
}

.mobile-menu-toggle span {
  width: 28px;
  height: 3px;
  border-radius: 999px;
  background: #ffffff;
}

.admin-main {
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: 36px 5vw 60px;
}

.bottom-section {
  display: grid;
  grid-template-columns: 1.2fr 0.95fr;
  gap: 30px;
}

.column {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(15, 50, 78, 0.12);
  border-radius: 28px;
  box-shadow: var(--shadow);
}

.card-header {
  background: linear-gradient(135deg, rgba(82, 199, 184, 0.16), rgba(15, 51, 75, 0.12));
  padding: 24px 28px;
  border-bottom: 1px solid rgba(15, 50, 78, 0.08);
}

.card-header h2 {
  margin: 0;
  color: #0f354f;
  font-size: 1.3rem;
}

.stats-grid {
  display: grid;
  gap: 20px;
  padding: 26px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(15, 51, 75, 0.04);
  border: 1px solid rgba(15, 51, 75, 0.08);
}

.stat-label {
  font-size: 0.96rem;
  color: #415b76;
  font-weight: 600;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #102840;
}

.language-graph {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.radar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.radar-legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5b748a;
  font-size: 0.87rem;
}

.radar-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.announcement-column {
  display: flex;
  flex-direction: column;
}

.announcement-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.announcement-icon {
  font-size: 24px;
  color: var(--accent);
}

.new-assignment {
  padding: 24px 28px 10px;
}

.new-assignment h3 {
  margin: 0;
  color: #2f4b6f;
  font-size: 1rem;
  font-weight: 700;
}

.post-announcement {
  padding: 0 28px 24px;
}

.post-announcement textarea {
  width: 100%;
  min-height: 150px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(15, 51, 75, 0.12);
  background: rgba(255, 255, 255, 0.96);
  font-size: 1rem;
  color: #102840;
  resize: vertical;
}

.post-announcement textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(82, 199, 184, 0.14);
}

.submit-btn {
  margin-top: 16px;
  padding: 14px 24px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #0bbbad);
  color: #0f334b;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:hover {
  transform: translateY(-1px);
}

.posted-announcements {
  padding: 24px 28px 28px;
}

.posted-announcements h3 {
  margin: 0 0 18px;
  color: #0f334b;
  font-size: 1.05rem;
}

.announcements-list {
  display: grid;
  gap: 16px;
  max-height: 360px;
  overflow-y: auto;
}

.announcement-item {
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(15, 51, 75, 0.03);
  border: 1px solid rgba(15, 51, 75, 0.08);
}

.announcement-date {
  font-size: 0.82rem;
  color: #5b748a;
  margin-bottom: 10px;
}

.announcement-content {
  font-size: 0.98rem;
  color: #31455f;
  line-height: 1.65;
}

.no-announcements {
  text-align: center;
  color: #6d8398;
  padding: 36px 12px;
}

.student-info-section {
  max-width: 1280px;
  margin: 0 auto 72px;
  padding: 0 5vw;
}

.section-header-center {
  padding: 26px 0 18px;
  text-align: center;
}

.student-info-content {
  display: grid;
  gap: 30px;
}

.leaderboard-container {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 30px;
  border: 1px solid rgba(15, 51, 75, 0.12);
  box-shadow: var(--shadow);
}

.top-performers-section {
  margin-bottom: 40px;
}

.section-title h2 {
  margin: 0 0 24px;
  font-size: 1.85rem;
  color: #102840;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.podium-item {
  width: min(180px, 100%);
  padding: 28px 20px 20px;
  border-radius: 28px;
  background: linear-gradient(180deg, #ffffff, #f7fafc);
  box-shadow: 0 24px 50px rgba(15, 50, 78, 0.1);
  position: relative;
  text-align: center;
}

.podium-item .avatar {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  background: rgba(82, 199, 184, 0.16);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  color: #0f334b;
  font-weight: 700;
}

.podium-rank {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -16px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 700;
  box-shadow: 0 12px 20px rgba(15, 50, 78, 0.18);
}

.podium-item.first .podium-rank {
  background: linear-gradient(135deg, #ffb72b, #ff8244);
}

.podium-item.second .podium-rank {
  background: #8f9bb3;
}

.podium-item.third .podium-rank {
  background: #c07b3a;
}

.podium-item.first { height: 260px; }
.podium-item.second { height: 230px; }
.podium-item.third { height: 210px; }

.podium-name {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 700;
  color: #0f334b;
}

.podium-points {
  color: var(--accent-strong);
  font-weight: 700;
}

.full-leaderboard-section {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 26px;
  box-shadow: 0 22px 50px rgba(15, 50, 78, 0.08);
}

.full-leaderboard-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
}

.full-leaderboard-section h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #102840;
}

.table-search input {
  width: min(280px, 100%);
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid rgba(15, 51, 75, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: #102840;
}

.table-search input:focus {
  outline: none;
  border-color: #3fc2b8;
  box-shadow: 0 0 0 4px rgba(63, 194, 184, 0.12);
}

.table-container {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(15, 51, 75, 0.08);
}

.leaderboard-table th {
  text-align: left;
  color: #102840;
  font-weight: 700;
  background: rgba(15, 51, 75, 0.04);
}

.leaderboard-table tr:hover {
  background: rgba(63, 194, 184, 0.08);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-weight: 700;
}

.rank-1 { background: #ffb333; }
.rank-2 { background: #8f9bb3; }
.rank-3 { background: #c07b3a; }

@media (max-width: 992px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .leaderboard-container {
    padding: 32px 18px 44px;
  }

  .podium {
    gap: 16px;
  }

  .podium-item {
    width: 140px;
  }

  .full-leaderboard-section .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-search input {
    width: 100%;
  }
}
""",
    'Profile.css': """* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #081b2a 0%, #0e3454 40%, #143f61 100%);
  color: #f8fafc;
}

.dashboard-main {
  min-height: calc(100vh - 80px);
  width: 100%;
  padding: 32px 4vw 48px;
}

.dashboard-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.column {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: fadeInUp 0.6s ease;
}

.column-header {
  background: linear-gradient(135deg, rgba(46, 219, 206, 0.18), rgba(15, 51, 75, 0.16));
  padding: 22px;
  text-align: center;
}

.column-header h2 {
  margin: 0;
  color: #102840;
  font-size: 1.35rem;
  font-weight: 700;
}

.student-info-content,
.announcement-content,
.rules-content {
  padding: 28px;
}

.profile-photo-section {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.profile-photo {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  border: 6px solid rgba(46, 219, 206, 0.35);
  background: rgba(15, 51, 75, 0.06);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.profile-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-photo-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1aa79d;
  border: none;
  color: white;
  cursor: pointer;
}

.divider-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, #1aa79d, transparent);
  margin: 26px 0;
}

.student-details {
  display: grid;
  gap: 18px;
}

.detail-item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(15, 51, 75, 0.05);
  border: 1px solid rgba(15, 51, 75, 0.09);
}

.detail-label {
  font-weight: 700;
  color: #102840;
}

.detail-value {
  color: #4d6a83;
}

.sessions-item {
  background: rgba(46, 219, 206, 0.1);
  border-color: rgba(46, 219, 206, 0.25);
}

.sessions-value {
  color: #114b61;
  font-weight: 700;
}

.announcement-item,
.rule-item {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 51, 75, 0.10);
  padding: 18px;
  border-radius: 18px;
}

.announcement-item:hover,
.rule-item:hover {
  transform: translateY(-1px);
}

.announcement-line,
.rule-number {
  color: #1aa79d;
}

.announcement-message,
.rule-item p,
.rules-intro {
  color: #4b6780;
}

@media (max-width: 1100px) {
  .dashboard-columns {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 780px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }

  .student-info-content,
  .announcement-content,
  .rules-content {
    padding: 22px;
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(18px);} to { opacity: 1; transform: translateY(0);} 
}
""",
    'Leaderboard.css': """* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #081c30 0%, #0f3b60 45%, #134369 100%);
  color: #f8fafc;
}

.leaderboard-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 42px 4vw 60px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 26px 72px rgba(0, 0, 0, 0.18);
  transition: transform 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.card-header h3 {
  margin: 0 0 18px;
  color: #102840;
  font-size: 1.2rem;
}

.performance-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.stat-item {
  text-align: left;
}

.stat-label {
  font-size: 0.9rem;
  color: #5b748a;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #102840;
}

.top-performers-section {
  margin-bottom: 42px;
}

.section-title h2 {
  margin: 0 0 28px;
  color: #f8fafc;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-title h2 i {
  color: #48d9c7;
}

.podium {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: 22px;
}

.podium-item {
  width: min(180px, 100%);
  padding: 26px 20px 20px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
  position: relative;
  text-align: center;
}

.podium-item .avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(15, 51, 75, 0.08);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  font-size: 1.4rem;
  color: #102840;
}

.podium-rank {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -18px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: white;
}

.podium-item.first .podium-rank {
  background: linear-gradient(135deg, #ffb333, #ff8244);
}

.podium-item.second .podium-rank {
  background: #8f9bb3;
}

.podium-item.third .podium-rank {
  background: #c07b3a;
}

.podium-name {
  margin: 0 0 8px;
  color: #102840;
  font-weight: 700;
}

.podium-points {
  color: #1aa79d;
  font-weight: 700;
}

.full-leaderboard-section {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
}

.full-leaderboard-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 26px;
}

.full-leaderboard-section h2 {
  margin: 0;
  color: #102840;
  font-size: 1.45rem;
}

.table-search input {
  width: min(320px, 100%);
  padding: 14px 18px;
  border-radius: 999px;
  border: 1px solid rgba(15, 51, 75, 0.14);
  background: rgba(255, 255, 255, 0.95);
  color: #102840;
}

.table-search input:focus {
  outline: none;
  border-color: #3fc2b8;
  box-shadow: 0 0 0 4px rgba(63, 194, 184, 0.14);
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(15, 51, 75, 0.08);
}

.leaderboard-table th {
  text-align: left;
  color: #102840;
  font-weight: 700;
  background: rgba(15, 51, 75, 0.04);
}

.leaderboard-table tr:hover {
  background: rgba(63, 194, 184, 0.08);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-weight: 700;
}

.rank-1 { background: #ffb333; }
.rank-2 { background: #8f9bb3; }
.rank-3 { background: #c07b3a; }

@media (max-width: 992px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .leaderboard-container {
    padding: 32px 18px 44px;
  }

  .podium {
    gap: 16px;
  }

  .podium-item {
    width: 140px;
  }

  .full-leaderboard-section .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-search input {
    width: 100%;
  }
}
"""
}

for filename, content in css_files.items():
    Path(filename).write_text(content, encoding='utf-8')
print('CSS files updated:', ', '.join(css_files.keys()))
