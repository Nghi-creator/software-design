/**
 * Home Page Logic
 * Handles real-time countdowns and Swiper initializations
 */

const Home = {
    init() {
        this.initCountdowns();
        this.initSwipers();
    },

    /**
     * Real-time countdown timer for home page products
     */
    initCountdowns() {
        const updateHomeCountdowns = () => {
            const countdownElements = document.querySelectorAll('.home-countdown-timer');

            countdownElements.forEach(element => {
                const endDateStr = element.getAttribute('data-end-date');
                if (!endDateStr) return;

                const endDate = new Date(endDateStr);
                const now = new Date();
                const timeLeft = endDate - now;

                if (timeLeft <= 0) {
                    element.textContent = 'Ended';
                    element.classList.remove('text-danger');
                    element.classList.add('text-muted');
                    return;
                }

                // Calculate time units
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                // Format output
                let timeString = '';
                if (days > 0) {
                    timeString = `${days}d ${hours}h ${minutes}m`;
                } else if (hours > 0) {
                    timeString = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                } else if (minutes > 0) {
                    timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;
                } else {
                    timeString = `${seconds}s`;
                }

                element.textContent = timeString;

                // Change color based on urgency
                if (days === 0 && hours < 1) {
                    element.classList.add('text-danger', 'fw-bold');
                }
            });
        };

        // Update immediately and then every second
        updateHomeCountdowns();
        setInterval(updateHomeCountdowns, 1000);
    },

    /**
     * Initialize Swiper instances for billboard and product lists
     */
    initSwipers() {
        // Initialize main banner swiper
        new Swiper('.main-swiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: '.swiper-arrow-next',
                prevEl: '.swiper-arrow-prev',
            },
        });

        // Initialize all product swipers
        document.querySelectorAll('.product-swiper').forEach(function (swiperContainer) {
            new Swiper(swiperContainer, {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: false,
                pagination: {
                    el: swiperContainer.querySelector('.swiper-pagination'),
                    clickable: true,
                },
                breakpoints: {
                    576: { slidesPerView: 2, spaceBetween: 20 },
                    768: { slidesPerView: 3, spaceBetween: 20 },
                    992: { slidesPerView: 4, spaceBetween: 30 },
                    1200: { slidesPerView: 5, spaceBetween: 30 }
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Home.init();
});
