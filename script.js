document.addEventListener('DOMContentLoaded', function() {

    // --- Auto Fullscreen Mode ---
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
                // Re-enter fullscreen on next interaction
                setTimeout(tryFullscreen, 200);
            }
        }

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('mozfullscreenchange', onFullscreenChange);

        // Global function for overlay click
        window.enterFullscreen = function() {
            userTapped = true;
            tryFullscreen();
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

        // If it's birthday today!
        if (now.getDate() === 1 && now.getMonth() === 8) {
            countdownElement.innerHTML = `🎂 আজকে হাসির জন্মদিন! 🎉💛<br>শুভ জন্মদিন, Petni! 👻`;
            return;
        }

        // Calculate total difference in milliseconds
        let diff = now - birthMoment;
        if (diff < 0) diff = 0;

        // Calculate years
        let years = now.getFullYear() - 2008;
        let months = now.getMonth() - 8;
        let days = now.getDate() - 1;
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();

        if (seconds < 0) { minutes--; seconds += 60; }
        if (minutes < 0) { hours--; minutes += 60; }
        if (hours < 0) { days--; hours += 24; }
        if (days < 0) {
            months--;
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        countdownElement.innerHTML = 
            `🎂 Happy Birthday<br>` +
            `<span class="text-2xl md:text-3xl font-bold text-honey">${years} বছর ${months} মাস ${days} দিন</span><br>` +
            `<span class="text-lg font-semibold text-honey">${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড</span><br>` +
            `<span class="text-sm opacity-80 mt-2 block"> 💛</span>`;
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

    // --- Ultra-Smooth Continuous Auto-Scroll (pixel-by-pixel) ---
    (function() {
        const SCROLL_SPEED = 40; // pixels per second — adjust this single variable
        const RESUME_DELAY = 5000; // 5 seconds after user stops interacting
        let isScrolling = false;
        let isPaused = false;
        let resumeTimer = null;
        let lastTimestamp = null;
        let rafId = null;

        function canScroll() {
            return (window.innerHeight + window.scrollY) < (document.body.scrollHeight - 2);
        }

        function smoothScrollStep(timestamp) {
            if (!isScrolling) return;
            if (isPaused) {
                lastTimestamp = null;
                rafId = null;
                return;
            }
            if (!canScroll()) {
                isScrolling = false;
                rafId = null;
                return;
            }
            if (lastTimestamp === null) {
                lastTimestamp = timestamp;
            }
            const delta = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;
            const pixelsToScroll = SCROLL_SPEED * delta;
            window.scrollBy(0, pixelsToScroll);
            rafId = requestAnimationFrame(smoothScrollStep);
        }

        function startAutoScroll() {
            if (isScrolling || isPaused) return;
            isScrolling = true;
            lastTimestamp = null;
            rafId = requestAnimationFrame(smoothScrollStep);
        }

        function pauseAutoScroll() {
            isPaused = true;
            isScrolling = false; // Stop current RAF loop
            if (resumeTimer) clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                isPaused = false;
                isScrolling = false;
                startAutoScroll();
            }, RESUME_DELAY);
        }

        // Detect user interaction: touch, wheel, mouse, keyboard
        let userInteracting = false;
        let userTimer = null;
        function onUserAction() {
            userInteracting = true;
            clearTimeout(userTimer);
            userTimer = setTimeout(() => { userInteracting = false; }, 300);
        }
        ['touchstart', 'touchmove'].forEach(evt => {
            window.addEventListener(evt, () => { onUserAction(); pauseAutoScroll(); }, { passive: true });
        });
        ['wheel', 'mousedown', 'keydown'].forEach(evt => {
            window.addEventListener(evt, () => { pauseAutoScroll(); }, { passive: true });
        });

        // Start on page load
        startAutoScroll();
    })();

    // --- Background Music Always On ---
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.volume = 0.5;
        let musicPlaying = false;

        function tryPlayMusic() {
            if (!musicPlaying) {
                bgMusic.play().then(() => {
                    musicPlaying = true;
                }).catch(() => {});
            }
        }

        // Try playing immediately
        tryPlayMusic();

        // Also try on every user interaction until it plays
        ['click', 'touchstart', 'touchend', 'scroll', 'mousemove', 'keydown', 'mousedown'].forEach(evt => {
            document.addEventListener(evt, tryPlayMusic, { passive: true });
        });
    }

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
});
