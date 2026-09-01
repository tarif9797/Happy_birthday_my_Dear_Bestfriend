document.addEventListener('DOMContentLoaded', function() {

    // --- Auto Fullscreen Mode (auto-tap after 3 sec) ---
    (function() {
        let isFullscreen = false;
        let userTapped = false;
        const overlay = document.getElementById('fs-overlay');

        function tryFullscreen() {
            try {
                const el = document.documentElement;
                const r = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
                if (r) {
                    r.call(el).then(() => {
                        isFullscreen = true;
                        if (overlay) overlay.style.display = 'none';
                    }).catch(() => {});
                }
            } catch(e) {}
        }

        function onFullscreenChange() {
            isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
            if (!isFullscreen && userTapped) {
                setTimeout(tryFullscreen, 200);
            }
        }

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('mozfullscreenchange', onFullscreenChange);

        // Global function for overlay click — starts music + fullscreen
        window.enterFullscreen = function() {
            userTapped = true;
            tryFullscreen();
            // Start background music on this user gesture
            var bgm = document.getElementById('bg-music');
            if (bgm && bgm.paused) {
                bgm.play().then(function() {
                    bgm.volume = 0.35;
                    bgm.loop = true;
                }).catch(function() {});
            }
        };

        // Auto re-enter on any interaction after first tap
        ['click', 'touchstart', 'touchend', 'scroll', 'wheel', 'keydown', 'mousedown', 'pointerdown'].forEach(evt => {
            window.addEventListener(evt, function() {
                if (userTapped && !isFullscreen) {
                    tryFullscreen();
                }
            }, { passive: true });
        });
    })();

    // --- Birthday Countdown (Auto-detect current time) ---
    const countdownElement = document.getElementById('countdown');
    
    function getNextBirthday() {
        const now = new Date();
        const currentYear = now.getFullYear();
        // Next birthday: September 1 of current year or next year
        let birthday = new Date(currentYear, 8, 1); // September = 8 (0-indexed)
        
        // If birthday has passed this year, use next year
        if (now > birthday) {
            birthday = new Date(currentYear + 1, 8, 1);
        }
        return birthday;
    }

    // Exact birth moment: September 1, 2008 00:00:00
    const birthMoment = new Date(2008, 8, 1, 0, 0, 0);

    function updateCountdown() {
        const now = new Date();

        // Calculate years, months, days
        let years = now.getFullYear() - 2008;
        let months = now.getMonth() - 8; // Sep=8 (0-indexed)
        let days = now.getDate() - 1;

        if (days < 0) {
            months--;
            const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            days += prevMonthDays;
        }

        if (months < 0) {
            years--;
            months += 12;
            days = now.getDate();
        }

        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Birthday message if today is Sept 1
        const isBirthday = (now.getDate() === 1 && now.getMonth() === 8);
        const birthdayMsg = isBirthday
            ? `🎂 আজকে হাসির জন্মদিন! 🎉💛<br>শুভ জন্মদিন, Petni! 👻<br><br>`
            : '';

        countdownElement.innerHTML =
            `${birthdayMsg}` +
            `<span class="text-2xl md:text-3xl font-bold text-honey">${years} years : ${months} months : ${days} days</span><br>` +
            `<span class="text-lg font-semibold text-honey">${hours} hours : ${minutes} min : ${seconds} sec</span><br>` +
            `<span class="text-sm opacity-80 mt-2 block">💛</span>`;
    }

    // Update every 1 second for live running age
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // --- Initialize AOS (Animate on Scroll) ---
    AOS.init({
        duration: 800,
        once: true,
    });

    // --- Initialize LightGallery ---
    lightGallery(document.getElementById('lightgallery'), {
        speed: 500,
        download: false
    });

    // --- Hall of Fame Scroller ---
    const scroller = document.getElementById('hall-of-fame-scroller');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    if (scroller && scrollLeftBtn && scrollRightBtn) {
        const card = scroller.querySelector('.snap-center');
        const cardWidth = card.offsetWidth + parseInt(getComputedStyle(card.parentElement).gap);

        scrollRightBtn.addEventListener('click', () => {
            scroller.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });
        scrollLeftBtn.addEventListener('click', () => {
            scroller.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });
    }

    // --- Video Uploader ---
    const videoUploadInput = document.getElementById('video-upload');
    const videoPlayer = document.getElementById('video-player');
    const videoUploadLabel = document.getElementById('video-upload-label');

    if(videoUploadInput && videoPlayer && videoUploadLabel) {
        videoUploadLabel.addEventListener('click', () => {
            videoUploadInput.click();
        });

        videoUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const videoURL = URL.createObjectURL(file);
                videoPlayer.src = videoURL;
                videoPlayer.classList.remove('hidden');
                videoUploadLabel.classList.add('hidden');
                videoPlayer.play();
            }
        });
    }


    // --- Memory Timeline Scroll Reveal ---
    const memoryItems = document.querySelectorAll('.memory-item');
    if (memoryItems.length > 0) {
        const revealMemory = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        };
        const memoryObserver = new IntersectionObserver(revealMemory, {
            threshold: 0.15,
            rootMargin: '0px 0px -30px 0px'
        });
        memoryItems.forEach(item => memoryObserver.observe(item));
    }

    // --- Ultra-Smooth Continuous Auto-Scroll ---
    (function() {
        const SCROLL_SPEED = 40; // pixels per second
        const RESUME_DELAY = 5000; // 5 seconds
        let isPaused = false;
        let isScrolling = false;
        let resumeTimer = null;
        let scrollAccum = 0; // accumulate fractional pixels
        let lastTime = null;
        let rafId = null;

        function atBottom() {
            return (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 5);
        }

        function tick(timestamp) {
            if (isPaused) {
                isScrolling = false;
                lastTime = null;
                scrollAccum = 0;
                return;
            }
            if (atBottom()) {
                isScrolling = false;
                lastTime = null;
                scrollAccum = 0;
                return;
            }
            if (lastTime === null) lastTime = timestamp;

            // Use fixed 16ms step for consistent smoothness (60fps)
            const FIXED_DT = 16.67; // ms per frame
            const dt = FIXED_DT / 1000; // convert to seconds
            lastTime = timestamp;

            // Accumulate fractional pixels
            scrollAccum += SCROLL_SPEED * dt;

            // Only scroll when we have at least 1 pixel
            if (scrollAccum >= 1) {
                const pixels = Math.floor(scrollAccum);
                scrollAccum -= pixels;
                window.scrollBy({ top: pixels, left: 0, behavior: 'auto' });
            }

            rafId = requestAnimationFrame(tick);
        }

        function start() {
            if (isScrolling || isPaused) return;
            isScrolling = true;
            lastTime = null;
            scrollAccum = 0;
            rafId = requestAnimationFrame(tick);
        }

        function pause() {
            isPaused = true;
            isScrolling = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            if (resumeTimer) clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                isPaused = false;
                isScrolling = false;
                start();
            }, RESUME_DELAY);
        }

        // Pause on any user interaction
        ['touchstart', 'touchmove'].forEach(e => window.addEventListener(e, pause, { passive: true }));
        ['wheel', 'mousedown', 'keydown'].forEach(e => window.addEventListener(e, pause, { passive: true }));

        // Start smoothly after 1 second delay
        setTimeout(start, 1000);
    })();

    // --- Background Music (single implementation, fully invisible) ---
    (function() {
        // Create one invisible audio element
        var audio = document.createElement('audio');
        audio.id = 'bg-music';
        audio.loop = true;
        audio.preload = 'auto';
        audio.src = 'img/sound.mp3';
        audio.controls = false;
        audio.setAttribute('playsinline', '');
        audio.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:0;height:0;opacity:0;visibility:hidden;pointer-events:none;z-index:-99999;';
        audio.tabIndex = -1;
        audio.setAttribute('aria-hidden', 'true');
        document.body.appendChild(audio);

        // Single flag: only one call path starts the music
        var musicStarted = false;

        function startMusic() {
            if (musicStarted) return;
            audio.volume = 0.35;
            audio.play().then(function() {
                musicStarted = true;
            }).catch(function() {
                // Autoplay blocked — will start when user taps overlay
            });
        }

        // Try autoplay on page load (works in Chrome, may fail in IMO WebView)
        startMusic();
    })();

    // --- Rose Petals + Flower Emojis Animation ---
    const canvas = document.getElementById('sakura-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let petals = [];
        let flowers = [];
        const numPetals = 30;
        const numFlowers = 15;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Rose petal colors - natural pink shades
        const petalColors = [
            '#FFB6C1', // Light pink
            '#FF69B4', // Hot pink
            '#FFC0CB', // Pink
            '#FFB7C5', // Cherry blossom pink
            '#DB7093', // Pale violet red
            '#E75480', // Dark pink
            '#FF85A2', // Salmon pink
        ];

        // Flower emojis to mix with petals
        const flowerEmojis = ['🌼', '🌸', '🌺'];

        // --- Rose Petal Class ---
        function Petal() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height;
            this.size = 8 + Math.random() * 12;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.05;
            this.opacity = 0.6 + Math.random() * 0.4;
            this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
            this.xSpeed = 0.3 + Math.random() * 0.7;
            this.ySpeed = 0.8 + Math.random() * 1.2;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = 0.02 + Math.random() * 0.03;
        }

        Petal.prototype.draw = function() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;

            // Draw realistic rose petal shape
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.3);
            ctx.bezierCurveTo(-this.size * 0.8, -this.size * 0.2, -this.size, this.size * 0.3, -this.size * 0.4, this.size * 0.8);
            ctx.bezierCurveTo(-this.size * 0.2, this.size, this.size * 0.2, this.size, this.size * 0.4, this.size * 0.8);
            ctx.bezierCurveTo(this.size, this.size * 0.3, this.size * 0.8, -this.size * 0.2, 0, -this.size * 0.3);
            ctx.closePath();

            // Gradient for realistic look
            const gradient = ctx.createRadialGradient(-this.size * 0.2, this.size * 0.2, 0, 0, 0, this.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.7, this.color);
            gradient.addColorStop(1, 'rgba(255, 182, 193, 0.3)');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Petal vein
            ctx.strokeStyle = 'rgba(255, 105, 180, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.2);
            ctx.lineTo(0, this.size * 0.6);
            ctx.stroke();

            ctx.restore();
        }

        Petal.prototype.update = function() {
            this.wobble += this.wobbleSpeed;
            this.x += this.xSpeed + Math.sin(this.wobble) * 0.5;
            this.y += this.ySpeed;
            this.rotation += this.rotationSpeed;

            if (this.y > canvas.height + this.size || this.x > canvas.width + this.size) {
                this.x = Math.random() * canvas.width;
                this.y = -this.size * 2;
                this.rotation = Math.random() * Math.PI * 2;
                this.opacity = 0.6 + Math.random() * 0.4;
                this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
            }
            this.draw();
        }

        // --- Flower Emoji Class ---
        function Flower() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height;
            this.emoji = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
            this.size = 16 + Math.random() * 14;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.04;
            this.opacity = 0.7 + Math.random() * 0.3;
            this.xSpeed = 0.2 + Math.random() * 0.5;
            this.ySpeed = 0.6 + Math.random() * 0.8;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = 0.015 + Math.random() * 0.025;
        }

        Flower.prototype.draw = function() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.font = this.size + 'px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            ctx.restore();
        }

        Flower.prototype.update = function() {
            this.wobble += this.wobbleSpeed;
            this.x += this.xSpeed + Math.sin(this.wobble) * 0.4;
            this.y += this.ySpeed;
            this.rotation += this.rotationSpeed;

            if (this.y > canvas.height + this.size || this.x > canvas.width + this.size) {
                this.x = Math.random() * canvas.width;
                this.y = -this.size * 2;
                this.rotation = Math.random() * Math.PI * 2;
                this.opacity = 0.7 + Math.random() * 0.3;
                this.emoji = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
            }
            this.draw();
        }

        function createPetals() {
            petals = [];
            for (let i = 0; i < numPetals; i++) {
                const petal = new Petal();
                petal.y = Math.random() * canvas.height;
                petals.push(petal);
            }
        }

        function createFlowers() {
            flowers = [];
            for (let i = 0; i < numFlowers; i++) {
                const flower = new Flower();
                flower.y = Math.random() * canvas.height;
                flowers.push(flower);
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            petals.forEach(petal => petal.update());
            flowers.forEach(flower => flower.update());
            requestAnimationFrame(animate);
        }

        createPetals();
        createFlowers();
        animate();
    }

    // --- Interactive Question Popup System ---
    (function() {
        const overlay = document.getElementById('question-popup-overlay');
        const card = document.getElementById('question-popup-card');
        const questionEl = document.getElementById('popup-question');
        const buttonsEl = document.getElementById('popup-buttons');
        const responseEl = document.getElementById('popup-response');
        const emojiEl = document.getElementById('popup-emoji-top');

        if (!overlay || !questionEl || !buttonsEl) return;

        // Popup data
        const popups = [
            {
                id: 1,
                emoji: '💬',
                question: 'শুন হাসি, একটা কথা বল তো…\nতুই কি মনে করতে পারিস, আমাদের friendship শুরুটা এতটা গভীর হয়ে যাবে? 🥹',
                buttons: [
                    { text: 'হ্যাঁ 💛', type: 'primary', response: 'আমিও তাই ভাবতাম না! 💛友谊 এতটা গভীর হবে ভাবাও ছিল না। 🥹' },
                    { text: 'না 😂', type: 'secondary', response: 'হা হা! কিন্তু হয়ে গেছে! এবার আর পালানো যায় না! 😂💛' }
                ]
            },
            {
                id: 2,
                emoji: '👻',
                question: 'শুন পেত্নী 👻\nআমাদের মধ্যে বেশি রাগ করে কে?',
                buttons: [
                    { text: 'তুই 😑', type: 'same', response: 'জানি! উত্তরটা দুটোতেই একই। 😂' },
                    { text: 'তুই-ই 😑', type: 'same', response: 'জানি! উত্তরটা দুটোতেই একই। 😂' }
                ]
            },
            {
                id: 3,
                emoji: '🥹',
                question: 'একটা serious প্রশ্ন… 🥹\nতুই কি জানিস, তোর সাথে এই বন্ধুত্বটা আমার কাছে সত্যিই অনেক special?',
                buttons: [
                    { text: 'জানি 💛', type: 'primary', response: '💛 তাহলে ভালো! কারণ তুই জানিস—আর আমিও জানি। 🥹' },
                    { text: 'এখন জানলাম 🥹', type: 'secondary', response: 'এখন জানলেই হলো! বাকিটা ধীরে ধীরে বুঝতে পারবি। 💛🥹' }
                ]
            },
            {
                id: 4,
                emoji: '🫂',
                question: 'শেষে যাওয়ার আগে একটা উত্তর দে…\nএতগুলো বছর পরেও কি আমাকে তোর Best Friend হিসেবে রাখবি? 🫂',
                buttons: [
                    { text: 'হ্যাঁ 💛', type: 'primary', response: '💙 এই একটা কথাই যথেষ্ট। 🫂💛' },
                    { text: 'অবশ্যই 💛', type: 'primary', response: '💙 এই একটা কথাই যথেষ্ট। 🫂💛' }
                ]
            }
        ];

        let currentSequence = 0; // 0 = popup 1, 1 = popup 2, etc.
        let isPopupOpen = false;
        let shownPopups = new Set();

        function showPopup(index) {
            if (index >= popups.length || isPopupOpen || shownPopups.has(index)) return;

            const popup = popups[index];
            isPopupOpen = true;

            // Pause auto-scroll
            const autoScrollPauseEvent = new CustomEvent('popup-pause');
            window.dispatchEvent(autoScrollPauseEvent);

            // Set content
            emojiEl.textContent = popup.emoji;
            questionEl.textContent = popup.question;
            buttonsEl.innerHTML = '';
            responseEl.classList.add('hidden');
            responseEl.textContent = '';

            // Create buttons
            popup.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = 'popup-btn popup-btn-' + btn.type;
                button.textContent = btn.text;
                button.addEventListener('click', function() {
                    // Show response
                    responseEl.textContent = btn.response;
                    responseEl.classList.remove('hidden');

                    // Hide buttons
                    buttonsEl.style.opacity = '0';
                    buttonsEl.style.pointerEvents = 'none';

                    // Close after delay
                    setTimeout(function() {
                        closePopup(index);
                    }, 1800);
                });
                buttonsEl.appendChild(button);
            });

            // Show overlay
            overlay.classList.remove('hidden', 'hiding');
            overlay.classList.add('visible');

            shownPopups.add(index);
        }

        function closePopup(index) {
            overlay.classList.add('hiding');

            setTimeout(function() {
                overlay.classList.remove('visible', 'hiding');
                overlay.classList.add('hidden');
                isPopupOpen = false;
                buttonsEl.style.opacity = '1';
                buttonsEl.style.pointerEvents = 'auto';

                // Resume auto-scroll after a short delay
                setTimeout(function() {
                    window.dispatchEvent(new CustomEvent('popup-resume'));
                }, 500);
            }, 350);
        }

        // IntersectionObserver for trigger elements
        const triggers = document.querySelectorAll('[data-question-popup]');
        const triggerObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const id = parseInt(entry.target.getAttribute('data-question-popup'));
                    const popupIndex = id - 1;

                    // Only show if it's the next in sequence or earlier (in case user scrolled past)
                    if (popupIndex >= currentSequence && popupIndex < popups.length) {
                        setTimeout(function() {
                            showPopup(popupIndex);
                            currentSequence = popupIndex + 1;
                        }, 400);
                    }
                    triggerObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        });

        triggers.forEach(function(trigger) {
            triggerObserver.observe(trigger);
        });

        // Listen for popup-pause and popup-resume to integrate with auto-scroll
        window.addEventListener('popup-pause', function() {
            // Dispatch a custom scroll pause event that the auto-scroll system listens to
            window.dispatchEvent(new Event('pause-autoscroll'));
        });

        window.addEventListener('popup-resume', function() {
            window.dispatchEvent(new Event('resume-autoscroll'));
        });
    })();

    // --- Listen for popup pause/resume events (auto-scroll integration) ---
    (function() {
        window.addEventListener('pause-autoscroll', function() {
            // Pause auto-scroll by dispatching touchstart
            window.dispatchEvent(new Event('touchstart'));
        });
        window.addEventListener('resume-autoscroll', function() {
            // Resume auto-scroll — auto-scroll resumes via its own timer
        });
    })();
});
