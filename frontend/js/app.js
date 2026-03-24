const pageLoaders = {
  dashboard:    loadDashboard,
  patients:     loadPatients,
  doctors:      loadDoctors,
  departments:  loadDepartmentsPage,
  appointments: loadAppointments,
  beds:         loadBedsPage,
  billing:      loadBilling,
};

//for sidebar
function navigateTo(page) {
  // Update sidebar
  document.querySelectorAll('.sidebar li').forEach(li => {
    li.classList.toggle('active', li.dataset.page === page);
  });

  // Show correct page div
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  // Load data
  if (pageLoaders[page]) pageLoaders[page]();
}

// Sidebar click handlers
document.querySelectorAll('.sidebar li').forEach(li => {
  li.addEventListener('click', () => navigateTo(li.dataset.page));
});

// Boot
navigateTo('dashboard');