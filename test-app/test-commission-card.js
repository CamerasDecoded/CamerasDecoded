// commission-card.js – Commission tracking card + modal popup
// Use on test-operator-dashboard.html and test-instructor-dashboard.html

console.log('✅ commission-card.js loading...');

// ================================================================
// COMMISSION MODAL POPUP
// ================================================================
function createCommissionModal(stats) {
  const modal = document.createElement('div');
  modal.id = 'commissionModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: #0A0A0A;
    border: 1px solid #1A1A1A;
    border-radius: 12px;
    padding: 28px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    animation: slideUp 0.3s ease;
    font-family: sans-serif;
    position: relative;
  `;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    color: #888;
    font-size: 24px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.color = '#8deb00'; closeBtn.style.background = 'rgba(141,235,0,0.1)'; };
  closeBtn.onmouseout = () => { closeBtn.style.color = '#888'; closeBtn.style.background = 'transparent'; };
  closeBtn.onclick = () => modal.remove();
  card.appendChild(closeBtn);

  // Title
  const title = document.createElement('h2');
  title.textContent = '💰 Commission Earnings';
  title.style.cssText = 'color:#8deb00;font-size:20px;margin:0 0 20px 0;font-weight:700;';
  card.appendChild(title);

  // Stats grid
  const statsGrid = document.createElement('div');
  statsGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  `;

  // Total earnings
  const earningsStat = document.createElement('div');
  earningsStat.style.cssText = `
    background: rgba(141,235,0,0.1);
    border: 1px solid rgba(141,235,0,0.2);
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  `;
  earningsStat.innerHTML = `
    <div style="font-size:28px;font-weight:700;color:#8deb00;">$${stats.totalEarnings.toFixed(2)}</div>
    <div style="font-size:12px;color:#888;margin-top:4px;text-transform:uppercase;">Total Earnings</div>
  `;
  statsGrid.appendChild(earningsStat);

  // Total referrals
  const referralsStat = document.createElement('div');
  referralsStat.style.cssText = `
    background: rgba(141,235,0,0.1);
    border: 1px solid rgba(141,235,0,0.2);
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  `;
  referralsStat.innerHTML = `
    <div style="font-size:28px;font-weight:700;color:#8deb00;">${stats.totalReferrals}</div>
    <div style="font-size:12px;color:#888;margin-top:4px;text-transform:uppercase;">Total Referrals</div>
  `;
  statsGrid.appendChild(referralsStat);
  card.appendChild(statsGrid);

  // Recent sales
  const recentTitle = document.createElement('h3');
  recentTitle.textContent = 'Recent Sales';
  recentTitle.style.cssText = 'color:#fff;font-size:14px;margin:20px 0 12px 0;font-weight:600;text-transform:uppercase;font-family:monospace;';
  card.appendChild(recentTitle);

  const recentSalesList = document.createElement('div');
  recentSalesList.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

  if (!stats.recentSales || stats.recentSales.length === 0) {
    const noSales = document.createElement('p');
    noSales.textContent = 'No sales yet. Share your code to start earning!';
    noSales.style.cssText = 'color:#666;font-size:13px;text-align:center;padding:20px 0;';
    recentSalesList.appendChild(noSales);
  } else {
    stats.recentSales.slice(0, 20).forEach(sale => {
      const saleItem = document.createElement('div');
      saleItem.style.cssText = `
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.04);
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
      `;

      const saleDate = sale.date && sale.date.toDate ? sale.date.toDate() : new Date(sale.date);
      const dateStr = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      saleItem.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong style="color:#8deb00;">${sale.buyerName || 'User'}</strong>
          <strong style="color:#8deb00;">+$${sale.amount.toFixed(2)}</strong>
        </div>
        <div style="color:#666;font-size:11px;">
          ${sale.product || 'Camera Confidence Guide'} • ${dateStr}
        </div>
      `;
      recentSalesList.appendChild(saleItem);
    });
  }

  card.appendChild(recentSalesList);

  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  modal.appendChild(card);
  document.body.appendChild(modal);

  // Add animation styles once
  if (!document.getElementById('commissionCardStyles')) {
    const style = document.createElement('style');
    style.id = 'commissionCardStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ================================================================
// LOAD COMMISSION DATA FROM FIRESTORE
// ================================================================
async function loadCommissionStats(uid) {
  try {
    const doc = await firebase.firestore().collection('users').doc(uid).get();
    if (!doc.exists) {
      console.warn('User doc not found');
      return null;
    }

    const stats = doc.data().referralStats || {
      totalEarnings: 0,
      totalReferrals: 0,
      recentSales: []
    };

    console.log('✅ Commission stats loaded:', stats);
    return stats;
  } catch (err) {
    console.error('Error loading commission stats:', err);
    return null;
  }
}

// ================================================================
// OPEN MODAL (public)
// ================================================================
window.openCommissionModal = async function() {
  const uid = firebase.auth().currentUser?.uid;
  if (!uid) {
    console.warn('Not logged in');
    return;
  }

  let stats = await loadCommissionStats(uid);
  if (!stats) {
    stats = {
      totalEarnings: 0,
      totalReferrals: 0,
      recentSales: []
    };
  }

  createCommissionModal(stats);
};

// ================================================================
// COMMISSION CARD COMPONENT
// ================================================================
function createCommissionCard() {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #0A0A0A;
    border: 1px solid #1A1A1A;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
  `;
  card.onmouseover = () => {
    card.style.borderColor = '#8deb00';
    card.style.background = 'rgba(141,235,0,0.02)';
  };
  card.onmouseout = () => {
    card.style.borderColor = '#1A1A1A';
    card.style.background = '#0A0A0A';
  };
  card.onclick = window.openCommissionModal;

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
      <h3 style="color:#8deb00;font-size:16px;margin:0;font-weight:700;">💰 Commissions</h3>
      <span style="color:#666;font-size:12px;">Click to view</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div style="font-size:24px;font-weight:700;color:#8deb00;" id="cardTotalEarnings">$0.00</div>
        <div style="font-size:11px;color:#888;text-transform:uppercase;margin-top:4px;">Total Earned</div>
      </div>
      <div>
        <div style="font-size:24px;font-weight:700;color:#8deb00;" id="cardTotalReferrals">0</div>
        <div style="font-size:11px;color:#888;text-transform:uppercase;margin-top:4px;">Referrals</div>
      </div>
    </div>
  `;

  return card;
}

// ================================================================
// INSERT COMMISSION CARD INTO DASHBOARD
// ================================================================
window.insertCommissionCard = function(containerId, position = 'after') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('Container not found:', containerId);
    return;
  }

  const card = createCommissionCard();

  if (position === 'after') {
    container.insertAdjacentElement('afterend', card);
  } else if (position === 'before') {
    container.insertAdjacentElement('beforebegin', card);
  } else {
    container.appendChild(card);
  }

  // Load and update card with real data
  const uid = firebase.auth().currentUser?.uid;
  if (uid) {
    loadCommissionStats(uid).then(stats => {
      if (stats) {
        document.getElementById('cardTotalEarnings').textContent = '$' + stats.totalEarnings.toFixed(2);
        document.getElementById('cardTotalReferrals').textContent = stats.totalReferrals;
      }
    });
  }

  return card;
};

console.log('✅ commission-card.js loaded');