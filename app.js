// Rice Milling Cost Calculator Logic - Fully Dynamic

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Supabase init ----
    const SUPABASE_URL = 'https://xrzamnslojmzwpvqdejy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyemFtbnNsb2ptendwdnFkZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjAzMjIsImV4cCI6MjA5NjczNjMyMn0.hvtwxOxhFCGcjetj7vQwm5WKx60vuvSfJYL6r72gEUo';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // ---- End Supabase init ----

    // Default Data
    const defaultSourcing = [
        { name: "Category 90", qty: 230, unit: 50, rate: 5445 },
        { name: "Tulshi B Batch", qty: 20, unit: 50, rate: 6000 },
        { name: "Tulshi A Batch", qty: 183, unit: 52.8, rate: 6795 },
        { name: "Loose Stock", qty: 138, unit: 1, rate: 100, isFixed: true }
    ];

    const defaultOpex = [
        { name: "Crushing Bill", amount: 28250 },
        { name: "Chala Bill", amount: 9600 },
        { name: "Flavour", amount: 7000 },
        { name: "Vehicle (Transport)", amount: 4130 }
    ];

    const defaultByproducts = [
        { name: "Khud", qty: 625, unit: 50, rate: 1500 },
        { name: "Mora", qty: 235, unit: 50, rate: 1300 },
        { name: "Mota", qty: 246, unit: 50, rate: 3000 },
        { name: "Grader", qty: 263, unit: 50, rate: 6000 },
        { name: "Loose Stock", qty: 56, unit: 50, rate: 5000 }
    ];

    // Global Settings elements
    const bagWeightSelect = document.getElementById('bag-weight-config');
    const looseStockUnitCheckbox = document.getElementById('loose-stock-byproduct-unit');
    const finalCostPerBagSub = document.getElementById('final-cost-per-bag-sub');

    // Main Product Output elements
    const prodBags = document.getElementById('prod-bags');
    const prodKg = document.getElementById('prod-kg');

    // Output elements
    const finalRiceCostEl = document.getElementById('final-rice-cost');
    const finalCostPerBagEl = document.getElementById('final-cost-per-bag');
    const finalCostPerKgEl = document.getElementById('final-cost-per-kg');
    
    const kpiSourcingEl = document.getElementById('kpi-sourcing');
    const kpiOperationalEl = document.getElementById('kpi-operational');
    const kpiByproductEl = document.getElementById('kpi-byproduct');
    
    const balanceSheetBody = document.getElementById('balance-sheet-body');
    
    // Chart elements
    const segmentSourcing = document.getElementById('segment-sourcing');
    const segmentOperational = document.getElementById('segment-operational');
    const grossCostText = document.getElementById('gross-cost-text');
    
    const barPctSourcing = document.getElementById('bar-pct-sourcing');
    const barFillSourcing = document.getElementById('bar-fill-sourcing');
    const barPctOperational = document.getElementById('bar-pct-operational');
    const barFillOperational = document.getElementById('bar-fill-operational');
    const barPctByproduct = document.getElementById('bar-pct-byproduct');
    const barFillByproduct = document.getElementById('bar-fill-byproduct');

    // List Container elements
    const sourcingContainer = document.getElementById('sourcing-list');
    const opexContainer = document.getElementById('opex-list');
    const byproductContainer = document.getElementById('byproduct-list');

    // Add buttons
    const addSourcingBtn = document.getElementById('add-sourcing-btn');
    const addOpexBtn = document.getElementById('add-opex-btn');
    const addByproductBtn = document.getElementById('add-byproduct-btn');

    function formatCurrency(value) {
        return '৳' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatNumber(value, decimals = 2) {
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    // Dynamic Row Builders
    function createSourcingRow(name = '', qty = '', unit = 50, rate = '', isFixed = false) {
        let unitSize = unit;
        if (unit === 'Bags') unitSize = 50;
        else if (unit === 'KG') unitSize = 1;

        const row = document.createElement('div');
        row.className = 'row-inputs sourcing-row';
        
        const deleteButtonHtml = isFixed ? 
            `<button type="button" class="btn-icon" style="opacity: 0.3; cursor: not-allowed; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);" title="Required Item" disabled>
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
             </button>` :
            `<button type="button" class="btn-icon delete-btn" title="Delete Item">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>`;

        row.innerHTML = `
            <div class="input-group">
                <label>Item Name</label>
                <input type="text" class="src-name" value="${name}" placeholder="e.g. Category 90" ${isFixed ? 'readonly style="opacity: 0.85; background: rgba(255,255,255,0.02); pointer-events: none;"' : ''}>
            </div>
            <div class="input-group">
                <label class="src-qty-label">Qty (Units)</label>
                <input type="number" class="src-qty" value="${qty}" step="any" placeholder="Qty">
            </div>
            <div class="input-group">
                <label>Unit Size (KG)</label>
                <input type="number" class="src-unit" value="${unitSize}" step="any" placeholder="Unit Size (KG)" ${isFixed ? 'readonly style="opacity: 0.85; background: rgba(255,255,255,0.02); pointer-events: none;"' : ''}>
            </div>
            <div class="input-group">
                <label class="src-rate-label">Rate / Unit</label>
                <div class="input-wrapper">
                    <span class="input-prefix">৳</span>
                    <input type="number" class="has-prefix src-rate" value="${rate}" step="any" placeholder="Rate">
                </div>
            </div>
            ${deleteButtonHtml}
        `;

        const unitInput = row.querySelector('.src-unit');
        const rateLabel = row.querySelector('.src-rate-label');

        const updateLabels = () => {
            const size = parseFloat(unitInput.value) || 0;
            rateLabel.textContent = `Rate / Unit (${size}kg)`;
        };

        unitInput.addEventListener('input', () => {
            updateLabels();
            calculate();
        });

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        if (!isFixed) {
            row.querySelector('.delete-btn').addEventListener('click', () => {
                row.remove();
                calculate();
            });
        }

        updateLabels();

        return row;
    }

    function createOpexRow(name = '', amount = '') {
        const row = document.createElement('div');
        row.className = 'row-inputs opex-row';
        row.innerHTML = `
            <div class="input-group">
                <label>Expense Description</label>
                <input type="text" class="opex-name" value="${name}" placeholder="e.g. Crushing Bill">
            </div>
            <div class="input-group">
                <label>Amount</label>
                <div class="input-wrapper">
                    <span class="input-prefix">৳</span>
                    <input type="number" class="has-prefix opex-val" value="${amount}" step="any" placeholder="Amount">
                </div>
            </div>
            <button type="button" class="btn-icon delete-btn" title="Delete Expense">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        row.querySelector('.delete-btn').addEventListener('click', () => {
            row.remove();
            calculate();
        });

        return row;
    }

    function createByproductRow(name = '', qty = '', unit = 50, rate = '') {
        let unitSize = unit;
        if (unit === 'Bags') {
            unitSize = parseFloat(bagWeightSelect.value) || 50;
        } else if (unit === 'KG') {
            unitSize = 1;
        }

        const row = document.createElement('div');
        row.className = 'row-inputs byproduct-row';
        row.innerHTML = `
            <div class="input-group">
                <label>By-Product</label>
                <input type="text" class="byprod-name" value="${name}" placeholder="e.g. Khud">
            </div>
            <div class="input-group">
                <label>Qty (KG)</label>
                <input type="number" class="byprod-qty" value="${qty}" step="any" placeholder="Qty (KG)">
            </div>
            <div class="input-group">
                <label>Unit Size (KG)</label>
                <input type="number" class="byprod-unit" value="${unitSize}" step="any" placeholder="Unit Size (KG)">
            </div>
            <div class="input-group">
                <label class="byprod-rate-label">Price / Unit</label>
                <div class="input-wrapper">
                    <span class="input-prefix">৳</span>
                    <input type="number" class="has-prefix byprod-rate" value="${rate}" step="any" placeholder="Price">
                </div>
            </div>
            <button type="button" class="btn-icon delete-btn" title="Delete By-Product">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;

        const unitInput = row.querySelector('.byprod-unit');
        const rateLabel = row.querySelector('.byprod-rate-label');

        const updateLabels = () => {
            const size = parseFloat(unitInput.value) || 0;
            rateLabel.textContent = `Price / Unit (${size}kg)`;
        };

        unitInput.addEventListener('input', () => {
            updateLabels();
            calculate();
        });

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        row.querySelector('.delete-btn').addEventListener('click', () => {
            row.remove();
            calculate();
        });

        updateLabels();

        return row;
    }

    function calculate() {
        const bagWeight = parseFloat(bagWeightSelect.value) || 50.0;
        finalCostPerBagSub.textContent = `Per ${bagWeight}kg bag`;

        // 1. Sourcing Cost calculations
        const sourcingRows = document.querySelectorAll('#sourcing-list .sourcing-row');
        const sourcingItems = [];
        let totalSourcingCost = 0;
        let sourcingCostExclLoose = 0;
        let looseStockSourcingCost = 0;
        let totalInputKgExclLoose = 0;
        let totalInputKg = 0;

        sourcingRows.forEach(row => {
            const name = row.querySelector('.src-name').value || 'Unnamed Sourcing';
            const qty = parseFloat(row.querySelector('.src-qty').value) || 0;
            const unitSize = parseFloat(row.querySelector('.src-unit').value) || 1.0;
            const rate = parseFloat(row.querySelector('.src-rate').value) || 0;

            const total = qty * rate;
            totalSourcingCost += total;
            totalInputKg += qty * unitSize;

            const isLoose = name.toLowerCase().includes('loose stock');
            if (isLoose) {
                looseStockSourcingCost += total;
            } else {
                sourcingCostExclLoose += total;
                totalInputKgExclLoose += qty * unitSize;
            }

            sourcingItems.push({
                name,
                qty,
                rate,
                unitSize,
                total
            });
        });

        // 2. Operational Expenses
        const opexRows = document.querySelectorAll('#opex-list .opex-row');
        const opexItems = [];
        let totalOperationalCost = 0;

        opexRows.forEach(row => {
            const name = row.querySelector('.opex-name').value || 'Unnamed Expense';
            const amount = parseFloat(row.querySelector('.opex-val').value) || 0;

            totalOperationalCost += amount;

            opexItems.push({
                name,
                amount
            });
        });

        // 3. By-Products Revenue
        const byproductRows = document.querySelectorAll('#byproduct-list .byproduct-row');
        const byproductItems = [];
        let totalByproductRevenue = 0;
        let totalByproductKg = 0;

        byproductRows.forEach(row => {
            const name = row.querySelector('.byprod-name').value || 'Unnamed By-Product';
            const qtyKg = parseFloat(row.querySelector('.byprod-qty').value) || 0;
            const unitSize = parseFloat(row.querySelector('.byprod-unit').value) || 1.0;
            const rate = parseFloat(row.querySelector('.byprod-rate').value) || 0;

            const qtyUnits = qtyKg / unitSize;
            const total = qtyUnits * rate;
            totalByproductRevenue += total;
            totalByproductKg += qtyKg;

            byproductItems.push({
                name,
                qtyKg,
                qtyUnits,
                unitSize,
                rate,
                total
            });
        });

        // 4. Main Product Yield details
        const mainBags = parseFloat(prodBags.value) || 0;
        const mainKg = parseFloat(prodKg.value) || 0;

        // Gross and Net Costs
        const grossCost = totalSourcingCost + totalOperationalCost;
        const netCostMainProduct = grossCost - totalByproductRevenue;
        
        const costPerBag = mainBags > 0 ? (netCostMainProduct / mainBags) : 0;
        const costPerKg = mainKg > 0 ? (netCostMainProduct / mainKg) : 0;

        const totalSourcingBagsExclLoose = totalInputKgExclLoose / bagWeight;
        const averageSourcingCostPerBag = totalInputKgExclLoose > 0 ? (sourcingCostExclLoose / totalInputKgExclLoose) * bagWeight : 0;
        const sortingCostPerBag = costPerBag - averageSourcingCostPerBag;

        // Update Hero Metrics
        finalRiceCostEl.textContent = formatCurrency(netCostMainProduct);
        finalCostPerBagEl.textContent = formatCurrency(costPerBag);
        finalCostPerKgEl.textContent = formatCurrency(costPerKg);

        const sortingCostPerBagHeroEl = document.getElementById('sorting-cost-per-bag-hero');
        if (sortingCostPerBagHeroEl) {
            sortingCostPerBagHeroEl.textContent = formatCurrency(sortingCostPerBag);
        }

        // Update Mass Balance & Yield Metrics
        const totalOutputKg = mainKg + totalByproductKg;
        const recoveryPct = totalInputKg > 0 ? (totalOutputKg / totalInputKg) * 100 : 0;

        const yieldTotalInputEl = document.getElementById('yield-total-input');
        if (yieldTotalInputEl) {
            yieldTotalInputEl.textContent = formatNumber(totalInputKg, 1) + ' kg';
        }
        const yieldTotalOutputEl = document.getElementById('yield-total-output');
        if (yieldTotalOutputEl) {
            yieldTotalOutputEl.textContent = formatNumber(totalOutputKg, 1) + ' kg';
        }
        const yieldRecoveryPctEl = document.getElementById('yield-recovery-pct');
        if (yieldRecoveryPctEl) {
            yieldRecoveryPctEl.textContent = formatNumber(recoveryPct, 2) + '%';
        }
        const yieldBreakdownSubEl = document.getElementById('yield-breakdown-sub');
        if (yieldBreakdownSubEl) {
            yieldBreakdownSubEl.textContent = `${formatNumber(mainKg, 1)}kg Rice + ${formatNumber(totalByproductKg, 1)}kg By-products`;
        }

        // Update KPIs
        kpiSourcingEl.textContent = formatCurrency(totalSourcingCost);
        const kpiSourcingSubEl = document.getElementById('kpi-sourcing-sub');
        if (kpiSourcingSubEl) {
            kpiSourcingSubEl.textContent = `Excl. Loose: ${formatCurrency(sourcingCostExclLoose)}`;
        }
        kpiOperationalEl.textContent = formatCurrency(totalOperationalCost);
        kpiByproductEl.textContent = formatCurrency(totalByproductRevenue);

        // Render Balance Sheet Rows
        let htmlRows = '';

        // Sourcing section
        let subtotalSourcingExclLoose = 0;
        let subtotalLooseStock = 0;

        sourcingItems.forEach((item, index) => {
            const rowClass = index === 0 ? 'border-top' : '';
            const isLoose = item.name.toLowerCase().includes('loose stock');
            if (isLoose) {
                subtotalLooseStock += item.total;
            } else {
                subtotalSourcingExclLoose += item.total;
            }

            htmlRows += `
                <tr class="${rowClass}">
                    <td style="color: #60a5fa; font-weight: 600;">Sourcing${isLoose ? ' (Loose)' : ''}</td>
                    <td>${item.name}</td>
                    <td>${formatNumber(item.qty, 2)} x ${item.unitSize} kg @ ৳${formatNumber(item.rate, 2)}</td>
                    <td style="text-align: right;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        htmlRows += `
            <tr style="background: rgba(59, 130, 246, 0.02); font-size: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.03);">
                <td colspan="3" style="text-align: right; color: var(--text-secondary); padding: 0.4rem 1rem;">Sourcing (excl. Loose Stock):</td>
                <td style="text-align: right; color: #90cdf4; padding: 0.4rem 1rem;">${formatCurrency(subtotalSourcingExclLoose)}</td>
            </tr>
            <tr style="background: rgba(59, 130, 246, 0.02); font-size: 0.85rem;">
                <td colspan="3" style="text-align: right; color: var(--text-secondary); padding: 0.4rem 1rem;">Loose Stock Sourcing:</td>
                <td style="text-align: right; color: #90cdf4; padding: 0.4rem 1rem;">${formatCurrency(subtotalLooseStock)}</td>
            </tr>
            <tr style="background: rgba(59, 130, 246, 0.05); font-weight: 600;">
                <td colspan="3" style="text-align: right; color: var(--text-secondary);">Subtotal Sourcing Cost:</td>
                <td style="text-align: right; color: #60a5fa;">${formatCurrency(totalSourcingCost)}</td>
            </tr>
        `;

        // Operational section
        opexItems.forEach((item, index) => {
            htmlRows += `
                <tr>
                    <td style="color: #fbbf24; font-weight: 600;">Operational</td>
                    <td>${item.name}</td>
                    <td>Fixed Expense</td>
                    <td style="text-align: right;">${formatCurrency(item.amount)}</td>
                </tr>
            `;
        });
        htmlRows += `
            <tr style="background: rgba(245, 158, 11, 0.05); font-weight: 600;">
                <td colspan="3" style="text-align: right; color: var(--text-secondary);">Subtotal Operational Cost:</td>
                <td style="text-align: right; color: #fbbf24;">${formatCurrency(totalOperationalCost)}</td>
            </tr>
        `;

        // Total Cost (Gross)
        htmlRows += `
            <tr style="background: rgba(255, 255, 255, 0.08); font-weight: 700;">
                <td colspan="3" style="text-align: right; text-transform: uppercase;">Gross Cost (Sourcing + Operational):</td>
                <td style="text-align: right; color: #fff; border-top: 1px solid var(--border-color); border-bottom: 2px double var(--border-color);">${formatCurrency(grossCost)}</td>
            </tr>
        `;

        // By-products section
        byproductItems.forEach((item, index) => {
            htmlRows += `
                <tr>
                    <td style="color: #34d399; font-weight: 600;">By-Product</td>
                    <td>${item.name}</td>
                    <td>${formatNumber(item.qtyKg, 1)} kg (${formatNumber(item.qtyUnits, 2)} x ${item.unitSize} kg) @ ৳${formatNumber(item.rate, 2)}</td>
                    <td style="text-align: right; color: #34d399;">-${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        htmlRows += `
            <tr style="background: rgba(16, 185, 129, 0.05); font-weight: 600;">
                <td colspan="3" style="text-align: right; color: var(--text-secondary);">Subtotal By-product Recovery:</td>
                <td style="text-align: right; color: #34d399;">-${formatCurrency(totalByproductRevenue)}</td>
            </tr>
        `;

        // Final Net Cost
        htmlRows += `
            <tr class="table-totals" style="font-size: 1rem; border-top: 2px solid var(--primary);">
                <td style="color: #fff; text-transform: uppercase;">Final Rice Net Cost</td>
                <td>Main Yield: ${formatNumber(mainBags, 0)} Bags (${formatNumber(mainKg, 1)} kg)</td>
                <td style="text-align: right;">Net Cost basis</td>
                <td style="text-align: right; color: var(--primary); font-size: 1.1rem;">${formatCurrency(netCostMainProduct)}</td>
            </tr>
            <tr style="background: rgba(139, 92, 246, 0.04); font-size: 0.85rem; border-top: 1px solid var(--border-color);">
                <td style="color: #c7d2fe;">Avg Sourcing per Raw Bag</td>
                <td>Sourcing excl. Loose / Total Raw Bags</td>
                <td>${formatNumber(totalSourcingBagsExclLoose, 2)} Raw Bags</td>
                <td style="text-align: right; color: #c7d2fe;">${formatCurrency(averageSourcingCostPerBag)}</td>
            </tr>
            <tr style="background: rgba(16, 185, 129, 0.04); font-size: 0.9rem; font-weight: 700;">
                <td style="color: #34d399; text-transform: uppercase;">Sorting Cost per Bag</td>
                <td>Final Cost per Bag - Avg Sourcing per Raw Bag</td>
                <td>Sorting Overhead</td>
                <td style="text-align: right; color: #34d399; font-size: 1rem;">${formatCurrency(sortingCostPerBag)}</td>
            </tr>
        `;

        balanceSheetBody.innerHTML = htmlRows;

        // Visualizations Calculations & Updates
        grossCostText.textContent = formatCurrency(grossCost);

        // Donut Segment Math
        const circumference = 408.4;
        const sourcingPct = grossCost > 0 ? (totalSourcingCost / grossCost) : 0;
        const operationalPct = grossCost > 0 ? (totalOperationalCost / grossCost) : 0;

        const strokeSourcing = sourcingPct * circumference;
        const strokeOperational = operationalPct * circumference;

        segmentSourcing.setAttribute('stroke-dasharray', `${strokeSourcing} ${circumference}`);
        
        segmentOperational.setAttribute('stroke-dasharray', `${strokeOperational} ${circumference}`);
        segmentOperational.setAttribute('stroke-dashoffset', `-${strokeSourcing}`);

        // Bar Chart Offsets Updates
        const maxBarValue = Math.max(totalSourcingCost, totalOperationalCost, totalByproductRevenue);
        
        const pctSourcingVal = maxBarValue > 0 ? Math.round((totalSourcingCost / maxBarValue) * 100) : 0;
        const pctOperationalVal = maxBarValue > 0 ? Math.round((totalOperationalCost / maxBarValue) * 100) : 0;
        const pctByproductVal = maxBarValue > 0 ? Math.round((totalByproductRevenue / maxBarValue) * 100) : 0;

        barPctSourcing.textContent = `${pctSourcingVal}%`;
        barFillSourcing.style.width = `${pctSourcingVal}%`;

        barPctOperational.textContent = `${pctOperationalVal}%`;
        barFillOperational.style.width = `${pctOperationalVal}%`;

        barPctByproduct.textContent = `${pctByproductVal}%`;
        barFillByproduct.style.width = `${pctByproductVal}%`;
    }

    let currentBagWeight = parseFloat(bagWeightSelect.value) || 50.0;

    // Hook Global Config event listeners
    bagWeightSelect.addEventListener('change', () => {
        const newBagWeight = parseFloat(bagWeightSelect.value) || 50.0;
        
        // Update any sourcing row units matching the old bag weight
        document.querySelectorAll('#sourcing-list .sourcing-row').forEach(row => {
            const unitInput = row.querySelector('.src-unit');
            if (unitInput) {
                const val = parseFloat(unitInput.value);
                if (val === currentBagWeight) {
                    unitInput.value = newBagWeight;
                    const rateLabel = row.querySelector('.src-rate-label');
                    if (rateLabel) {
                        rateLabel.textContent = `Rate / Unit (${newBagWeight}kg)`;
                    }
                }
            }
        });

        // Update any byproduct row units matching the old bag weight
        document.querySelectorAll('#byproduct-list .byproduct-row').forEach(row => {
            const unitInput = row.querySelector('.byprod-unit');
            if (unitInput) {
                const val = parseFloat(unitInput.value);
                if (val === currentBagWeight) {
                    unitInput.value = newBagWeight;
                    const rateLabel = row.querySelector('.byprod-rate-label');
                    if (rateLabel) {
                        rateLabel.textContent = `Price / Unit (${newBagWeight}kg)`;
                    }
                }
            }
        });

        currentBagWeight = newBagWeight;
        calculate();
    });

    // Hook the Loose Stock global checkbox to update Loose Stock byproduct units
    looseStockUnitCheckbox.addEventListener('change', () => {
        const byproductRows = document.querySelectorAll('.byproduct-row');
        byproductRows.forEach(row => {
            const nameInput = row.querySelector('.byprod-name');
            if (nameInput && nameInput.value.toLowerCase().includes('loose stock')) {
                const unitInput = row.querySelector('.byprod-unit');
                if (unitInput) {
                    const newSize = looseStockUnitCheckbox.checked ? parseFloat(bagWeightSelect.value) || 50 : 1;
                    unitInput.value = newSize;
                    const rateLabel = row.querySelector('.byprod-rate-label');
                    if (rateLabel) {
                        rateLabel.textContent = `Price / Unit (${newSize}kg)`;
                    }
                }
            }
        });
        calculate();
    });

    // Hook Main Product Outputs
    prodBags.addEventListener('input', () => {
        // Automatically calculate KG based on bag weight as a helper, but allow manual overwrite
        const bagWeight = parseFloat(bagWeightSelect.value) || 50.0;
        const bags = parseFloat(prodBags.value) || 0;
        prodKg.value = bags * bagWeight;
        calculate();
    });
    prodKg.addEventListener('input', calculate);

    // Add row button actions
    addSourcingBtn.addEventListener('click', () => {
        sourcingContainer.appendChild(createSourcingRow('', '', parseFloat(bagWeightSelect.value) || 50, ''));
        calculate();
    });

    addOpexBtn.addEventListener('click', () => {
        opexContainer.appendChild(createOpexRow('', ''));
        calculate();
    });

    addByproductBtn.addEventListener('click', () => {
        byproductContainer.appendChild(createByproductRow('', '', parseFloat(bagWeightSelect.value) || 50, ''));
        calculate();
    });

    // Initialize lists with default values
    defaultSourcing.forEach(item => {
        sourcingContainer.appendChild(createSourcingRow(item.name, item.qty, item.unit, item.rate, item.isFixed));
    });

    defaultOpex.forEach(item => {
        opexContainer.appendChild(createOpexRow(item.name, item.amount));
    });

    defaultByproducts.forEach(item => {
        let unitVal = item.unit;
        if (item.name.toLowerCase().includes('loose stock')) {
            unitVal = looseStockUnitCheckbox.checked ? parseFloat(bagWeightSelect.value) || 50 : 1;
        }
        byproductContainer.appendChild(createByproductRow(item.name, item.qty, unitVal, item.rate));
    });

    // === Batch History System ===
    const saveBatchBtn = document.getElementById('save-batch-btn');
    const historyListContainer = document.getElementById('history-list');

    async function renderHistory() {
        let history = [];
        try {
            const device = bagWeightSelect.value;
            const { data: historyData, error: loadErr } = await supabase
                .from('batch_history')
                .select('id, batch_data')
                .eq('device', device)
                .order('created_at', { ascending: false });
            if (loadErr) console.error('Supabase load error:', loadErr);
            history = (historyData || []).map(row => ({ id: row.id, ...row.batch_data }));
        } catch (e) {
            history = [];
        }

        if (history.length === 0) {
            historyListContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">No saved batches in history.</p>`;
            return;
        }

        historyListContainer.innerHTML = '';
        history.forEach((batch) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 0.75rem; position: relative; transition: all var(--transition-fast); display: flex; flex-direction: column; gap: 0.5rem;';
            
            // Hover effect
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                item.style.background = 'rgba(255,255,255,0.04)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = 'var(--border-color)';
                item.style.background = 'rgba(255,255,255,0.02)';
            });

            // Sourcing items listing HTML
            let sourcingLines = '';
            if (batch.sourcing && batch.sourcing.length > 0) {
                sourcingLines = batch.sourcing.map(it => 
                    `<li style="margin-left: 0.8rem; list-style-type: disc; margin-bottom: 0.15rem;">${it.name}: ${formatNumber(it.qty, 1)} x ${it.unit} kg @ ৳${formatNumber(it.rate, 2)} (৳${formatNumber(it.qty * it.rate, 2)})</li>`
                ).join('');
            } else {
                sourcingLines = '<li style="margin-left: 0.8rem; list-style-type: none; color: var(--text-muted);">None</li>';
            }

            // Operational expenses listing HTML
            let opexLines = '';
            if (batch.opex && batch.opex.length > 0) {
                opexLines = batch.opex.map(it => 
                    `<li style="margin-left: 0.8rem; list-style-type: disc; margin-bottom: 0.15rem;">${it.name}: ৳${formatNumber(it.amount, 2)}</li>`
                ).join('');
            } else {
                opexLines = '<li style="margin-left: 0.8rem; list-style-type: none; color: var(--text-muted);">None</li>';
            }

            // By-products listing HTML
            let byproductLines = '';
            if (batch.byproducts && batch.byproducts.length > 0) {
                byproductLines = batch.byproducts.map(it => {
                    const qtyUnits = it.qty / (it.unit || 1);
                    const total = qtyUnits * it.rate;
                    return `<li style="margin-left: 0.8rem; list-style-type: disc; margin-bottom: 0.15rem;">${it.name}: ${formatNumber(it.qty, 1)} kg (${formatNumber(qtyUnits, 2)} x ${it.unit} kg) @ ৳${formatNumber(it.rate, 2)} (৳${formatNumber(total, 2)})</li>`;
                }).join('');
            } else {
                byproductLines = '<li style="margin-left: 0.8rem; list-style-type: none; color: var(--text-muted);">None</li>';
            }

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.35rem;">
                    <div>
                        <strong style="color: #fff; font-size: 0.9rem;">${batch.name}</strong>
                        <span style="display: block; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem;">${new Date(batch.timestamp).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="load-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 0.25rem 0.5rem; border-radius: var(--border-radius-sm); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all var(--transition-fast);">Load</button>
                        <button class="details-btn" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); color: #c7d2fe; padding: 0.25rem 0.5rem; border-radius: var(--border-radius-sm); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all var(--transition-fast);">Details</button>
                        <button class="del-btn" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 0.25rem 0.5rem; border-radius: var(--border-radius-sm); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all var(--transition-fast);">Del</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.35rem; font-size: 0.75rem; color: var(--text-secondary);">
                    <div>Net Cost: <span style="color: var(--primary); font-weight: 600;">৳${Number(batch.summary.netCost).toLocaleString('en-US', {maximumFractionDigits:0})}</span></div>
                    <div>Cost/Bag: <span style="color: #60a5fa; font-weight: 600;">৳${Number(batch.summary.costPerBag).toLocaleString('en-US', {maximumFractionDigits:2})}</span></div>
                    <div>Sorting/Bag: <span style="color: var(--accent); font-weight: 600;">৳${Number(batch.summary.sortingCostPerBag).toLocaleString('en-US', {maximumFractionDigits:2})}</span></div>
                    <div>Recovery: <span style="color: var(--success); font-weight: 600;">${batch.summary.recoveryPct}%</span></div>
                </div>
                <div class="batch-details" style="display: none; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 0.6rem; margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-secondary); max-height: 250px; overflow-y: auto;">
                    <div style="margin-bottom: 0.5rem; background: rgba(255,255,255,0.01); padding: 0.35rem 0.5rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.03);">
                        <strong style="color: #a5b4fc;">Configs & Metadata</strong><br>
                        • Standard Bag Weight: ${batch.bagWeight} kg<br>
                        • By-product "Loose Stock" unit: ${batch.looseStockByproductUnitChecked ? `${batch.bagWeight} kg` : '1 kg'}<br>
                        • Main Output: ${formatNumber(batch.mainProduct ? batch.mainProduct.bags : 0, 0)} bags (${formatNumber(batch.mainProduct ? batch.mainProduct.kg : 0, 1)} kg)
                    </div>
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="color: #60a5fa;">Sourcing Raw Materials</strong>
                        <ul style="padding-left: 0; margin-top: 0.2rem; list-style: none;">
                            ${sourcingLines}
                        </ul>
                    </div>
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="color: #fbbf24;">Operational Expenses</strong>
                        <ul style="padding-left: 0; margin-top: 0.2rem; list-style: none;">
                            ${opexLines}
                        </ul>
                    </div>
                    <div>
                        <strong style="color: #34d399;">By-Products Sales</strong>
                        <ul style="padding-left: 0; margin-top: 0.2rem; list-style: none;">
                            ${byproductLines}
                        </ul>
                    </div>
                </div>
            `;

            item.querySelector('.load-btn').addEventListener('click', () => {
                loadBatch(batch);
            });

            const detailsBtn = item.querySelector('.details-btn');
            const detailsDiv = item.querySelector('.batch-details');
            detailsBtn.addEventListener('click', async () => {
                const isHidden = detailsDiv.style.display === 'none';
                detailsDiv.style.display = isHidden ? 'block' : 'none';
                detailsBtn.textContent = isHidden ? 'Hide' : 'Details';
                // Persist expanded state if needed (optional)
                // No extra action required for Supabase here
                detailsBtn.style.background = isHidden ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)';
            });

            item.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete "${batch.name}" from history?`)) {
                    let updatedHistory = history.filter(b => b.id !== batch.id);
                const { error: delErr } = await supabase.from('batch_history').delete().eq('id', batch.id);
                if (delErr) console.error('Supabase delete error:', delErr);
                    await supabase.from('batch_history').insert({
            device: currentDevice,
            batch_data: updatedHistory.find(b => b.id === batch.id)
        });
                    renderHistory();
                }
            });

            historyListContainer.appendChild(item);
        });
    }

    const saveBatchModal = document.getElementById('save-batch-modal');
    // Re‑load history when device (bag weight) changes
    bagWeightSelect.addEventListener('change', async () => {
        currentDevice = bagWeightSelect.value;
        const { data: newData, error: changeErr } = await supabase
            .from('batch_history')
            .select('id, batch_data')
            .eq('device', currentDevice)
            .order('created_at', { ascending: false });
        if (changeErr) console.error('Supabase device change error:', changeErr);
        history = (newData || []).map(row => ({ id: row.id, ...row.batch_data }));
        renderHistory();
    });
    const batchNameInput = document.getElementById('batch-name-input');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const cancelSaveBtn = document.getElementById('cancel-save-btn');

    function openSaveModal() {
        const defaultName = "Batch - " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        batchNameInput.value = defaultName;
        saveBatchModal.style.display = 'flex';
        batchNameInput.select();
    }

    function closeSaveModal() {
        saveBatchModal.style.display = 'none';
    }

    async function saveCurrentBatch() {
        const batchName = batchNameInput.value.trim() || "Unnamed Batch";
        closeSaveModal();

        const finalRiceCostVal = parseFloat(document.getElementById('final-rice-cost').textContent.replace(/[৳,]/g, '')) || 0;
        const finalCostPerBagVal = parseFloat(document.getElementById('final-cost-per-bag').textContent.replace(/[৳,]/g, '')) || 0;
        const sortingCostPerBagVal = parseFloat(document.getElementById('sorting-cost-per-bag-hero').textContent.replace(/[৳,]/g, '')) || 0;
        const recoveryPctVal = parseFloat(document.getElementById('yield-recovery-pct').textContent.replace(/[%]/g, '')) || 0;

        // Collect inputs
        const sourcing = [];
        document.querySelectorAll('#sourcing-list .sourcing-row').forEach(row => {
            sourcing.push({
                name: row.querySelector('.src-name').value,
                qty: parseFloat(row.querySelector('.src-qty').value) || 0,
                unit: parseFloat(row.querySelector('.src-unit').value) || 0,
                rate: parseFloat(row.querySelector('.src-rate').value) || 0,
                isFixed: row.querySelector('.src-name').hasAttribute('readonly')
            });
        });

        const opex = [];
        document.querySelectorAll('#opex-list .opex-row').forEach(row => {
            opex.push({
                name: row.querySelector('.opex-name').value,
                amount: parseFloat(row.querySelector('.opex-val').value) || 0
            });
        });

        const byproducts = [];
        document.querySelectorAll('#byproduct-list .byproduct-row').forEach(row => {
            byproducts.push({
                name: row.querySelector('.byprod-name').value,
                qty: parseFloat(row.querySelector('.byprod-qty').value) || 0,
                unit: parseFloat(row.querySelector('.byprod-unit').value) || 0,
                rate: parseFloat(row.querySelector('.byprod-rate').value) || 0
            });
        });

        const newBatch = {
            id: Date.now().toString(),
            name: batchName,
            timestamp: new Date().toISOString(),
            bagWeight: parseFloat(bagWeightSelect.value) || 50.0,
            looseStockByproductUnitChecked: looseStockUnitCheckbox.checked,
            sourcing,
            opex,
            mainProduct: {
                bags: parseFloat(prodBags.value) || 0,
                kg: parseFloat(prodKg.value) || 0
            },
            byproducts,
            summary: {
                netCost: finalRiceCostVal,
                costPerBag: finalCostPerBagVal,
                sortingCostPerBag: sortingCostPerBagVal,
                recoveryPct: recoveryPctVal
            }
        };

        // Insert new batch into Supabase
        const { error: saveErr } = await supabase
            .from('batch_history')
            .insert({ device: bagWeightSelect.value, batch_data: newBatch });
        if (saveErr) {
            console.error('Supabase save error:', saveErr);
            alert('Failed to save batch. Check the console for details.');
        }
        renderHistory();
    }

    function loadBatch(batch) {
        // 1. Set global configs
        bagWeightSelect.value = batch.bagWeight;
        looseStockUnitCheckbox.checked = batch.looseStockByproductUnitChecked;
        currentBagWeight = batch.bagWeight; // Update currentBagWeight tracker

        // 2. Clear and rebuild sourcing
        sourcingContainer.innerHTML = '';
        batch.sourcing.forEach(item => {
            sourcingContainer.appendChild(createSourcingRow(item.name, item.qty, item.unit, item.rate, item.isFixed));
        });

        // 3. Clear and rebuild opex
        opexContainer.innerHTML = '';
        batch.opex.forEach(item => {
            opexContainer.appendChild(createOpexRow(item.name, item.amount));
        });

        // 4. Set main product outputs
        prodBags.value = batch.mainProduct.bags;
        prodKg.value = batch.mainProduct.kg;

        // 5. Clear and rebuild byproducts
        byproductContainer.innerHTML = '';
        batch.byproducts.forEach(item => {
            byproductContainer.appendChild(createByproductRow(item.name, item.qty, item.unit, item.rate));
        });

        calculate();
        alert(`Loaded batch run: "${batch.name}"`);
    }

    saveBatchBtn.addEventListener('click', openSaveModal);
    confirmSaveBtn.addEventListener('click', saveCurrentBatch);
    cancelSaveBtn.addEventListener('click', closeSaveModal);

    batchNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveCurrentBatch();
        } else if (e.key === 'Escape') {
            closeSaveModal();
        }
    });

    renderHistory();

    // Perform first run calculation
    calculate();
});
