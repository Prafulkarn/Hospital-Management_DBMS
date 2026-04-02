const BED_WARDS = ['General', 'Isolated', 'ICU'];
const BED_RATES = {
  General: 1000,
  Isolated: 1800,
  ICU: 3500,
};

let bedsCache = [];
let selectedWard = 'All';

function defaultRateForWard(ward) {
  return BED_RATES[ward] || 0;
}

function loadBedsPage() {
  const page = document.getElementById('page-beds');
  page.innerHTML = `
    <h1>🛏️ Beds Management</h1>
    <p class="sub">Choose a ward first, then allocate or release beds from the patient list.</p>
    <div class="toolbar">
      <label class="inline-control">
        <span>Ward</span>
        <select id="ward-filter" onchange="setWardFilter(this.value)">
          <option value="All">All wards</option>
          ${BED_WARDS.map(ward => `<option value="${ward}">${ward}</option>`).join('')}
        </select>
      </label>
      <div class="toolbar-actions">
        <span id="bed-count">Loading...</span>
        <button class="btn btn-primary" onclick="openAddBedModal()">+ Add Bed</button>
      </div>
    </div>
    <div id="ward-summary" class="stats"></div>
    <div id="beds-list"></div>
  `;
  refreshBedsList();
}

function setWardFilter(value) {
  selectedWard = value;
  const filter = document.getElementById('ward-filter');
  if (filter) filter.value = value;
  renderBedsView();
}

async function refreshBedsList() {
  try {
    bedsCache = await apiFetch('/beds');
    renderBedsView();
  } catch (err) {
    console.error('Error loading beds:', err);
  }
}

