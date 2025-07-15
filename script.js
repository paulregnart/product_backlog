class ProductIdeasApp {
    constructor() {
        this.ideas = JSON.parse(localStorage.getItem('productIdeas')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentTab = 'active';
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        const addBtn = document.getElementById('addBtn');
        const titleInput = document.getElementById('ideaTitle');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const sortBtns = document.querySelectorAll('.sort-btn');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const exportBtn = document.getElementById('exportBtn');
        const generateBtn = document.getElementById('generateBtn');
        const resetBtn = document.getElementById('resetBtn');

        addBtn.addEventListener('click', () => this.addIdea());

        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addIdea();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        sortBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSort(e.target.dataset.sort);
            });
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTab(e.target.dataset.tab);
            });
        });

        exportBtn.addEventListener('click', () => this.exportIdeas());
        generateBtn.addEventListener('click', () => this.generateAccountingIdeas());
        resetBtn.addEventListener('click', () => this.resetData());
    }

    addIdea() {
        const titleInput = document.getElementById('ideaTitle');
        const descriptionInput = document.getElementById('ideaDescription');
        const requesterInput = document.getElementById('ideaRequester');
        const prioritySelect = document.getElementById('ideaPriority');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const requester = requesterInput.value.trim();
        const priority = prioritySelect.value;

        if (!title) {
            titleInput.focus();
            return;
        }

        const idea = {
            id: Date.now(),
            title: title,
            description: description,
            requester: requester,
            priority: priority,
            votes: 0,
            done: false,
            createdAt: new Date().toISOString(),
            createdDate: new Date().toLocaleDateString()
        };

        this.ideas.unshift(idea);

        // Clear inputs
        titleInput.value = '';
        descriptionInput.value = '';
        requesterInput.value = '';
        prioritySelect.value = 'medium';

        this.saveIdeas();
        this.render();
        this.updateStats();

        titleInput.focus();
    }

    deleteIdea(id) {
        if (confirm('Are you sure you want to delete this idea?')) {
            this.ideas = this.ideas.filter(idea => idea.id !== id);
            this.saveIdeas();
            this.render();
            this.updateStats();
        }
    }

    editIdea(id, ideaCard) {
        const idea = this.ideas.find(i => i.id === id);
        if (!idea) return;

        // Replace card content with edit form
        ideaCard.innerHTML = `
            <div class="edit-form">
                <input type="text" class="edit-title" value="${this.escapeHtml(idea.title)}" maxlength="100">
                <textarea class="edit-description" rows="3" placeholder="Describe your idea...">${this.escapeHtml(idea.description || '')}</textarea>
                <input type="text" class="edit-requester" value="${this.escapeHtml(idea.requester || '')}" placeholder="Who wants this?" maxlength="100">
                <select class="edit-priority">
                    <option value="low" ${idea.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                    <option value="medium" ${idea.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                    <option value="high" ${idea.priority === 'high' ? 'selected' : ''}>High Priority</option>
                </select>
                <div class="edit-actions">
                    <button class="save-btn" data-id="${idea.id}">Save</button>
                    <button class="cancel-btn" data-id="${idea.id}">Cancel</button>
                </div>
            </div>
        `;

        // Add event listeners for save and cancel
        const saveBtn = ideaCard.querySelector('.save-btn');
        const cancelBtn = ideaCard.querySelector('.cancel-btn');
        const titleInput = ideaCard.querySelector('.edit-title');

        saveBtn.addEventListener('click', () => this.saveEdit(id));
        cancelBtn.addEventListener('click', () => this.cancelEdit());

        // Save on Enter key in title field
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit(id);
        });

        // Focus on title input
        titleInput.focus();
        titleInput.select();
    }

    saveEdit(id) {
        const ideaCard = document.querySelector(`[data-id="${id}"]`).closest('.idea-card');
        const titleInput = ideaCard.querySelector('.edit-title');
        const descriptionInput = ideaCard.querySelector('.edit-description');
        const requesterInput = ideaCard.querySelector('.edit-requester');
        const prioritySelect = ideaCard.querySelector('.edit-priority');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const requester = requesterInput.value.trim();
        const priority = prioritySelect.value;

        if (!title) {
            titleInput.focus();
            return;
        }

        // Update the idea
        const ideaIndex = this.ideas.findIndex(i => i.id === id);
        if (ideaIndex !== -1) {
            this.ideas[ideaIndex] = {
                ...this.ideas[ideaIndex],
                title: title,
                description: description,
                requester: requester,
                priority: priority
            };

            this.saveIdeas();
            this.render();
        }
    }

    cancelEdit() {
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.render();
    }

    setSort(sort) {
        this.currentSort = sort;

        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-sort="${sort}"]`).classList.add('active');

        this.render();
    }

    voteForIdea(id) {
        const ideaIndex = this.ideas.findIndex(i => i.id === id);
        if (ideaIndex !== -1) {
            this.ideas[ideaIndex].votes = (this.ideas[ideaIndex].votes || 0) + 1;
            this.saveIdeas();
            this.render();
        }
    }

    setTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show/hide input section based on tab
        const inputSection = document.querySelector('.input-section');
        const filterSection = document.querySelector('.filter-section');
        const generateBtn = document.getElementById('generateBtn');

        if (tab === 'done') {
            inputSection.style.display = 'none';
            filterSection.style.display = 'none';
            generateBtn.style.display = 'none';
        } else {
            inputSection.style.display = 'flex';
            filterSection.style.display = 'flex';
            generateBtn.style.display = 'inline-block';
        }

        this.render();
        this.updateStats();
    }

    markAsDone(id) {
        const ideaIndex = this.ideas.findIndex(i => i.id === id);
        if (ideaIndex !== -1) {
            this.ideas[ideaIndex].done = true;
            this.ideas[ideaIndex].completedDate = new Date().toLocaleDateString();
            this.saveIdeas();
            this.render();
            this.updateStats();
        }
    }

    markAsActive(id) {
        const ideaIndex = this.ideas.findIndex(i => i.id === id);
        if (ideaIndex !== -1) {
            this.ideas[ideaIndex].done = false;
            delete this.ideas[ideaIndex].completedDate;
            this.saveIdeas();
            this.render();
            this.updateStats();
        }
    }

    getFilteredIdeas() {
        // First filter by tab (active/done)
        let tabFiltered = this.ideas.filter(idea => {
            if (this.currentTab === 'done') {
                return idea.done === true;
            } else {
                return idea.done !== true;
            }
        });

        // Then filter by priority if not "all"
        let filtered = this.currentFilter === 'all'
            ? tabFiltered
            : tabFiltered.filter(idea => idea.priority === this.currentFilter);

        // Sort the filtered ideas
        return filtered.sort((a, b) => {
            if (this.currentSort === 'votes') {
                return (b.votes || 0) - (a.votes || 0);
            } else {
                // Sort by newest (default)
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    render() {
        const ideasList = document.getElementById('ideasList');
        const filteredIdeas = this.getFilteredIdeas();

        ideasList.innerHTML = '';

        if (filteredIdeas.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <h3>No ideas yet!</h3>
                <p>Start capturing your brilliant product ideas above.</p>
            `;
            ideasList.appendChild(emptyState);
            return;
        }

        filteredIdeas.forEach(idea => {
            const ideaCard = document.createElement('div');
            ideaCard.className = `idea-card ${idea.priority}`;

            ideaCard.innerHTML = `
                <div class="idea-header">
                    <h3 class="idea-title">${this.escapeHtml(idea.title)}</h3>
                    <div class="idea-header-right">
                        <div class="vote-section">
                            <button class="vote-btn" data-id="${idea.id}">👍 ${idea.votes || 0}</button>
                        </div>
                        <span class="idea-priority priority-${idea.priority}">${idea.priority}</span>
                    </div>
                </div>
                ${idea.description ? `<div class="idea-description">${this.escapeHtml(idea.description)}</div>` : ''}
                ${idea.requester ? `<div class="idea-requester"><strong>Requested by:</strong> ${this.escapeHtml(idea.requester)}</div>` : ''}
                ${idea.businessValue ? `<div class="idea-business-value"><strong>💰 Potential Business Value:</strong> ${this.escapeHtml(idea.businessValue)}</div>` : ''}
                <div class="idea-meta">
                    <span class="idea-date">${idea.done ? `Completed ${idea.completedDate}` : `Added ${idea.createdDate}`}</span>
                    <div class="idea-actions">
                        ${idea.done
                    ? `<button class="reactivate-btn" data-id="${idea.id}">Reactivate</button>`
                    : `<button class="done-btn" data-id="${idea.id}">Mark Done</button>`
                }
                        <button class="edit-btn" data-id="${idea.id}">Edit</button>
                        <button class="delete-btn" data-id="${idea.id}">Delete</button>
                    </div>
                </div>
            `;

            const deleteBtn = ideaCard.querySelector('.delete-btn');
            const editBtn = ideaCard.querySelector('.edit-btn');
            const voteBtn = ideaCard.querySelector('.vote-btn');
            const doneBtn = ideaCard.querySelector('.done-btn');
            const reactivateBtn = ideaCard.querySelector('.reactivate-btn');

            deleteBtn.addEventListener('click', () => this.deleteIdea(idea.id));
            editBtn.addEventListener('click', () => this.editIdea(idea.id, ideaCard));
            voteBtn.addEventListener('click', () => this.voteForIdea(idea.id));

            if (doneBtn) {
                doneBtn.addEventListener('click', () => this.markAsDone(idea.id));
            }
            if (reactivateBtn) {
                reactivateBtn.addEventListener('click', () => this.markAsActive(idea.id));
            }

            ideasList.appendChild(ideaCard);
        });
    }

    updateStats() {
        const activeIdeas = this.ideas.filter(idea => !idea.done).length;
        const doneIdeas = this.ideas.filter(idea => idea.done).length;
        const totalIdeas = this.ideas.length;

        const ideaCount = document.getElementById('ideaCount');

        if (this.currentTab === 'done') {
            ideaCount.textContent = `${doneIdeas} completed idea${doneIdeas !== 1 ? 's' : ''}`;
        } else {
            ideaCount.textContent = `${activeIdeas} active idea${activeIdeas !== 1 ? 's' : ''} • ${doneIdeas} completed`;
        }
    }

    exportIdeas() {
        if (this.ideas.length === 0) {
            alert('No ideas to export!');
            return;
        }

        // Prepare data for Excel export
        const exportData = this.ideas.map((idea, index) => ({
            '#': index + 1,
            'Title': idea.title,
            'Description': idea.description || '',
            'Who Wants This': idea.requester || '',
            'Potential Business Value': idea.businessValue || '',
            'Votes': idea.votes || 0,
            'Priority': idea.priority.charAt(0).toUpperCase() + idea.priority.slice(1),
            'Status': idea.done ? 'Done' : 'Active',
            'Date Added': idea.createdDate
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // # column
            { wch: 30 },  // Title column
            { wch: 50 },  // Description column
            { wch: 25 },  // Who Wants This column
            { wch: 60 },  // Potential Business Value column
            { wch: 8 },   // Votes column
            { wch: 12 },  // Priority column
            { wch: 10 },  // Status column
            { wch: 12 }   // Date column
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Product Ideas');

        // Generate filename with current date
        const filename = `product-ideas-${new Date().toISOString().split('T')[0]}.xlsx`;

        // Save the file
        XLSX.writeFile(wb, filename);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateAccountingIdeas() {
        const accountingIdeas = [
            {
                title: "Making Tax Digital (MTD) VAT Integration",
                description: "Seamless integration with HMRC's Making Tax Digital for VAT submissions. Auto-populate VAT returns and submit directly to HMRC with digital record keeping.",
                requester: "Small businesses",
                priority: "high",
                businessValue: "Mandatory compliance requirement - prevents £400+ penalties per quarter. Reduces VAT preparation time by 75% and eliminates manual errors."
            },
            {
                title: "Real-time Bank Feed Integration",
                description: "Connect to all major UK banks (Barclays, HSBC, Lloyds, etc.) for automatic transaction import and bank reconciliation.",
                requester: "Accountants & bookkeepers",
                priority: "high",
                businessValue: "Saves 8+ hours per month on data entry. Reduces reconciliation errors by 95% and enables real-time cash flow visibility. Premium feature commands £15-25/month."
            },
            {
                title: "Mobile Receipt Scanning",
                description: "AI-powered mobile app to scan receipts, extract data automatically, and categorise expenses. Works offline and syncs when connected.",
                requester: "Small business owners",
                priority: "medium",
                businessValue: "Increases user engagement by 40%. Reduces expense processing time by 80%. Key differentiator for mobile-first small businesses - drives 25% higher retention."
            },
            {
                title: "Construction Industry Scheme (CIS) Management",
                description: "Full CIS compliance including subcontractor verification, deduction calculations, and monthly return submissions to HMRC.",
                requester: "Construction companies",
                priority: "high",
                businessValue: "Captures £2B+ construction market. Prevents costly HMRC penalties (£100-£3000 per return). Specialist feature commands premium pricing of £50+/month."
            },
            {
                title: "Payroll Integration with Auto Enrolment",
                description: "Built-in payroll with automatic pension auto-enrolment, RTI submissions, and integration with major pension providers like NEST.",
                requester: "HR departments",
                priority: "medium",
                businessValue: "Expands addressable market by 60%. Payroll services generate £25-50/employee/month. Reduces compliance risk and £500+ auto-enrolment penalties."
            },
            {
                title: "Multi-currency Support",
                description: "Handle multiple currencies with real-time exchange rates, foreign currency bank accounts, and automatic revaluation.",
                requester: "Import/export businesses",
                priority: "medium",
                businessValue: "Opens international SME market (15% of UK businesses). Premium feature adds £20-30/month. Prevents costly FX revaluation errors and audit issues."
            },
            {
                title: "Advanced Reporting Dashboard",
                description: "Interactive dashboards with KPIs, cash flow forecasting, profit/loss trends, and customisable reports for different stakeholders.",
                requester: "Business owners",
                priority: "medium",
                businessValue: "Improves decision-making speed by 50%. Reduces time to insights from days to minutes. Premium analytics features justify £30-50/month pricing tiers."
            },
            {
                title: "Client Portal for Accountants",
                description: "Secure portal where clients can upload documents, view reports, approve transactions, and communicate with their accountant.",
                requester: "Accounting practices",
                priority: "high",
                businessValue: "Increases accountant efficiency by 35%. Reduces client queries by 60%. Enables premium service tiers at £100-200/client/year. Key differentiator for practices."
            },
            {
                title: "Inventory Management Integration",
                description: "Track stock levels, cost of goods sold, reorder points, and integrate with popular e-commerce platforms like Shopify and Amazon.",
                requester: "Retail businesses",
                priority: "medium",
                businessValue: "Captures retail/e-commerce market (30% of SMEs). Prevents stockouts and overstock costs. Inventory features command £25-40/month premium pricing."
            },
            {
                title: "Automated Invoice Chasing",
                description: "Smart invoice reminders with escalation sequences, payment links, and integration with debt collection services.",
                requester: "Credit controllers",
                priority: "medium",
                businessValue: "Reduces average payment time by 15-25 days. Improves cash flow by £10K+ for typical SME. Automation features drive 30% higher customer lifetime value."
            },
            {
                title: "Companies House Integration",
                description: "Automatic filing of annual accounts and confirmation statements directly to Companies House with validation checks.",
                requester: "Company secretaries",
                priority: "high",
                businessValue: "Prevents £150-1500 late filing penalties. Saves 4+ hours per filing. Compliance automation justifies £20-30/month premium for limited companies."
            },
            {
                title: "Expense Management for Employees",
                description: "Employee expense app with mileage tracking, receipt capture, approval workflows, and automatic reimbursement processing.",
                requester: "Finance teams",
                priority: "medium",
                businessValue: "Reduces expense processing time by 70%. Improves compliance and audit readiness. Employee self-service features reduce admin burden by 50%."
            },
            {
                title: "Open Banking Payment Initiation",
                description: "Enable customers to pay invoices directly from their bank account using Open Banking, reducing payment friction and fees.",
                requester: "Sales teams",
                priority: "medium",
                businessValue: "Reduces payment processing fees by 60%. Improves payment conversion rates by 25%. Faster payments improve cash flow by 10-15 days average."
            },
            {
                title: "AI-Powered Transaction Categorisation",
                description: "Machine learning to automatically categorise transactions, detect anomalies, and suggest accounting treatments.",
                requester: "Bookkeepers",
                priority: "low",
                businessValue: "Reduces manual categorisation time by 85%. Improves accuracy to 95%+. AI features justify premium pricing and differentiate from competitors."
            },
            {
                title: "Project-based Accounting",
                description: "Track profitability by project, allocate costs and revenues, time tracking integration, and project-specific reporting.",
                requester: "Service businesses",
                priority: "medium",
                businessValue: "Captures professional services market (25% of SMEs). Improves project profitability visibility by 40%. Premium feature adds £20-35/month per user."
            },
            {
                title: "GDPR Compliance Tools",
                description: "Data protection features including audit trails, data retention policies, right to be forgotten, and consent management.",
                requester: "Compliance officers",
                priority: "medium",
                businessValue: "Prevents £17.5M+ GDPR fines. Reduces compliance audit time by 60%. Data protection features command £10-20/month premium for risk-conscious businesses."
            },
            {
                title: "Integration with Sage, Xero, QuickBooks",
                description: "Migration tools and ongoing sync capabilities with other popular accounting software for seamless transitions.",
                requester: "Switching customers",
                priority: "high",
                businessValue: "Reduces customer acquisition cost by 40%. Eliminates migration barriers for 80% of prospects. Integration capabilities increase win rate by 35%."
            },
            {
                title: "White-label Solution for Accountants",
                description: "Rebrandable platform that accounting firms can offer to their clients under their own brand and pricing.",
                requester: "Accounting firms",
                priority: "low",
                businessValue: "Opens B2B2C channel with 10,000+ UK accounting practices. Recurring revenue of £50-200/practice/month. Scales customer acquisition through partners."
            },
            {
                title: "Landlord Property Management",
                description: "Rental income tracking, tenant management, maintenance scheduling, and property-specific P&L reporting.",
                requester: "Property investors",
                priority: "medium",
                businessValue: "Captures £2.6B+ UK rental market. Property features command £15-30/property/month. Specialist market with high willingness to pay for compliance."
            },
            {
                title: "Carbon Footprint Tracking",
                description: "Environmental impact reporting based on business activities, helping companies meet sustainability goals and ESG requirements.",
                requester: "Sustainability teams",
                priority: "low",
                businessValue: "Future-proofs for mandatory climate reporting. Appeals to ESG-conscious businesses (growing 25% annually). Sustainability features justify premium positioning."
            }
        ];

        // Check if we've reached the maximum limit of 40 ideas
        if (this.ideas.length >= 40) {
            const generateBtn = document.getElementById('generateBtn');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = '🚫 Maximum 40 ideas reached!';
            generateBtn.style.background = '#dc3545';

            setTimeout(() => {
                generateBtn.textContent = originalText;
                generateBtn.style.background = '';
            }, 3000);
            return;
        }

        // Shuffle and select random ideas to add variety
        const shuffled = accountingIdeas.sort(() => 0.5 - Math.random());
        const selectedIdeas = shuffled.slice(0, 3); // Add only 3 random ideas

        let addedCount = 0;
        selectedIdeas.forEach((ideaTemplate, index) => {
            // Check if idea already exists and we haven't reached the limit
            const exists = this.ideas.some(existing =>
                existing.title.toLowerCase() === ideaTemplate.title.toLowerCase()
            );

            if (!exists && this.ideas.length < 40) {
                const idea = {
                    id: Date.now() + index,
                    title: ideaTemplate.title,
                    description: ideaTemplate.description,
                    requester: ideaTemplate.requester,
                    priority: ideaTemplate.priority,
                    businessValue: ideaTemplate.businessValue,
                    votes: Math.floor(Math.random() * 5), // Random initial votes 0-4
                    done: false,
                    createdAt: new Date().toISOString(),
                    createdDate: new Date().toLocaleDateString()
                };

                this.ideas.unshift(idea);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.saveIdeas();
            this.render();
            this.updateStats();

            // Show success message
            const generateBtn = document.getElementById('generateBtn');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = `✅ Added ${addedCount} ideas!`;
            generateBtn.style.background = '#28a745';

            setTimeout(() => {
                generateBtn.textContent = originalText;
                generateBtn.style.background = '';
            }, 2000);
        } else {
            // All ideas already exist
            const generateBtn = document.getElementById('generateBtn');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = '💡 All ideas already added!';
            generateBtn.style.background = '#ffc107';

            setTimeout(() => {
                generateBtn.textContent = originalText;
                generateBtn.style.background = '';
            }, 2000);
        }
    }

    resetData() {
        if (confirm('Are you sure you want to reset all data? This will permanently delete all ideas and cannot be undone.')) {
            this.ideas = [];
            localStorage.removeItem('productIdeas');
            this.render();
            this.updateStats();

            // Show success message
            const resetBtn = document.getElementById('resetBtn');
            const originalText = resetBtn.textContent;
            resetBtn.textContent = '✅ Data Reset!';
            resetBtn.style.background = '#28a745';

            setTimeout(() => {
                resetBtn.textContent = originalText;
                resetBtn.style.background = '';
            }, 2000);
        }
    }

    saveIdeas() {
        localStorage.setItem('productIdeas', JSON.stringify(this.ideas));
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ProductIdeasApp();
});