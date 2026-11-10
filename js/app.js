/**
 * IELTS Exam Runner Platform
 * High-efficiency, zero-backend, JSON-driven online exam engine.
 */

const examManifest = [
    'exam-2.json',
];

class IELTSExamRunner {
    constructor() {
        this.studentName = '';
        this.examData = null;
        this.activeSectionKeys = []; // Ordered keys of enabled sections
        this.currentSectionIndex = -1;
        this.studentAnswers = {}; // Final result structure
        this.timerInterval = null;
        this.timeLeftSeconds = 0;
        this.chartInstance = null;
        this.currentPassageIndex = 0; // Active passage tab for reading

        this.initDOM();
    }

    initDOM() {
        document.getElementById('btn-start-welcome').addEventListener('click', () => this.handleWelcomeSubmit());
        document.getElementById('btn-start-exam').addEventListener('click', () => this.startExamFlow());
        document.getElementById('btn-next-section').addEventListener('click', () => this.confirmNextSection());
        document.getElementById('btn-modal-cancel').addEventListener('click', () => this.hideModal());
        document.getElementById('btn-modal-confirm').addEventListener('click', () => {
            this.hideModal();
            this.advanceToNextSection();
        });
        document.getElementById('btn-download-json').addEventListener('click', () => this.downloadAnswersJSON());
    }

    handleWelcomeSubmit() {
        const nameInput = document.getElementById('input-student-name');
        const val = nameInput.value.trim();

        if (!val) {
            alert('Please enter your full name before continuing.');
            return;
        }

        this.studentName = val;
        document.getElementById('welcome-view').classList.add('hidden');
        document.getElementById('rules-view').classList.remove('hidden');

        // Fetch random exam file asynchronously
        this.loadRandomExam();
    }

