// commission-card.js – Production version
// Displays commission stats and a clickable modal on dashboards.

console.log('💰 Commission card module loaded');

(function() {
  'use strict';

  // Wait for Firebase auth and db to be available
  function getDb() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      return firebase.firestore();
    }
    return null;
  }

  function getAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      return firebase.auth();
    }
    return null;
  }

  // ================================================================
  // LOAD COMMISSION STATS
  // ================================================================
  async function loadCommissionStats(uid) {
    const db = getDb();
    if (!db) return null;
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) return null;
      const data = userDoc.data();

      // Build stats from user doc
      const stats = {
        totalEarnings: data.totalCommissionEarned || 0,
        totalReferrals: data.totalReferrals || 0,
        recentSales: []
      };

      // Try to fetch recent commissions from subcollection (if exists)
      try {
        const commissionsSnap = await db.collection('users')
          .doc(uid)
          .collection('commissions')
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();

        commissionsSnap.forEach(doc => {
          const c = doc.data();
          stats.recentSales.push({
            buyerName: c.buyerName || 'Anonymous',
            amount: c.amount || 0,
            product: c.productName || 'Camera Confidence Guide',
            date: c.createdAt || new Date()
          });
        });
      } catch (err) {
        // No commissions subcollection – that's fine
        console.debug('No commissions subcollection found');
      }

      return stats;
    } catch (err) {
      console.error('Error loading commission stats:', err);
      return null;
    }
  }

  // ================================================================
  // COMMISSION MODAL
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
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
      backdrop-filter: blur(4px);
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: #0A0A0A;
      border: 1px solid #8deb00;
      border-radius: 16px;
      padding: 32px;
      max-width: 560px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.9);
      animation: slideUp 0.3s ease;
      position: relative;
      font-family: 'Montserrat', sans-serif;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 16px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 28px;
      cursor: pointer;
      transition: all 0.2s;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    `;
    closeBtn.onmouseover = () => { closeBtn.style.color = '#8deb00'; closeBtn.style.background = 'rgba(141,235,0,0.1)'; };
    closeBtn.onmouseout = () => { closeBtn.style.color = '#888'; closeBtn.style.background = 'transparent'; };
    closeBtn.onclick = () => modal.remove();
    card.appendChild(closeBtn);

    // Title
    const title = document.createElement('h2');
    title.textContent = '💰 Commission Earnings';
    title.style.cssText = `
      color: #8deb00;
      font-family: 'Space Mono', monospace;
      font-size: 20px;
      margin: 0 0 20px 0;
    `;
    card.appendChild(title);

    // Stats grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    `;

    const earningsStat = document.createElement('div');
    earningsStat.style.cssText = `
      background: rgba(141,235,0,0.06);
      border: 1px solid rgba(141,235,0,0.15);
      padding: 16px;
      border-radius: 10px;
      text-align: center;
    `;
    earningsStat.innerHTML = `
      <div style="font-size:32px;font-weight:700;color:#8deb00;">$${stats.totalEarnings.toFixed(2)}</div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Total Earnings</div>
    `;
    grid.appendChild(earningsStat);

    const referralsStat = document.createElement('div');
    referralsStat.style.cssText = `
      background: rgba(141,235,0,0.06);
      border: 1px solid rgba(141,235,0,0.15);
      padding: 16px;
      border-radius: 10px;
      text-align: center;
    `;
    referralsStat.innerHTML = `
      <div style="font-size:32px;font-weight:700;color:#8deb00;">${stats.totalReferrals}</div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Total Referrals</div>
    `;
    grid.appendChild(referralsStat);
    card.appendChild(grid);

    // Recent Sales
    const recentTitle = document.createElement('h3');
    recentTitle.textContent = 'Recent Sales';
    recentTitle.style.cssText = `
      color: #fff;
      font-family: 'Space Mono', monospace;
      font-size: 14px;
      margin: 16px 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    card.appendChild(recentTitle);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    if (!stats.recentSales || stats.recentSales.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No sales yet. Share your code to start earning!';
      empty.style.cssText = 'color:#666;font-size:13px;text-align:center;padding:20px 0;';
      list.appendChild(empty);
    } else {
      stats.recentSales.slice(0, 20).forEach(sale => {
        const item = document.createElement('div');
        item.style.cssText = `
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          padding: 12px 16px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;

        const date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        item.innerHTML = `
          <div>
            <div style="color:#fff;font-weight:500;">${sale.buyerName}</div>
            <div style="color:#666;font-size:11px;">${sale.product} • ${dateStr}</div>
          </div>
          <div style="color:#8deb00;font-weight:700;font-family:'Space Mono',monospace;">+$${sale.amount.toFixed(2)}</div>
        `;
        list.appendChild(item);
      });
    }
    card.appendChild(list);

    // Close on background click
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    modal.appendChild(card);
    document.body.appendChild(modal);

    // Inject animation keyframes if not already present
    if (!document.getElementById('commissionCardStyles')) {
      const style = document.createElement('style');
      style.id = 'commissionCardStyles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ================================================================
  // OPEN MODAL (public)
  // ================================================================
  window.openCommissionModal = async function() {
    const auth = getAuth();
    if (!auth) {
      console.warn('Firebase auth not available');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      console.warn('Not logged in');
      return;
    }

    let stats = await loadCommissionStats(user.uid);
    if (!stats) {
      stats = { totalEarnings: 0, totalReferrals: 0, recentSales: [] };
    }
    createCommissionModal(stats);
  };

  // ================================================================
  // CREATE COMMISSION CARD
  // ================================================================
  function createCommissionCard() {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(10,10,10,0.6);
      backdrop-filter: blur(8px);
      border: 1px solid #1A1A1A;
      border-radius: 12px;
      padding: 20px 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      user-select: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    card.onmouseover = () => {
      card.style.borderColor = '#8deb00';
      card.style.background = 'rgba(141,235,0,0.04)';
      card.style.transform = 'translateY(-2px)';
    };
    card.onmouseout = () => {
      card.style.borderColor = '#1A1A1A';
      card.style.background = 'rgba(10,10,10,0.6)';
      card.style.transform = 'translateY(0)';
    };
    card.onclick = window.openCommissionModal;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
        <h3 style="color:#8deb00;font-size:16px;margin:0;font-family:'Space Mono',monospace;">💰 Commissions</h3>
        <span style="color:#666;font-size:11px;font-family:'Space Mono',monospace;">Click to view</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="font-size:28px;font-weight:700;color:#8deb00;font-family:'Space Mono',monospace;" id="cardTotalEarnings">$0.00</div>
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Total Earned</div>
        </div>
        <div>
          <div style="font-size:28px;font-weight:700;color:#8deb00;font-family:'Space Mono',monospace;" id="cardTotalReferrals">0</div>
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Referrals</div>
        </div>
      </div>
    `;

    return card;
  }

  // ================================================================
  // INSERT COMMISSION CARD
  // ================================================================
  window.insertCommissionCard = function(containerId, position = 'after') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('Container not found:', containerId);
      return null;
    }

    const card = createCommissionCard();

    if (position === 'after') {
      container.insertAdjacentElement('afterend', card);
    } else if (position === 'before') {
      container.insertAdjacentElement('beforebegin', card);
    } else {
      container.appendChild(card);
    }

    // Update card with real data
    const auth = getAuth();
    if (auth) {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const stats = await loadCommissionStats(user.uid);
          if (stats) {
            const earningsEl = document.getElementById('cardTotalEarnings');
            const referralsEl = document.getElementById('cardTotalReferrals');
            if (earningsEl) earningsEl.textContent = '$' + stats.totalEarnings.toFixed(2);
            if (referralsEl) referralsEl.textContent = stats.totalReferrals;
          }
        }
      });
    }

    return card;
  };

  console.log('💰 commission-card.js ready');
})();