function renderBedsView() {
  const bedsList = document.getElementById('beds-list');
  const summary = document.getElementById('ward-summary');
  if (!bedsList || !summary) return;

  const visibleBeds = selectedWard === 'All'
    ? bedsCache
    : bedsCache.filter(bed => bed.ward === selectedWard);

  const availableBeds = bedsCache.filter(bed => !bed.is_occupied).length;
  const occupiedBeds = bedsCache.length - availableBeds;
  document.getElementById('bed-count').textContent = `${availableBeds} available, ${occupiedBeds} occupied`;

  const wardBuckets = BED_WARDS
    .map(ward => {
      const beds = bedsCache.filter(bed => bed.ward === ward);
      const available = beds.filter(bed => !bed.is_occupied).length;
      return {
        ward,
        total: beds.length,
        available,
        occupied: beds.length - available,
        rate: defaultRateForWard(ward),
      };
    })
    .filter(item => item.total > 0 || selectedWard === 'All');

  summary.innerHTML = wardBuckets.length
    ? wardBuckets.map(item => `
        <div class="stat-card ward-card ${selectedWard === item.ward ? 'active' : ''}" onclick="setWardFilter('${item.ward}')">
          <div class="label">${item.ward}</div>
          <div class="value">${item.available}/${item.total}</div>
          <div class="card-sub">Available beds</div>
          <div class="card-meta">Rate Rs.${item.rate}/day</div>
        </div>
      `).join('')
    : '<div class="empty">No beds configured yet</div>';

  if (visibleBeds.length === 0) {
    bedsList.innerHTML = '<p class="empty">No beds found in this ward</p>';
    return;
  }

  bedsList.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Bed ID</th>
            <th>Ward</th>
            <th>Bed Number</th>
            <th>Rate / Day</th>
            <th>Status</th>
            <th>Patient</th>
            <th>Stay</th>
            <th>Charge</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${visibleBeds.map(bed => `
            <tr>
              <td>#${bed.bed_id}</td>
              <td>${bed.ward}</td>
              <td>${bed.bed_number}</td>
              <td>Rs. ${parseFloat(bed.daily_rate || 0).toFixed(2)}</td>
              <td>${bed.is_occupied ? '<span class="badge badge-red">Occupied</span>' : '<span class="badge badge-green">Available</span>'}</td>
              <td>${bed.patient_name || '—'}</td>
              <td>${bed.is_occupied ? `${bed.stay_days || 0} day(s)` : '—'}</td>
              <td>${bed.is_occupied ? `Rs. ${parseFloat(bed.current_charge || 0).toFixed(2)}` : '—'}</td>
              <td>
                ${bed.is_occupied
                  ? `<button class="btn btn-sm btn-success" onclick="releaseBed(${bed.bed_id})">Release</button>`
                  : `<button class="btn btn-sm btn-primary" onclick="openAllocateBedModal(${bed.bed_id})">Allocate</button>`}
                <button class="btn btn-sm btn-primary" onclick="openEditBedModal(${bed.bed_id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBed(${bed.bed_id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function wardOptions(selected = '') {
  return BED_WARDS.map(ward => `<option value="${ward}" ${ward === selected ? 'selected' : ''}>${ward}</option>`).join('');
}

function openAddBedModal() {
  openModal(`
    <h2>Add New Bed</h2>
    <div class="form-grid">
      <div class="form-group full">
        <label>Ward</label>
        <select id="ward" onchange="document.getElementById('daily_rate').value = defaultRateForWard(this.value)">
          ${wardOptions(BED_WARDS[0])}
        </select>
      </div>
      <div class="form-group full"><label>Bed Number</label><input id="bed_number" placeholder="e.g., G-03" required /></div>
      <div class="form-group full"><label>Daily Rate (Rs.)</label><input id="daily_rate" type="number" min="0" value="${defaultRateForWard(BED_WARDS[0])}" required /></div>
      <div class="form-actions">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveBed()">Save Bed</button>
      </div>
    </div>
  `);
}

async function openEditBedModal(bedId) {
  try {
    const bed = await apiFetch(`/beds/${bedId}`);
    openModal(`
      <h2>Edit Bed</h2>
      <div class="form-grid">
        <div class="form-group full">
          <label>Ward</label>
          <select id="ward">
            ${wardOptions(bed.ward)}
          </select>
        </div>
        <div class="form-group full"><label>Bed Number</label><input id="bed_number" value="${bed.bed_number}" required /></div>
        <div class="form-group full"><label>Daily Rate (Rs.)</label><input id="daily_rate" type="number" min="0" value="${parseFloat(bed.daily_rate || 0).toFixed(2)}" required /></div>
        <div class="form-group full">
          <label>Current Status</label>
          <input value="${bed.is_occupied ? `Occupied by ${bed.patient_name || 'patient'}` : 'Available'}" disabled />
        </div>
        <div class="form-actions">
          <button class="btn" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="updateBed(${bedId})">Update Bed</button>
        </div>
      </div>
    `);
  } catch (err) {
    console.error('Error loading bed:', err);
  }
}

async function openAllocateBedModal(bedId) {
  try {
    const [bed, patients] = await Promise.all([
      apiFetch(`/beds/${bedId}`),
      apiFetch('/patients'),
    ]);
    openModal(`
      <h2>Allocate Bed</h2>
      <div class="form-grid">
        <div class="form-group full">
          <label>Ward</label>
          <input value="${bed.ward}" disabled />
        </div>
        <div class="form-group full">
          <label>Bed</label>
          <input value="#${bed.bed_number} - Rs. ${parseFloat(bed.daily_rate || 0).toFixed(2)} / day" disabled />
        </div>
        <div class="form-group full">
          <label>Patient</label>
          <select id="bed-patient">
            <option value="">Select patient</option>
            ${patients.map(patient => `<option value="${patient.patient_id}">${patient.name} (#${patient.patient_id})</option>`).join('')}
          </select>
        </div>
        <div class="form-actions">
          <button class="btn" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="allocateBed(${bedId})">Allocate</button>
        </div>
      </div>
    `);
  } catch (err) {
    console.error('Error loading allocation data:', err);
  }
}

async function saveBed() {
  try {
    await apiFetch('/beds', {
      method: 'POST',
      body: JSON.stringify({
        ward: document.getElementById('ward').value,
        bed_number: document.getElementById('bed_number').value,
        daily_rate: document.getElementById('daily_rate').value,
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
        daily_rate: document.getElementById('daily_rate').value,
      })
    });
    closeModal();
    refreshBedsList();
  } catch (err) {
    console.error('Error updating bed:', err);
  }
}

async function allocateBed(bedId) {
  try {
    const patientId = document.getElementById('bed-patient').value;
    if (!patientId) return alert('Please select a patient.');

    const result = await apiFetch(`/beds/${bedId}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId })
    });
    closeModal();
    refreshBedsList();
    alert(result.message || 'Bed allocated successfully');
  } catch (err) {
    console.error('Error allocating bed:', err);
  }
}

async function releaseBed(bedId) {
  if (!confirm('Release this bed and generate the bed charge bill?')) return;
  try {
    const result = await apiFetch(`/beds/${bedId}/release`, { method: 'POST' });
    refreshBedsList();
    alert(`Bed released. ${result.patient_name ? `${result.patient_name} was billed Rs. ${parseFloat(result.charge || 0).toFixed(2)} for ${result.stay_days} day(s).` : 'Bed charge added to billing.'}`);
  } catch (err) {
    console.error('Error releasing bed:', err);
  }
}

async function deleteBed(bedId) {
  if (!confirm('Delete this bed?')) return;
  try {
    await apiFetch(`/beds/${bedId}`, { method: 'DELETE' });
    refreshBedsList();
  } catch (err) {
    console.error('Error deleting bed:', err);
  }
}
