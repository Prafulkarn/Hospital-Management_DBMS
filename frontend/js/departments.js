let departmentsCache = [];
let selectedLocation = 'All';

function loadDepartmentsPage() {
  const page = document.getElementById('page-departments');
  page.innerHTML = `
    <h1>🏥 Departments & Locations</h1>
    <p class="sub">Browse all departments organized by their location blocks</p>
    <div class="toolbar">
      <label class="inline-control">
        <span>Location</span>
        <select id="location-filter" onchange="setLocationFilter(this.value)">
          <option value="All">All locations</option>
        </select>
      </label>
      <div class="toolbar-actions">
        <span id="dept-count">Loading...</span>
        <button class="btn btn-primary" onclick="openAddDepartmentModal()">+ Add Department</button>
      </div>
    </div>
    <div id="location-summary" class="stats"></div>
    <div id="departments-list"></div>
  `;
  refreshDepartmentsList();
}

function setLocationFilter(value) {
  selectedLocation = value;
  const filter = document.getElementById('location-filter');
  if (filter) filter.value = value;
  renderDepartmentsView();
}

async function refreshDepartmentsList() {
  try {
    departmentsCache = await apiFetch('/departments');
    renderDepartmentsView();
  } catch (err) {
    console.error('Error loading departments:', err);
  }
}

function renderDepartmentsView() {
  const deptList = document.getElementById('departments-list');
  const summary = document.getElementById('location-summary');
  if (!deptList || !summary) return;

  // Get unique locations
  const uniqueLocations = [...new Set(departmentsCache
    .map(d => d.location)
    .filter(Boolean))];
  
  // Update location filter dropdown
  const filterSelect = document.getElementById('location-filter');
  if (filterSelect) {
    const currentValue = filterSelect.value;
    filterSelect.innerHTML = `<option value="All">All locations</option>` +
      uniqueLocations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
    filterSelect.value = currentValue;
  }

  // Filter departments
  const visibleDepts = selectedLocation === 'All'
    ? departmentsCache
    : departmentsCache.filter(dept => dept.location === selectedLocation);

  document.getElementById('dept-count').textContent = `${departmentsCache.length} total departments`;

  // Create location summary cards
  const locationBuckets = uniqueLocations
    .map(location => {
      const depts = departmentsCache.filter(d => d.location === location);
      const doctors = depts.reduce((sum, d) => sum + (d.doctor_count || 0), 0);
      return {
        location,
        count: depts.length,
        doctors,
        departments: depts.map(d => d.name),
      };
    })
    .filter(item => item.count > 0);

  // Show only selected location if not "All", otherwise show all
  const displayBuckets = selectedLocation === 'All' ? locationBuckets : locationBuckets.filter(item => item.location === selectedLocation);

  summary.innerHTML = displayBuckets.length
    ? displayBuckets.map(item => `
        <div class="stat-card location-card active" onclick="setLocationFilter('${item.location}')">
          <div class="label">${item.location}</div>
          <div class="value">${item.count}</div>
          <div class="card-sub">Departments</div>
          <div class="card-meta">👨‍⚕️ ${item.doctors} Doctors</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 0.82rem; color: var(--text);">
            ${item.departments.map(name => `<div>• ${name}</div>`).join('')}
          </div>
        </div>
      `).join('')
    : '<div class="empty">No departments with locations yet</div>';

  if (visibleDepts.length === 0) {
    deptList.innerHTML = '<p class="empty">No departments found in this location</p>';
    return;
  }

  deptList.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>📍 Location</th>
            <th>Department</th>
            <th>👨‍⚕️ Doctors</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${visibleDepts.map(dept => `
            <tr>
              <td><strong>${dept.location || '—'}</strong></td>
              <td>${dept.name}</td>
              <td><span class="badge badge-blue">${dept.doctor_count || 0}</span></td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="openEditDepartmentModal(${dept.dept_id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.dept_id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openAddDepartmentModal() {
  const html = `
    <h2>Add New Department</h2>
    <div class="form-grid">
      <div class="form-group full"><label>Department Name</label><input id="dept_name" placeholder="e.g., Cardiology, Neurology" required /></div>
      <div class="form-group full"><label>Location</label><input id="location" placeholder="e.g., Building A, Floor 3" required /></div>
      <div class="form-actions">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveDepartment()">Save Department</button>
      </div>
    </div>
  `;
  openModal(html);
}

async function openEditDepartmentModal(deptId) {
  try {
    const dept = await apiFetch(`/departments/${deptId}`);
    const html = `
      <h2>Edit Department</h2>
      <div class="form-grid">
        <div class="form-group full"><label>Department Name</label><input id="dept_name" value="${dept.name}" required /></div>
        <div class="form-group full"><label>Location</label><input id="location" value="${dept.location || ''}" required /></div>
        <div class="form-actions">
          <button class="btn" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="updateDepartment(${deptId})">Update Department</button>
        </div>
      </div>
    `;
    openModal(html);
  } catch (err) {
    console.error('Error loading department:', err);
  }
}

async function saveDepartment() {
  try {
    await apiFetch('/departments', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('dept_name').value,
        location: document.getElementById('location').value
      })
    });
    closeModal();
    refreshDepartmentsList();
  } catch (err) {
    console.error('Error saving department:', err);
  }
}

async function updateDepartment(deptId) {
  try {
    await apiFetch(`/departments/${deptId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('dept_name').value,
        location: document.getElementById('location').value
      })
    });
    closeModal();
    refreshDepartmentsList();
  } catch (err) {
    console.error('Error updating department:', err);
  }
}

async function deleteDepartment(deptId) {
  if (!confirm('Are you sure you want to delete this department?')) return;
  try {
    await apiFetch(`/departments/${deptId}`, { method: 'DELETE' });
    refreshDepartmentsList();
  } catch (err) {
    console.error('Error deleting department:', err);
  }
}
