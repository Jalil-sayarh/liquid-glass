class BreathingExercise {
    constructor() {
        // Core state
        this.isPlaying = false;
        this.currentExercise = 'calm';
        this.currentPhase = 'ready';
        this.breathCount = 0;
        this.roundCount = 1;
        this.phaseTimer = null;

        // Exercise definitions - simplified
        this.exercises = {
            'wim-hof': {
                name: 'Wim Hof Method',
                description: 'Take 30 deep breaths, then hold after exhale. Repeat for 3 rounds.',
                rounds: 3,
                steps: [
                    { type: 'breathing', count: 30, inhaleDuration: 2000, exhaleDuration: 1500 },
                    { type: 'hold', duration: 30000 },
                    { type: 'recovery', duration: 17000 }
                ]
            },
            'box': {
                name: 'Box Breathing',
                description: 'Inhale, hold, exhale, hold - each for 4 seconds. Complete 10 rounds.',
                rounds: 20,
                steps: [
                    { type: 'inhale', duration: 4000 },
                    { type: 'hold', duration: 4000 },
                    { type: 'exhale', duration: 4000 },
                    { type: 'hold', duration: 4000 }
                ]
            },
            'calm': {
                name: '4-7-8 Calm',
                description: 'Inhale for 4, hold for 7, exhale for 8 seconds. Complete 8 rounds.',
                rounds: 8,
                steps: [
                    { type: 'inhale', duration: 4000 },
                    { type: 'hold', duration: 7000 },
                    { type: 'exhale', duration: 8000 }
                ]
            }
        };

        this.init();
    }

    init() {
        // Get DOM elements
        this.playStopBtn = document.getElementById('playStop');
        this.debugToggle = document.getElementById('debugToggle');
        this.soundToggle = document.getElementById('soundToggle');
        
        this.breathingCircle = document.querySelector('.breathing-circle');
        this.durationBlob = document.querySelector('.duration-blob');
        this.progressRing = document.querySelector('.progress-ring-progress');
        
        this.phaseText = document.querySelector('.phase-text');
        this.phaseSubtext = document.querySelector('.phase-subtext');
        this.roundNumber = document.querySelector('.round-number');

        this.exerciseDescription = document.querySelector('.exercise-description');
        
        this.congratulationsPopup = document.getElementById('congratulationsPopup');
        this.popupCloseBtn = document.getElementById('popupCloseBtn');
        
        this.debugTimer = document.getElementById('debugTimer');
        this.timerPhase = document.getElementById('timerPhase');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        this.timerProgressBar = document.getElementById('timerProgressBar');
        
        this.playIcon = document.querySelector('.play-icon');
        this.stopIcon = document.querySelector('.stop-icon');
        
        this.soundOnIcon = document.querySelector('.sound-on-icon');
        this.soundOffIcon = document.querySelector('.sound-off-icon');
        this.ambientAudio = document.getElementById('ambientAudio');
        
        // Sound state
        this.soundEnabled = false;
        
        // Debug mode
        this.debugMode = false;
        this.timerUpdateId = null;
        this.phaseStartTime = 0;
        this.phaseDuration = 0;

        // Bind events
        this.playStopBtn.addEventListener('click', () => this.toggleExercise());
        this.debugToggle.addEventListener('click', () => this.toggleDebugMode());
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.popupCloseBtn.addEventListener('click', () => this.hidePopup());
        
        // Close popup when clicking outside
        this.congratulationsPopup.addEventListener('click', (e) => {
            if (e.target === this.congratulationsPopup) {
                this.hidePopup();
            }
        });
        
        document.querySelectorAll('.exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchExercise(e.target.dataset.exercise));
        });

        this.updateExerciseInfo();
        this.updateUI();
        this.updateSoundUI();
    }

    // Main control methods
    toggleExercise() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        console.log('Starting exercise:', this.currentExercise);
        this.isPlaying = true;
        this.playIcon.style.display = 'none';
        this.stopIcon.style.display = 'flex';
        
        if (this.currentPhase === 'ready' || this.currentPhase === 'complete') {
            this.resetToStart();
        }
        
        this.runPhase();
    }

    stop() {
        console.log('Stopping exercise');
        this.isPlaying = false;
        this.playIcon.style.display = 'flex';
        this.stopIcon.style.display = 'none';
        
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
        this.stopDebugTimer();
        
        // Reset the exercise completely
        this.resetToStart();
        this.updateUI();
    }



    resetToStart() {
        this.currentPhase = 'ready';
        this.breathCount = 0;
        this.roundCount = 1;
        
        if (this.phaseText) {
            this.phaseText.textContent = 'Get Ready';
        }
        if (this.phaseSubtext) {
            this.phaseSubtext.textContent = 'Press play to begin';
        }
        
        this.resetVisuals();
        this.resetDebugTimer();
    }

    switchExercise(exerciseType) {
        console.log('Switching to:', exerciseType);
        this.stop();
        this.currentExercise = exerciseType;
        
        // Update active button
        document.querySelectorAll('.exercise-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-exercise="${exerciseType}"]`).classList.add('active');
        
        // Update exercise info
        this.updateExerciseInfo();
        this.updateUI();
    }

    updateExerciseInfo() {
        const exercise = this.exercises[this.currentExercise];
        
        if (this.exerciseDescription) {
            this.exerciseDescription.textContent = exercise.description;
        }
    }

    // Core exercise logic
    runPhase() {
        if (!this.isPlaying) return;
        
        const exercise = this.exercises[this.currentExercise];
        console.log(`Running phase: ${this.currentPhase}, Round: ${this.roundCount}/${exercise.rounds}, Breath: ${this.breathCount}`);

        if (this.currentExercise === 'wim-hof') {
            this.runWimHof();
        } else {
            this.runCyclicExercise();
        }
    }

    runWimHof() {
        const exercise = this.exercises[this.currentExercise];
        
        if (this.currentPhase === 'ready') {
            this.currentPhase = 'inhale';
            this.breathCount = 0;
        }

        if (this.currentPhase === 'inhale' && this.breathCount < 30) {
            this.setPhase('inhale', 'Breathe In', `Breath ${this.breathCount + 1}/30`, 2000);
            this.breathCount++;
            
            this.phaseTimer = setTimeout(() => {
                this.setPhase('exhale', 'Breathe Out', `Breath ${this.breathCount}/30`, 1500);
                
                this.phaseTimer = setTimeout(() => {
                    if (this.breathCount < 30) {
                        this.currentPhase = 'inhale';
                    } else {
                        this.currentPhase = 'hold';
                    }
                    this.runPhase();
                }, 1500);
            }, 2000);
            
        } else if (this.currentPhase === 'hold') {
            this.setPhase('hold', 'Hold', 'Hold your breath', 30000);
            console.log('Starting 30-second hold phase');
            
            this.phaseTimer = setTimeout(() => {
                console.log('Hold phase complete after 30 seconds');
                this.currentPhase = 'recovery';
                this.runPhase();
            }, 30000); // 30 seconds to match animations
            
        } else if (this.currentPhase === 'recovery') {
            this.setPhase('recovery', 'Recovery Breath', 'Deep breath and hold', 2000);
            
            this.phaseTimer = setTimeout(() => {
                this.setPhase('hold', 'Hold Recovery', 'Hold this breath', 15000);
                
                this.phaseTimer = setTimeout(() => {
                    this.completeRound();
                }, 15000);
            }, 2000);
        }
    }

    runCyclicExercise() {
        const exercise = this.exercises[this.currentExercise];
        const stepIndex = this.breathCount % exercise.steps.length;
        const step = exercise.steps[stepIndex];
        
        const phaseNames = {
            'inhale': 'Breathe In',
            'exhale': 'Breathe Out', 
            'hold': 'Hold'
        };
        
        const currentRoundStep = (this.breathCount % exercise.steps.length) + 1;
        const subtext = `Step ${currentRoundStep}/${exercise.steps.length} - Round ${this.roundCount}/${exercise.rounds}`;
        
        this.setPhase(step.type, phaseNames[step.type] || step.type, subtext, step.duration);
        
        this.phaseTimer = setTimeout(() => {
            this.breathCount++;
            
            // Check if round complete
            if (this.breathCount % exercise.steps.length === 0) {
                this.completeRound();
            } else {
                this.runPhase();
            }
        }, step.duration);
    }

    completeRound() {
        const exercise = this.exercises[this.currentExercise];
        
        if (this.roundCount < exercise.rounds) {
            this.roundCount++;
            this.breathCount = 0; // Reset for new round
            
            // Different rest periods based on exercise type
            if (this.currentExercise === 'wim-hof') {
                // Wim Hof needs 45-second rest between intense rounds
                this.setPhase('ready', 'Round Complete', `45-second rest - Starting Round ${this.roundCount}`, 45000);
                
                this.phaseTimer = setTimeout(() => {
                    this.currentPhase = 'inhale';
                    this.runPhase();
                }, 45000);
                
            } else {
                // Box Breathing and 4-7-8 Calm continue immediately (seamless flow)
                console.log(`Continuing to round ${this.roundCount} - seamless flow`);
                
                // No interruption - continue immediately with first step of new round
                this.currentPhase = exercise.steps[0].type;
                this.runPhase();
            }
            
        } else {
            this.setPhase('complete', 'Exercise Complete', 'Well done!', 0);
            this.showCongratulatoryPopup();
            this.stop();
        }
        
        this.updateUI();
    }

    // Phase management
    setPhase(phase, text, subtext, duration = 0) {
        console.log(`Setting phase: ${phase}, duration: ${duration}ms`);
        
        this.currentPhase = phase;
        
        // Safely update text elements
        if (this.phaseText) {
            this.phaseText.textContent = text;
        }
        if (this.phaseSubtext) {
            this.phaseSubtext.textContent = subtext;
        }
        
        this.phaseDuration = duration;
        this.phaseStartTime = Date.now();
        
        // Update visual state
        this.updateVisuals(phase, duration);
        this.updateUI();
        
        // Start debug timer
        if (this.debugMode && duration > 0) {
            this.startDebugTimer(phase, duration);
        }
    }

    updateVisuals(phase, duration) {
        // Remove all phase classes
        this.breathingCircle.classList.remove('inhale', 'exhale', 'hold', 'recovery');
        
        // Add current phase class
        if (phase !== 'ready' && phase !== 'complete') {
            this.breathingCircle.classList.add(phase);
        }
        
        // Update blob and progress
        if (duration > 0 && this.isPlaying) {
            this.startAnimations(duration);
        }
        
        // Update blob color
        this.updateBlobColor(phase);
    }

    updateBlobColor(phase) {
        if (!this.durationBlob) return;
        
        const colors = {
            'inhale': 'linear-gradient(45deg, #87CEEB, #ffffff)',
            'exhale': 'linear-gradient(45deg, #3b82f6, #87CEEB)', 
            'hold': 'linear-gradient(45deg, #1e3a8a, #3b82f6)',
            'recovery': 'linear-gradient(45deg, #ffffff, #87CEEB)',
            'ready': 'linear-gradient(45deg, #87CEEB, #ffffff)'
        };
        
        this.durationBlob.style.background = colors[phase] || colors['ready'];
    }

    startAnimations(duration) {
        // Reset blob position
        if (this.durationBlob) {
            this.durationBlob.style.left = '50%';
            this.durationBlob.style.top = '10px';
            this.durationBlob.classList.remove('circling');
            
            // Force reflow and start animation
            this.durationBlob.offsetHeight;
            
            // Set CSS variable for duration
            document.documentElement.style.setProperty('--blob-rotation-duration', `${duration / 1000}s`);
            
            requestAnimationFrame(() => {
                this.durationBlob.classList.add('circling');
            });
        }
        
        // Update progress ring
        if (this.progressRing) {
            this.progressRing.style.strokeDashoffset = '659.73';
            setTimeout(() => {
                this.progressRing.style.strokeDashoffset = '0';
                this.progressRing.style.transition = `stroke-dashoffset ${duration / 1000}s linear`;
            }, 50);
        }
    }

    resetVisuals() {
        this.breathingCircle.classList.remove('inhale', 'exhale', 'hold', 'recovery');
        if (this.durationBlob) {
            this.durationBlob.classList.remove('circling');
            this.durationBlob.style.left = '50%';
            this.durationBlob.style.top = '10px';
        }
        if (this.progressRing) {
            this.progressRing.style.strokeDashoffset = '659.73';
            this.progressRing.style.transition = '';
        }
    }

    // UI Updates
    updateUI() {
        const exercise = this.exercises[this.currentExercise];
        
        // Safely update elements that exist
        if (this.roundNumber) {
            this.roundNumber.textContent = `${this.roundCount}/${exercise.rounds}`;
        }
    }

    // Congratulations popup
    showCongratulatoryPopup() {
        console.log('Showing congratulations popup');
        
        if (this.congratulationsPopup) {
            // Update message based on exercise type
            this.updatePopupMessage();
            
            // Show popup with smooth animation
            this.congratulationsPopup.style.display = 'flex';
            
            // Trigger animation after a small delay to ensure display is applied
            setTimeout(() => {
                this.congratulationsPopup.classList.add('show');
            }, 50);
            
            // Auto-hide after 8 seconds if user doesn't close it
            setTimeout(() => {
                this.hidePopup();
            }, 60000);
        }
    }

    updatePopupMessage() {
        const exercise = this.exercises[this.currentExercise];
        const popupMessage = document.querySelector('.popup-message');
        const popupSubtitle = document.querySelector('.popup-subtitle');
        
        const messages = {
            'wim-hof': {
                message: `You've mastered ${exercise.rounds} rounds of the Wim Hof Method! Your breath control and mental focus are growing stronger with each practice.`,
                subtitle: 'You\'re building resilience and unlocking your inner power! 🔥'
            },
            'box': {
                message: `Excellent work completing ${exercise.rounds} rounds of Box Breathing! Your nervous system is now more balanced and your mind clearer.`,
                subtitle: 'You\'re mastering the art of calm and focused breathing! 🧘‍♀️'
            },
            'calm': {
                message: `Beautiful! You\'ve completed ${exercise.rounds} rounds of 4-7-8 breathing. Your body and mind are now in a state of deep relaxation.`,
                subtitle: 'You\'re nurturing your inner peace and well-being! 🌙'
            }
        };
        
        const currentMessage = messages[this.currentExercise];
        if (popupMessage && currentMessage) {
            popupMessage.textContent = currentMessage.message;
        }
        if (popupSubtitle && currentMessage) {
            popupSubtitle.textContent = currentMessage.subtitle;
        }
    }

    hidePopup() {
        console.log('Hiding congratulations popup');
        
        if (this.congratulationsPopup) {
            this.congratulationsPopup.classList.remove('show');
            
            // Hide after animation completes
            setTimeout(() => {
                this.congratulationsPopup.style.display = 'none';
            }, 600);
        }
    }

    // Debug functionality
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            // Show timer with animation
            this.showDebugTimer();
            this.debugToggle.classList.add('active');
            console.log('Debug mode enabled');
        } else {
            // Hide timer with animation
            this.hideDebugTimer();
            this.debugToggle.classList.remove('active');
            this.stopDebugTimer();
            console.log('Debug mode disabled');
        }
    }

    showDebugTimer() {
        // Remove hide class if present
        this.debugTimer.classList.remove('hide');
        
        // Force a reflow to ensure previous state is applied
        this.debugTimer.offsetHeight;
        
        // Trigger show animation
        this.debugTimer.classList.add('show');
    }

    hideDebugTimer() {
        // Remove show class and add hide class for animation
        this.debugTimer.classList.remove('show');
        this.debugTimer.classList.add('hide');
        
        // Clean up hide class after animation completes
        setTimeout(() => {
            this.debugTimer.classList.remove('hide');
        }, 600);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        if (this.soundEnabled) {
            this.ambientAudio.play().catch(e => {
                console.log('Could not play audio:', e);
                this.soundEnabled = false;
                this.updateSoundUI();
            });
            this.soundToggle.classList.add('active');
            console.log('Ambient sound enabled');
        } else {
            this.ambientAudio.pause();
            this.soundToggle.classList.remove('active');
            console.log('Ambient sound disabled');
        }
        
        this.updateSoundUI();
    }

    updateSoundUI() {
        if (this.soundEnabled) {
            this.soundOnIcon.style.display = 'flex';
            this.soundOffIcon.style.display = 'none';
        } else {
            this.soundOnIcon.style.display = 'none';
            this.soundOffIcon.style.display = 'flex';
        }
    }

    startDebugTimer(phase, duration) {
        this.stopDebugTimer();
        
        if (this.timerPhase) {
            this.timerPhase.textContent = phase.charAt(0).toUpperCase() + phase.slice(1);
        }
        if (this.totalTime) {
            this.totalTime.textContent = `${(duration / 1000).toFixed(1)}s`;
        }
        if (this.currentTime) {
            this.currentTime.textContent = '0.0s';
        }
        if (this.timerProgressBar) {
            this.timerProgressBar.style.width = '0%';
        }
        
        this.timerUpdateId = setInterval(() => {
            const elapsed = Date.now() - this.phaseStartTime;
            const progress = Math.min(elapsed / this.phaseDuration, 1);
            
            if (this.currentTime) {
                this.currentTime.textContent = `${(elapsed / 1000).toFixed(1)}s`;
            }
            if (this.timerProgressBar) {
                this.timerProgressBar.style.width = `${progress * 100}%`;
            }
            
            if (progress >= 1) {
                this.stopDebugTimer();
            }
        }, 100);
    }

    stopDebugTimer() {
        if (this.timerUpdateId) {
            clearInterval(this.timerUpdateId);
            this.timerUpdateId = null;
        }
    }

    resetDebugTimer() {
        this.stopDebugTimer();
        
        // Always reset the timer display elements to their initial state
        if (this.timerPhase) {
            this.timerPhase.textContent = 'Ready';
        }
        if (this.totalTime) {
            this.totalTime.textContent = '0.0s';
        }
        if (this.currentTime) {
            this.currentTime.textContent = '0.0s';
        }
        if (this.timerProgressBar) {
            this.timerProgressBar.style.width = '0%';
        }
        
        console.log('Debug timer reset to initial state');
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Breathing Exercise App');
    new BreathingExercise();
});

// Mouse interaction for background layers
document.addEventListener('mousemove', (e) => {
    const layers = document.querySelectorAll('.glass-layer');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    layers.forEach((layer, index) => {
        const speed = (index + 1) * 0.5;
        const x = (mouseX - 0.5) * speed * 20;
        const y = (mouseY - 0.5) * speed * 20;
        
        layer.style.transform = `translate(${x}px, ${y}px)`;
    });
});