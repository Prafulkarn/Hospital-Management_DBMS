function loadDepartmentsPage() {
  const page = document.getElementById('page-departments');
  page.innerHTML = `
    <h1>🏥 Departments & Locations</h1>
    <p class="sub">Manage hospital departments and locations</p>
    <div class="toolbar">
      <span id="dept-count">Loading...</span>
      <button class="btn btn-primary" onclick="openAddDepartmentModal()">+ Add Department</button>
    </div>
    <div id="departments-list"></div>
  `;
  refreshDepartmentsList();
}

async function refreshDepartmentsList() {
  try {
    const departments = await apiFetch('/departments');
    const deptList = document.getElementById('departments-list');
    
    if (departments.length === 0) {
      deptList.innerHTML = '<p class="empty">No departments found</p>';
      return;
    }

    document.getElementById('dept-count').textContent = `${departments.length} departments`;

    const html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Department ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Doctors</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${departments.map(dept => `
              <tr>
                <td>#${dept.dept_id}</td>
                <td>${dept.name}</td>
                <td>${dept.location || '—'}</td>
                <td><span class="badge badge-blue">${dept.doctor_count || 0} Doctors</span></td>
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
    deptList.innerHTML = html;
  } catch (err) {
    console.error('Error loading departments:', err);
  }
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
