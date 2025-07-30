// Animator Class - Handles all animations using Motion.js
class Animator {
    constructor() {
        this.animations = new Map();
        this.motion = window.Motion || {};
    }
    
    // Intro animations
    animateIntro() {
        const timeline = this.motion.timeline([
            [".logo-container", { scale: [0.8, 1], opacity: [0, 1] }, { duration: 0.6 }],
            [".intro-title", { y: [20, 0], opacity: [0, 1] }, { duration: 0.6, at: 0.3 }],
            [".intro-loader", { opacity: [0, 1] }, { duration: 0.4, at: 0.6 }],
            [".loader-bar", { width: ["0%", "100%"] }, { duration: 2, at: 0.8 }]
        ]);
        
        return timeline;
    }
    
    // Page transition animations
    animatePageTransition(element, direction = 'forward') {
        if (direction === 'forward') {
            return this.motion.animate(element, {
                x: [0, "100%"],
                scale: [1, 0.95],
                opacity: [1, 0]
            }, {
                duration: 0.8,
                easing: "ease-in-out"
            });
        } else {
            return this.motion.animate(element, {
                x: ["-100%", 0],
                scale: [0.95, 1],
                opacity: [0, 1]
            }, {
                duration: 0.8,
                easing: "ease-in-out"
            });
        }
    }
    
    // Text generation animation (typewriter effect)
    typewriterEffect(element, text, speed = 50) {
        return new Promise(resolve => {
            element.textContent = '';
            element.style.opacity = '1';
            
            let i = 0;
            const type = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };
            
            type();
        });
    }
    
    // Content fade animation
    fadeContent(element, fadeOut = true) {
        return this.motion.animate(element, {
            opacity: fadeOut ? [1, 0.3] : [0.3, 1]
        }, {
            duration: 0.3,
            easing: "ease-out"
        });
    }
    
    // Image blur animation
    animateImageGeneration(element) {
        element.classList.add('ai-generating');
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.remove('ai-generating');
                element.classList.add('ai-generated');
                resolve();
            }, 2000);
        });
    }
    
    // Progress bar animation
    animateProgress(element, fromValue, toValue) {
        return this.motion.animate(element, {
            width: [`${fromValue}%`, `${toValue}%`]
        }, {
            duration: 0.5,
            easing: "ease-out"
        });
    }
    
    // Menu item completion animation
    animateMenuCompletion(element) {
        return this.motion.animate(element, {
            scale: [0, 1.2, 1],
            rotate: [0, 360]
        }, {
            duration: 0.6,
            easing: "ease-out"
        });
    }
    
    // Ripple effect for clicks
    createRipple(event, container) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = container.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        container.appendChild(ripple);
        
        this.motion.animate(ripple, {
            scale: [0, 2],
            opacity: [0.3, 0]
        }, {
            duration: 0.6,
            easing: "ease-out"
        }).finished.then(() => {
            ripple.remove();
        });
    }
    
    // Pulse effect for active items
    addPulseEffect(element) {
        const pulseElement = document.createElement('div');
        pulseElement.className = 'pulse';
        element.appendChild(pulseElement);
        
        return this.motion.animate(pulseElement, {
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3]
        }, {
            duration: 2,
            repeat: Infinity,
            easing: "ease-in-out"
        });
    }
    
    // Confetti animation
    createConfetti(count = 50) {
        const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899'];
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = confetti.style.height = (Math.random() * 10 + 5) + 'px';
                
                container.appendChild(confetti);
                
                this.motion.animate(confetti, {
                    y: [0, window.innerHeight + 100],
                    x: [(Math.random() - 0.5) * 200],
                    rotate: [0, Math.random() * 720 - 360],
                    scale: [1, Math.random() * 0.5 + 0.5]
                }, {
                    duration: Math.random() * 2 + 2,
                    easing: "ease-out"
                }).finished.then(() => {
                    confetti.remove();
                });
            }, i * 30);
        }
        
        // Remove container after all confetti falls
        setTimeout(() => {
            container.remove();
        }, 5000);
    }
    
    // Success checkmark animation
    animateSuccessCheckmark(svgElement) {
        const circle = svgElement.querySelector('.success-checkmark-circle');
        const check = svgElement.querySelector('.success-checkmark-check');
        
        const timeline = this.motion.timeline([
            [circle, { strokeDashoffset: [166, 0] }, { duration: 0.6, easing: "ease-out" }],
            [check, { strokeDashoffset: [48, 0] }, { duration: 0.3, easing: "ease-out", at: 0.8 }],
            [svgElement, { scale: [0.8, 1.1, 1] }, { duration: 0.4, at: 1 }]
        ]);
        
        return timeline;
    }
    
    // Loading spinner
    createLoadingSpinner(container) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        container.appendChild(spinner);
        
        const animation = this.motion.animate(spinner, {
            rotate: [0, 360]
        }, {
            duration: 0.8,
            repeat: Infinity,
            easing: "linear"
        });
        
        return {
            spinner,
            animation,
            remove: () => {
                animation.cancel();
                spinner.remove();
            }
        };
    }
    
    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
        
        return this.motion.animate(document.documentElement, {
            scrollTop: [window.pageYOffset, targetPosition]
        }, {
            duration: 0.6,
            easing: "ease-in-out"
        });
    }
    
    // Shake animation for errors
    shakeElement(element) {
        return this.motion.animate(element, {
            x: [0, -10, 10, -10, 10, 0]
        }, {
            duration: 0.5,
            easing: "ease-out"
        });
    }
    
    // Glow effect
    addGlowEffect(element) {
        return this.motion.animate(element, {
            boxShadow: [
                "0 0 0 rgba(99, 102, 241, 0)",
                "0 0 20px rgba(99, 102, 241, 0.6)",
                "0 0 0 rgba(99, 102, 241, 0)"
            ]
        }, {
            duration: 1.5,
            repeat: Infinity,
            easing: "ease-in-out"
        });
    }
    
    // Stop specific animation
    stopAnimation(animationId) {
        const animation = this.animations.get(animationId);
        if (animation) {
            animation.cancel();
            this.animations.delete(animationId);
        }
    }
    
    // Stop all animations
    stopAllAnimations() {
        this.animations.forEach(animation => animation.cancel());
        this.animations.clear();
    }
}