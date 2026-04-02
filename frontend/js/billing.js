async function loadBilling() {
  const bills = await apiFetch('/billing');
  const unpaid = bills.filter(b => !b.paid);
  const totalRevenue = bills.filter(b => b.paid).reduce((s, b) => s + parseFloat(b.amount), 0);
  const bedRevenue = bills.filter(b => b.bill_type === 'Bed').reduce((s, b) => s + parseFloat(b.amount), 0);

  document.getElementById('page-billing').innerHTML = `
    <h1>Billing</h1>
    <p class="sub">Manage patient bills and payments</p>
    <div class="stats" style="margin-bottom:24px">
      <div class="stat-card blue"><div class="label">Total Bills</div><div class="value">${bills.length}</div></div>
      <div class="stat-card red"><div class="label">Unpaid</div><div class="value">${unpaid.length}</div></div>
      <div class="stat-card green"><div class="label">Revenue Collected</div><div class="value">Rs.${totalRevenue.toFixed(0)}</div></div>
      <div class="stat-card warn"><div class="label">Bed Charges</div><div class="value">Rs.${bedRevenue.toFixed(0)}</div></div>
    </div>
    <div class="toolbar">
      <span>All bills</span>
      <button class="btn btn-primary" onclick="showGenerateBill()">+ Generate Bill</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Bill ID</th><th>Type</th><th>Patient</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${bills.map(b => `
            <tr>
              <td>#${b.bill_id}</td>
              <td>${badgeBillType(b.bill_type)}</td>
              <td>${b.patient_name}</td>
              <td>Rs. ${parseFloat(b.amount).toFixed(2)}</td>
              <td>${new Date(b.bill_date).toLocaleDateString()}</td>
              <td>${badgePaid(b.paid)}</td>
              <td>
                ${!b.paid
                  ? `<button class="btn btn-sm btn-success" onclick="markPaid(${b.bill_id})">Mark Paid</button>`
                  : '—'}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function badgeBillType(type) {
  const normalized = type || 'Manual';
  const classes = {
    Bed: 'badge-blue',
    Manual: 'badge-warn',
    Appointment: 'badge-green',
  };
  return `<span class="badge ${classes[normalized] || 'badge-blue'}">${normalized}</span>`;
}

async function showGenerateBill() {
  const [patients, appointments] = await Promise.all([
    apiFetch('/patients'),
    apiFetch('/appointments'),
  ]);
  const completed = appointments.filter(a => a.status === 'Completed');

  openModal(`
    <h2>Generate Bill</h2>
    <div class="form-grid">
      <div class="form-group">
        <label>Patient</label>
        <select id="b-patient">
          <option value="">Select patient</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Linked Appointment (optional)</label>
        <select id="b-appt">
          <option value="">None</option>
          ${completed.map(a => `<option value="${a.appt_id}">#${a.appt_id} — ${a.patient_name} with ${a.doctor_name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group full"><label>Amount (Rs.)</label><input id="b-amount" type="number" min="0" placeholder="500" /></div>
      <div class="form-actions">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitGenerateBill()">Generate</button>
      </div>
    </div>
  `);
}

async function submitGenerateBill() {
  const body = {
    patient_id: document.getElementById('b-patient').value,
    appt_id:    document.getElementById('b-appt').value || null,
    amount:     document.getElementById('b-amount').value,
  };
  if (!body.patient_id || !body.amount) return alert('Patient and amount are required.');
  await apiFetch('/billing', { method: 'POST', body: JSON.stringify(body) });
  closeModal();
  loadBilling();
}

async function markPaid(id) {
  if (!confirm('Mark this bill as paid?')) return;
  await apiFetch(`/billing/${id}/pay`, { method: 'PUT' });
  loadBilling();
}