    async loadRandomExam() {
        const randomIndex = Math.floor(Math.random() * examManifest.length);
        const targetFile = examManifest[randomIndex];
        const fetchUrl = `js/exam/${targetFile}`;

        try {
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`Failed to load ${targetFile} (HTTP ${res.status})`);
            this.examData = await res.json();
            this.prepareExamStructure();
        } catch (err) {
            console.error('Exam loading error:', err);
            alert('Error loading exam payload. Ensure the files are hosted properly on a local server or GitHub Pages.');
        }
    }

    prepareExamStructure() {
        // Standard IELTS section sequence
        const candidateKeys = ['listening', 'reading', 'writingTask1', 'writingTask2'];
        this.activeSectionKeys = [];

        // Determine enabled parts & build initial response structure
        candidateKeys.forEach(key => {
            const section = this.examData[key];
            if (section && section.enabled === true) {
                this.activeSectionKeys.push(key);
                this.studentAnswers[key] = {
                    enabled: true,
                    answers: {}
                };
            } else {
                this.studentAnswers[key] = {
                    enabled: false
                };
            }
        });

        document.getElementById('exam-title-display').innerText = this.examData.title || 'IELTS Academic Exam';
        document.getElementById('btn-start-exam').disabled = false;
        document.getElementById('btn-start-exam').innerText = 'I Agree & Start Exam';
    }

    startExamFlow() {
        if (!this.activeSectionKeys.length) {
            alert('This exam configuration contains no active sections.');
            return;
        }

        document.getElementById('rules-view').classList.add('hidden');
        document.getElementById('exam-view').classList.remove('hidden');

        this.currentSectionIndex = 0;
        this.renderCurrentSection();
    }

    renderCurrentSection() {
        if (this.currentSectionIndex >= this.activeSectionKeys.length) {
            this.finishExam();
            return;
        }

        const sectionKey = this.activeSectionKeys[this.currentSectionIndex];
        const sectionData = this.examData[sectionKey];

        // Header updates
        document.getElementById('section-title-badge').innerText = this.formatSectionTitle(sectionKey);

        // Hide all template panels
        document.getElementById('panel-listening').classList.add('hidden');
        document.getElementById('panel-reading').classList.add('hidden');
        document.getElementById('panel-writing-1').classList.add('hidden');
        document.getElementById('panel-writing-2').classList.add('hidden');

        // Reset Chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        // Render specific section panel
        if (sectionKey === 'listening') {
            this.renderListening(sectionData);
        } else if (sectionKey === 'reading') {
            this.currentPassageIndex = 0; // Reset to passage 1
            this.renderReading(sectionData);
        } else if (sectionKey === 'writingTask1') {
            this.renderWritingTask1(sectionData);
        } else if (sectionKey === 'writingTask2') {
            this.renderWritingTask2(sectionData);
        }

        // Initialize Countdown Timer
        this.startTimer(sectionData.durationMinutes || 20);
    }

    formatSectionTitle(key) {
        switch (key) {
            case 'listening': return 'LISTENING SECTION';
            case 'reading': return 'READING SECTION';
            case 'writingTask1': return 'WRITING TASK 1';
            case 'writingTask2': return 'WRITING TASK 2';
            default: return key.toUpperCase();
        }
    }

    startTimer(minutes) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timeLeftSeconds = minutes * 60;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeLeftSeconds--;
            this.updateTimerDisplay();

            if (this.timeLeftSeconds <= 0) {
                clearInterval(this.timerInterval);
                alert('Time is up for this section! Auto-advancing to the next part...');
                this.saveCurrentSectionAnswers();
                this.advanceToNextSection();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timeLeftSeconds / 60);
        const secs = this.timeLeftSeconds % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('timer-display').innerText = formatted;
    }

    renderListening(data) {
        const panel = document.getElementById('panel-listening');
        panel.classList.remove('hidden');
        document.getElementById('listening-instructions').innerText = data.instructions || '';

        const container = document.getElementById('listening-questions-container');
        container.innerHTML = '';

        if (data.questions) {
            data.questions.forEach((q) => {
                const wrapper = document.createElement('div');
                wrapper.className = "bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-2";
                wrapper.innerHTML = `
                    <label class="block text-sm font-semibold text-slate-200">${q.prompt}</label>
                    <input type="text" data-q-id="${q.id}" class="listening-input w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                `;
                container.appendChild(wrapper);
            });
        }
    }

    renderReading(data) {
        const panel = document.getElementById('panel-reading');
        panel.classList.remove('hidden');

        document.getElementById('reading-instructions').innerText = data.instructions || '';

        const passages = data.passages || [];
        const tabsContainer = document.getElementById('passage-tabs');
        tabsContainer.innerHTML = '';

        if (passages.length === 0) return;

        // Render passage selector tabs
        passages.forEach((p, idx) => {
            const btn = document.createElement('button');
            const isActive = idx === this.currentPassageIndex;
            btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`;
            btn.innerText = `Passage ${p.passageNumber || idx + 1}`;
            btn.addEventListener('click', () => {
                this.saveReadingAnswersCurrentView();
                this.currentPassageIndex = idx;
                this.renderReading(data);
            });
            tabsContainer.appendChild(btn);
        });

        // Render active passage content & questions
        const activePassage = passages[this.currentPassageIndex] || passages[0];
        document.getElementById('reading-passage-title').innerText = activePassage.title || '';
        document.getElementById('reading-passage-content').innerText = activePassage.content || '';

        const qContainer = document.getElementById('reading-questions-container');
        qContainer.innerHTML = '';

        const activeQuestions = activePassage.questions || [];
        activeQuestions.forEach((q) => {
            const wrapper = document.createElement('div');
            wrapper.className = "bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-2";

            let inputHtml = '';
            const existingVal = this.studentAnswers.reading.answers[q.id] || '';

            if (q.options && q.options.length > 0) {
              // Render stacked options vertically for long text
              inputHtml = `<div class="space-y-2 pt-1">`;
              q.options.forEach((opt) => {
                const isSelected = existingVal === opt;
                inputHtml += `
                              <label class="flex items-start space-x-3 bg-slate-950 border ${isSelected ? "border-blue-500 bg-blue-950/40" : "border-slate-700"} px-3.5 py-2.5 rounded-lg cursor-pointer hover:border-slate-500 transition w-full">
                              <input type="radio" name="q_${q.id}" value="${opt}" ${isSelected ? "checked" : ""} data-q-id="${q.id}" class="reading-input text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0">
                              <span class="text-xs font-medium text-slate-200 leading-relaxed">${opt}</span>
                        </label>
                    `;
              });
              inputHtml += `</div>`;
              // }
              // if (q.options && q.options.length > 0) {
              //     // Render option buttons or radio choices
              //     inputHtml = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">`;
              //     q.options.forEach(opt => {
              //         const isSelected = existingVal === opt;
              //         inputHtml += `
              //             <label class="flex items-center space-x-2 bg-slate-950 border ${isSelected ? 'border-blue-500 bg-blue-950/40' : 'border-slate-700'} px-3 py-2 rounded-lg cursor-pointer hover:border-slate-500 transition">
              //                 <input type="radio" name="q_${q.id}" value="${opt}" ${isSelected ? 'checked' : ''} data-q-id="${q.id}" class="reading-input text-blue-600 focus:ring-blue-500">
              //                 <span class="text-xs font-medium text-slate-200">${opt}</span>
              //             </label>
              //         `;
              //     });
              //     inputHtml += `</div>`;
            } else {
                // Render text input for short answer / completion
                inputHtml = `
                    <input type="text" data-q-id="${q.id}" value="${existingVal}" class="reading-input w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                `;
            }

            wrapper.innerHTML = `
                <label class="block text-sm font-semibold text-slate-200">${q.prompt}</label>
                ${inputHtml}
            `;
            qContainer.appendChild(wrapper);
        });
    }

    saveReadingAnswersCurrentView() {
        // Collect text inputs
        const textInputs = document.querySelectorAll('#reading-questions-container input[type="text"].reading-input');
        textInputs.forEach(inp => {
            const qId = inp.getAttribute('data-q-id');
            if (qId) {
                this.studentAnswers.reading.answers[qId] = inp.value.trim();
            }
        });

        // Collect checked radios
        const checkedRadios = document.querySelectorAll('#reading-questions-container input[type="radio"].reading-input:checked');
        checkedRadios.forEach(rad => {
            const qId = rad.getAttribute('data-q-id');
            if (qId) {
                this.studentAnswers.reading.answers[qId] = rad.value.trim();
            }
        });
    }

    renderWritingTask1(data) {
        const panel = document.getElementById('panel-writing-1');
        panel.classList.remove('hidden');

        document.getElementById('w1-instructions').innerText = data.instructions || '';
        document.getElementById('w1-prompt-title').innerText = data.promptTitle || '';
        document.getElementById('w1-prompt-desc').innerText = data.promptDesc || '';
        document.getElementById('w1-essay-input').value = this.studentAnswers.writingTask1.answers['essay'] || '';

        // Render Chart.js if data exists
        if (data.chartType && data.labels && data.datasets) {
            const ctx = document.getElementById('w1-chart').getContext('2d');
            this.chartInstance = new Chart(ctx, {
                type: data.chartType,
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#cbd5e1', font: { family: 'system-ui', size: 11 } }
                        }
                    },
                    scales: data.chartType !== 'pie' ? {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                    } : {}
                }
            });
        }
    }

    renderWritingTask2(data) {
        const panel = document.getElementById('panel-writing-2');
        panel.classList.remove('hidden');

        document.getElementById('w2-instructions').innerText = data.instructions || '';
        document.getElementById('w2-prompt').innerText = data.prompt || '';
        document.getElementById('w2-essay-input').value = this.studentAnswers.writingTask2.answers['essay'] || '';
    }

    confirmNextSection() {
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
    }

    saveCurrentSectionAnswers() {
        const sectionKey = this.activeSectionKeys[this.currentSectionIndex];

        if (sectionKey === 'listening') {
            const inputs = document.querySelectorAll('.listening-input');
            inputs.forEach(inp => {
                const qId = inp.getAttribute('data-q-id');
                this.studentAnswers.listening.answers[qId] = inp.value.trim();
            });
        } else if (sectionKey === 'reading') {
            this.saveReadingAnswersCurrentView();
        } else if (sectionKey === 'writingTask1') {
            const text = document.getElementById('w1-essay-input').value.trim();
            this.studentAnswers.writingTask1.answers['essay'] = text;
        } else if (sectionKey === 'writingTask2') {
            const text = document.getElementById('w2-essay-input').value.trim();
            this.studentAnswers.writingTask2.answers['essay'] = text;
        }
    }

    advanceToNextSection() {
        this.saveCurrentSectionAnswers();
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.currentSectionIndex++;
        this.renderCurrentSection();
    }

    finishExam() {
        document.getElementById('exam-view').classList.add('hidden');
        document.getElementById('finish-view').classList.remove('hidden');

        if (this.timerInterval) clearInterval(this.timerInterval);

        // Compile output payload
        const finalOutput = {
            studentName: this.studentName,
            examId: this.examData.examId,
            submittedAt: new Date().toISOString(),
            results: this.studentAnswers
        };

        const jsonStr = JSON.stringify(finalOutput, null, 2);

        // Populate mailto link
        const subject = encodeURIComponent(`ielts exam ${this.studentName}`);
        const body = encodeURIComponent(`Teacher,

Please find my IELTS exam submission JSON attached/pasted below.

Student: ${this.studentName}
Exam ID: ${this.examData.examId}

--- RESULTS JSON ---
${jsonStr}`);
        const mailtoUrl = `mailto:noahthonymhn@gmail.com?subject=${subject}&body=${body}`;

        document.getElementById('btn-email-teacher').href = mailtoUrl;

        // Store payload reference for direct download button
        this.finalJsonPayload = jsonStr;
    }

    downloadAnswersJSON() {
        if (!this.finalJsonPayload) return;
        const blob = new Blob([this.finalJsonPayload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ielts-exam-${this.studentName.replace(/\s+/g, '-').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.app = new IELTSExamRunner();
});
