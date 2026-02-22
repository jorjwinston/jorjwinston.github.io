let trades = JSON.parse(localStorage.getItem('trades')) || [];
let initialBalance = localStorage.getItem('initialBalance');
let currentFilter = 'all'; // all, week, month

document.addEventListener("DOMContentLoaded", () => {
    if (!initialBalance) {
        document.getElementById('setup-modal').classList.remove('hidden');
    } else {
        updateDashboard();
        renderTrades();
    }
});

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

document.getElementById('trade-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const pair = document.getElementById('pair').value.toUpperCase();
    const strategy = document.getElementById('strategy').value;
    const direction = document.getElementById('direction').value;
    const pnl = parseFloat(document.getElementById('pnl').value);
    
    const trade = {
        id: Date.now(), // Bu timestamp filtrlash uchun kerak
        date: new Date().toLocaleDateString('uz-UZ'),
        pair,
        strategy,
        direction,
        pnl
    };
    
    trades.push(trade);
    localStorage.setItem('trades', JSON.stringify(trades));
    
    this.reset();
    updateDashboard();
    renderTrades();
});

function setFilter(filterType) {
    currentFilter = filterType;
    
    // Tugmalar dizaynini yangilash
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTrades();
}

function renderTrades() {
    const tbody = document.getElementById('trades-body');
    tbody.innerHTML = '';
    
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    // Filtrlash jarayoni
    let filteredTrades = trades;
    if (currentFilter === 'week') {
        filteredTrades = trades.filter(t => (now - t.id) < oneWeek);
    } else if (currentFilter === 'month') {
        filteredTrades = trades.filter(t => (now - t.id) < oneMonth);
    }

    [...filteredTrades].reverse().forEach(trade => {
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

function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    localStorage.setItem('trades', JSON.stringify(trades));
    updateDashboard();
    renderTrades();
}

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
    updateGoals(startBal);
}

// Limitlar va maqsadlarni hisoblash
function updateGoals(startBal) {
    const targetGoal = startBal * 0.10; // 10% Profit Target
    const maxLoss = startBal * 0.06;    // 6% Max Drawdown
    const dailyLimit = startBal * 0.03; // 3% Daily Loss
    
    document.getElementById('target-goal').innerText = `+$${targetGoal.toFixed(2)}`;
    document.getElementById('max-loss').innerText = `-$${maxLoss.toFixed(2)}`;
    document.getElementById('daily-limit').innerText = `-$${dailyLimit.toFixed(2)}`;
    
    // Bugungi PnL ni hisoblash
    const todayStr = new Date().toLocaleDateString('uz-UZ');
    const todayPnl = trades
        .filter(t => t.date === todayStr)
        .reduce((sum, t) => sum + t.pnl, 0);
        
    const todayEl = document.getElementById('today-pnl');
    todayEl.innerText = todayPnl >= 0 ? `+$${todayPnl.toFixed(2)}` : `-$${Math.abs(todayPnl).toFixed(2)}`;
    todayEl.style.color = todayPnl >= 0 ? '#64ffda' : '#ff6b6b';
}

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
