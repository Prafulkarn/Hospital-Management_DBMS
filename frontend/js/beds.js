function loadBedsPage() {
  const page = document.getElementById('page-beds');
  page.innerHTML = `
    <h1>🛏️ Beds Management</h1>
    <p class="sub">Manage hospital beds and occupancy</p>
    <div class="toolbar">
      <span id="bed-count">Loading...</span>
      <button class="btn btn-primary" onclick="openAddBedModal()">+ Add Bed</button>
    </div>
    <div id="beds-list"></div>
  `;
  refreshBedsList();
}

async function refreshBedsList() {
  try {
    const beds = await apiFetch('/beds');
    const bedsList = document.getElementById('beds-list');
    
    if (beds.length === 0) {
      bedsList.innerHTML = '<p class="empty">No beds found</p>';
      return;
    }

    document.getElementById('bed-count').textContent = `${beds.filter(b => !b.is_occupied).length} available beds`;

    const html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bed ID</th>
              <th>Ward</th>
              <th>Bed Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${beds.map(bed => `
              <tr>
                <td>#${bed.bed_id}</td>
                <td>${bed.ward}</td>
                <td>${bed.bed_number}</td>
                <td>${bed.is_occupied ? '<span class="badge badge-red">Occupied</span>' : '<span class="badge badge-green">Available</span>'}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="openEditBedModal(${bed.bed_id})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteBed(${bed.bed_id})">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    bedsList.innerHTML = html;
  } catch (err) {
    console.error('Error loading beds:', err);
  }
}

function openAddBedModal() {
  const html = `
    <h2>Add New Bed</h2>
    <div class="form-grid">
      <div class="form-group full"><label>Ward</label><input id="ward" placeholder="e.g., ICU, General, Pediatric" required /></div>
      <div class="form-group full"><label>Bed Number</label><input id="bed_number" placeholder="e.g., A1, B5" required /></div>
      <div class="form-actions">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveBed()">Save Bed</button>
      </div>
    </div>
  `;
  openModal(html);
}

async function openEditBedModal(bedId) {
  try {
    const bed = await apiFetch(`/beds/${bedId}`);
    const html = `
      <h2>Edit Bed</h2>
      <div class="form-grid">
        <div class="form-group full"><label>Ward</label><input id="ward" value="${bed.ward}" required /></div>
        <div class="form-group full"><label>Bed Number</label><input id="bed_number" value="${bed.bed_number}" required /></div>
        <div class="form-group full">
          <label>Status</label>
          <select id="is_occupied">
            <option value="0" ${!bed.is_occupied ? 'selected' : ''}>Available</option>
            <option value="1" ${bed.is_occupied ? 'selected' : ''}>Occupied</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="updateBed(${bedId})">Update Bed</button>
        </div>
      </div>
    `;
    openModal(html);
  } catch (err) {
    console.error('Error loading bed:', err);
  }
}

async function saveBed() {
  try {
    await apiFetch('/beds', {
      method: 'POST',
      body: JSON.stringify({
        ward: document.getElementById('ward').value,
        bed_number: document.getElementById('bed_number').value
      })
    });
    closeModal();
    refreshBedsList();
  } catch (err) {
    console.error('Error saving bed:', err);
  }
}

async function updateBed(bedId) {
  try {
    await apiFetch(`/beds/${bedId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ward: document.getElementById('ward').value,
        bed_number: document.getElementById('bed_number').value,
        is_occupied: document.getElementById('is_occupied').value
      })
    });
    closeModal();
    refreshBedsList();
  } catch (err) {
    console.error('Error updating bed:', err);
  }
}

async function deleteBed(bedId) {
  if (!confirm('Are you sure you want to delete this bed?')) return;
  try {
    await apiFetch(`/beds/${bedId}`, { method: 'DELETE' });
    refreshBedsList();
  } catch (err) {
    console.error('Error deleting bed:', err);
  }
}
