// LocalStorage'dan ma'lumotlarni olish
let trades = JSON.parse(localStorage.getItem('trades')) || [];
let initialBalance = localStorage.getItem('initialBalance');

// Dastlabki yuklanish
document.addEventListener("DOMContentLoaded", () => {
    if (!initialBalance) {
        document.getElementById('setup-modal').classList.remove('hidden');
    } else {
        updateDashboard();
        renderTrades();
    }
});

// Boshlang'ich balansni o'rnatish
function setInitialBalance() {
    const inputVal = document.getElementById('initial-balance-input').value;
    if (inputVal && !isNaN(inputVal) && inputVal > 0) {
        initialBalance = parseFloat(inputVal);
        localStorage.setItem('initialBalance', initialBalance);
        document.getElementById('setup-modal').classList.add('hidden');
        updateDashboard();
    } else {
        alert("Iltimos, to'g'ri summa kiriting.");
    }
}

// Yangi savdoni qo'shish
document.getElementById('trade-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pair = document.getElementById('pair').value.toUpperCase();
    const strategy = document.getElementById('strategy').value;
    const direction = document.getElementById('direction').value;
    const pnl = parseFloat(document.getElementById('pnl').value);
    
    const trade = {
        id: Date.now(),
        date: new Date().toLocaleDateString('uz-UZ'),
        pair,
        strategy,
        direction,
        pnl
    };
    
    trades.push(trade);
    localStorage.setItem('trades', JSON.stringify(trades));
    
    this.reset(); // Formani tozalash
    updateDashboard();
    renderTrades();
});

// Jadvalga chizish
function renderTrades() {
    const tbody = document.getElementById('trades-body');
    tbody.innerHTML = '';
    
    // Eng so'nggi savdolar birinchi turadi
    [...trades].reverse().forEach(trade => {
        const tr = document.createElement('tr');
        const pnlClass = trade.pnl >= 0 ? 'profit' : 'loss';
        const pnlText = trade.pnl >= 0 ? `+$${trade.pnl}` : `-$${Math.abs(trade.pnl)}`;
        
        tr.innerHTML = `
            <td>${trade.date}</td>
            <td><strong>${trade.pair}</strong></td>
            <td>${trade.direction}</td>
            <td>${trade.strategy}</td>
            <td class="${pnlClass}"><strong>${pnlText}</strong></td>
            <td><button onclick="deleteTrade(${trade.id})" style="color: #ff6b6b; background: transparent; border: none; cursor: pointer;">O'chirish</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Savdoni o'chirish
function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    localStorage.setItem('trades', JSON.stringify(trades));
    updateDashboard();
    renderTrades();
}

// Barcha statistika va strategiyalarni hisoblash
function updateDashboard() {
    if (!initialBalance) return;
    
    const startBal = parseFloat(initialBalance);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const currentBal = startBal + totalPnl;
    
    document.getElementById('start-balance').innerText = `$${startBal.toFixed(2)}`;
    document.getElementById('current-balance').innerText = `$${currentBal.toFixed(2)}`;
    
    const pnlEl = document.getElementById('total-pnl');
    pnlEl.innerText = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
    pnlEl.className = totalPnl >= 0 ? 'profit' : 'loss';

    updateStrategyStats();
}

// Strategiya samaradorligini (Win Rate) hisoblash
function updateStrategyStats() {
    const statsContainer = document.getElementById('strategy-stats');
    statsContainer.innerHTML = '';
    
    if (trades.length === 0) {
        statsContainer.innerHTML = '<span style="color:#8892b0;">Hali ma\'lumot yo\'q</span>';
        return;
    }

    const strategyData = {};
    
    trades.forEach(t => {
        if (!strategyData[t.strategy]) {
            strategyData[t.strategy] = { total: 0, wins: 0 };
        }
        strategyData[t.strategy].total++;
        if (t.pnl > 0) strategyData[t.strategy].wins++;
    });

    for (const [name, data] of Object.entries(strategyData)) {
        const winRate = ((data.wins / data.total) * 100).toFixed(1);
        
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.marginBottom = '8px';
        div.innerHTML = `
            <span>${name} (${data.total} ta):</span>
            <strong style="color: ${winRate >= 50 ? '#64ffda' : '#ff6b6b'}">${winRate}%</strong>
        `;
        statsContainer.appendChild(div);
    }
}
