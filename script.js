import { submitContactForm, validateContactSubmission } from './src/services/contactService.js';

document.addEventListener('DOMContentLoaded', () => {

    const priceSlider = document.getElementById('priceSlider');
    const priceDisplay = document.getElementById('priceDisplay');
    const priceDisplayWrapper = document.getElementById('priceDisplayWrapper');
    const priceUnitSuffix = document.getElementById('priceUnitSuffix');
    const filterLocation = document.getElementById('filterLocation');
    const filterPropertyType = document.getElementById('filterPropertyType');

    const openModalBtn = document.getElementById('openModalBtn');
    const navCtaBtn = document.getElementById('navCtaBtn');
    const mobileCtaBtn = document.getElementById('mobileCtaBtn');

    const modal = document.getElementById('personalizedModal');
    const modalCard = document.getElementById('modalCard');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const modalFormState = document.getElementById('modalFormState');
    const modalSuccessState = document.getElementById('modalSuccessState');
    const leadCaptureForm = document.getElementById('leadCaptureForm');
    const successDoneBtn = document.getElementById('successDoneBtn');

    const badgeModalLoc = document.getElementById('badgeModalLoc');
    const badgeModalType = document.getElementById('badgeModalType');
    const badgeModalPrice = document.getElementById('badgeModalPrice');

    const stepCards = document.querySelectorAll('.step-card');

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
    const mainHeader = document.getElementById('mainHeader');

    const THUMB_WIDTH = 22;

    function formatPrice(val) {
        val = parseInt(val, 10);
        if (isNaN(val)) val = 180;
        if (val < 100) {
            return `₹${val} Lakhs`;
        } else {
            let cr = (val / 100).toFixed(1);
            if (cr.endsWith('.0')) {
                cr = cr.slice(0, -2);
            }
            return val >= 500 ? `₹${cr}+ Cr` : `₹${cr} Cr`;
        }
    }

    // Mapping for hero price range: 0% = 80 Lakhs, 50% = 2.5 Cr (250 Lakhs), 100% = 5 Cr+ (500 Lakhs)
    function getHeroPricePercentage(val) {
        val = parseFloat(val) || 180;
        if (val <= 80) return 0;
        if (val >= 500) return 100;
        if (val <= 250) {
            return ((val - 80) / (250 - 80)) * 50;
        } else {
            return 50 + ((val - 250) / (500 - 250)) * 50;
        }
    }

    function getHeroPriceFromPercentage(pct) {
        pct = Math.min(100, Math.max(0, pct));
        if (pct <= 0) return 80;
        if (pct >= 100) return 500;
        let val;
        if (pct <= 50) {
            val = 80 + (pct / 50) * (250 - 80);
        } else {
            val = 250 + ((pct - 50) / 50) * (500 - 250);
        }
        return Math.round(val / 10) * 10;
    }

    function parseHeroPriceInput(str) {
        if (!str) return null;
        let s = String(str).trim().toLowerCase().replace(/₹/g, '').replace(/\+/g, '').replace(/,/g, '').trim();
        const crExplicit = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore)?/);
        const lMatch = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:l|lac|lakh|lakhs)/);

        if (lMatch) {
            return Math.round(parseFloat(lMatch[1]));
        }
        const num = parseFloat(s);
        if (isNaN(num)) return null;
        if (num <= 10) {
            // Values <= 10 are entered as Crores (e.g. 0.8, 1.8, 2.5, 5)
            return Math.round(num * 100);
        } else if (num >= 80 && num <= 500) {
            // Values between 80 and 500 entered as Lakhs
            return Math.round(num);
        } else if (num > 500 && num <= 50000000) {
            // Rupee amounts
            return Math.round(num / 100000);
        }
        return Math.round(num * 100);
    }

    function updateHeroPriceDisplay(val) {
        val = parseInt(val, 10);
        if (isNaN(val)) val = 180;
        const crVal = val / 100;
        let crStr = Number.isInteger(crVal) ? crVal.toString() : parseFloat(crVal.toFixed(2)).toString();
        if (priceDisplay) {
            priceDisplay.value = crStr;
        }
        if (priceUnitSuffix) {
            priceUnitSuffix.textContent = val >= 500 ? 'Cr+' : 'Cr';
        }
    }

    function setHeroPriceDisplay(val) {
        if (typeof val === 'number') {
            updateHeroPriceDisplay(val);
        } else if (typeof val === 'string') {
            const parsed = parseHeroPriceInput(val);
            if (parsed !== null) {
                updateHeroPriceDisplay(parsed);
            } else if (priceDisplay) {
                priceDisplay.value = val;
            }
        }
    }

    function positionHeroPriceTicks() {
        const container = document.getElementById('heroPriceTicks');
        if (!container) return;

        const ticks = container.querySelectorAll('.hero-price-tick');
        ticks.forEach(tick => {
            const val = parseFloat(tick.dataset.val);
            if (isNaN(val)) return;

            const pct = getHeroPricePercentage(val);

            if (pct <= 0) {
                tick.style.left = '0%';
                tick.style.right = 'auto';
                tick.style.transform = 'none';
            } else if (pct >= 100) {
                tick.style.left = 'auto';
                tick.style.right = '0%';
                tick.style.transform = 'none';
            } else {
                tick.style.left = `calc(${pct}% + ${(0.5 - pct / 100) * THUMB_WIDTH}px)`;
                tick.style.right = 'auto';
                tick.style.transform = 'translateX(-50%)';
            }
        });
    }

    function updatePriceSliderFill() {
        if (!priceSlider) return;
        const pct = Math.min(100, Math.max(0, parseFloat(priceSlider.value) || 0));

        const isLight = document.documentElement.classList.contains('light-mode');
        const activeColor = isLight ? '#b89345' : '#ddc28d';
        const trackColor = isLight ? '#E5E1D9' : 'rgba(255, 255, 255, 0.12)';

        priceSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`;
    }

    let currentHeroPriceVal = 180;

    if (priceSlider && priceDisplay) {
        // Slider drag
        priceSlider.addEventListener('input', (e) => {
            const pct = parseFloat(e.target.value) || 0;
            const val = getHeroPriceFromPercentage(pct);
            currentHeroPriceVal = val;
            updateHeroPriceDisplay(val);
            updatePriceSliderFill();
        });

        // Type box input
        priceDisplay.addEventListener('input', () => {
            let clean = priceDisplay.value.replace(/[^0-9.]/g, '');
            const parts = clean.split('.');
            if (parts.length > 2) {
                clean = parts[0] + '.' + parts.slice(1).join('');
            }
            if (clean !== priceDisplay.value) {
                priceDisplay.value = clean;
            }

            if (clean.endsWith('.')) return;

            const parsed = parseHeroPriceInput(clean);
            if (parsed !== null && parsed >= 80 && parsed <= 500) {
                currentHeroPriceVal = parsed;
                const pct = getHeroPricePercentage(parsed);
                priceSlider.value = pct;
                updatePriceSliderFill();
                if (priceUnitSuffix) {
                    priceUnitSuffix.textContent = parsed >= 500 ? 'Cr+' : 'Cr';
                }
            }
        });

        priceDisplay.addEventListener('blur', () => {
            let clean = priceDisplay.value.replace(/[^0-9.]/g, '');
            let parsed = parseHeroPriceInput(clean);
            if (parsed === null || isNaN(parsed)) {
                parsed = currentHeroPriceVal || 180;
            }
            const clamped = Math.max(80, Math.min(500, parsed));
            currentHeroPriceVal = clamped;
            const pct = getHeroPricePercentage(clamped);
            priceSlider.value = pct;
            updateHeroPriceDisplay(clamped);
            updatePriceSliderFill();
        });

        priceDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                priceDisplay.blur();
            }
        });

        if (priceDisplayWrapper) {
            priceDisplayWrapper.addEventListener('click', (e) => {
                if (e.target !== priceDisplay) {
                    priceDisplay.focus();
                    priceDisplay.select();
                }
            });
        }

        // Click tick to jump to value
        const heroPriceTicks = document.querySelectorAll('.hero-price-tick');
        heroPriceTicks.forEach(tick => {
            tick.addEventListener('click', () => {
                const val = parseFloat(tick.dataset.val);
                if (!isNaN(val)) {
                    currentHeroPriceVal = val;
                    const pct = getHeroPricePercentage(val);
                    priceSlider.value = pct;
                    updateHeroPriceDisplay(val);
                    updatePriceSliderFill();
                }
            });
        });

        // Initial setup
        const initialPct = getHeroPricePercentage(180);
        priceSlider.value = initialPct;
        updateHeroPriceDisplay(180);
        positionHeroPriceTicks();
        updatePriceSliderFill();
        window.addEventListener('resize', positionHeroPriceTicks);
        document.addEventListener('tp-theme-changed', updatePriceSliderFill);
    }

    function openSearchModal() {
        const locVal = filterLocation.value.trim() || "Any Prime Location";
        const typeVal = filterPropertyType.options[filterPropertyType.selectedIndex].text;
        const priceVal = formatPrice(currentHeroPriceVal);

        badgeModalLoc.textContent = locVal;
        badgeModalType.textContent = typeVal;
        badgeModalPrice.textContent = priceVal;

        modalFormState.classList.remove('hidden');
        modalSuccessState.classList.add('hidden');

        const feedbackEl = document.getElementById('formFeedbackMessage');
        if (feedbackEl) {
            feedbackEl.className = 'hidden text-xs py-2.5 px-3.5 rounded-xl border text-center transition-all';
            feedbackEl.textContent = '';
        }

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modalCard.classList.remove('scale-95');
        modalCard.classList.add('scale-100');
        document.body.style.overflow = 'hidden';

        // scroll modal back to top
        if (modal) modal.scrollTop = 0;
        if (modalCard) modalCard.scrollTop = 0;
        if (modalFormState) modalFormState.scrollTop = 0;
    }

    function closeSearchModal() {
        modalCard.classList.remove('scale-100');
        modalCard.classList.add('scale-95');
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
        if (modal) modal.scrollTop = 0;
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openSearchModal);
    if (navCtaBtn) navCtaBtn.addEventListener('click', openSearchModal);
    if (mobileCtaBtn) mobileCtaBtn.addEventListener('click', () => {
        closeMobileMenu();
        openSearchModal();
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSearchModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeSearchModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target === modalBackdrop) {
                closeSearchModal();
            }
        });
    }
    if (successDoneBtn) successDoneBtn.addEventListener('click', closeSearchModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
            closeSearchModal();
        }
    });

    let isSubmittingLead = false;

    if (leadCaptureForm) {
        const feedbackEl = document.getElementById('formFeedbackMessage');

        function setFormFeedback(msg, type = 'error') {
            if (!feedbackEl) return;
            if (!msg) {
                feedbackEl.className = 'hidden text-xs py-2.5 px-3.5 rounded-xl border text-center transition-all';
                feedbackEl.textContent = '';
                return;
            }
            feedbackEl.className = `text-xs py-2.5 px-3.5 rounded-xl border text-center transition-all is-${type}`;
            feedbackEl.textContent = msg;
            feedbackEl.classList.remove('hidden');
        }

        leadCaptureForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // prevent double submits
            if (isSubmittingLead) return;

            setFormFeedback(null);

            const fullName = document.getElementById('inputFullName')?.value?.trim() || '';
            const phone = document.getElementById('inputPhone')?.value?.trim() || '';
            const email = document.getElementById('inputEmail')?.value?.trim() || '';
            const timings = document.getElementById('selectTimings')?.value || '';
            const message = document.getElementById('inputMessage')?.value?.trim() || '';

            const loc = badgeModalLoc ? badgeModalLoc.textContent.trim() : '';
            const type = badgeModalType ? badgeModalType.textContent.trim() : '';
            const price = badgeModalPrice ? badgeModalPrice.textContent.trim() : '';

            const formData = {
                name: fullName,
                phone: phone,
                email: email,
                preferredTimings: timings,
                message: message,
                subject: 'Personalised Property Advisory Request',
                location: loc,
                propertyType: type,
                budget: price
            };

            // basic field validation
            const validation = validateContactSubmission(formData);
            if (!validation.isValid) {
                setFormFeedback(validation.error, 'error');
                return;
            }

            const submitBtn = document.getElementById('submitLeadBtn');
            const originalContent = submitBtn ? submitBtn.innerHTML : 'Submit';

            try {
                isSubmittingLead = true;

                // loading state
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-black inline" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Submitting Request...</span>
                    `;
                }

                // submit lead
                const result = await submitContactForm(formData);

                if (result.success) {
                    // clear form
                    leadCaptureForm.reset();
                    setFormFeedback(null);

                    // show success screen
                    if (modalFormState) modalFormState.classList.add('hidden');
                    if (modalSuccessState) modalSuccessState.classList.remove('hidden');
                } else {
                    // show error notice
                    setFormFeedback(result.error || 'Submission failed. Please try again.', 'error');
                }
            } catch (err) {
                console.error('[Two Poynt] Submission error:', err);
                setFormFeedback('An unexpected error occurred while submitting. Please try again.', 'error');
            } finally {
                isSubmittingLead = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalContent;
                }
            }
        });
    }

    const stepsTrack = document.getElementById('stepsTrack');
    const prevStepBtn = document.getElementById('prevStepBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const stepDots = document.querySelectorAll('.step-dot');
    const activeStepNumber = document.getElementById('activeStepNumber');

    let currentStepIndex = 0;
    let autoSlideTimer = null;
    let resumeSlideTimer = null;
    const AUTO_SLIDE_INTERVAL = 3800;

    function isMobileSliderActive() {
        return window.innerWidth < 1024;
    }

    function updateStepIndicators(index) {
        currentStepIndex = index;

        stepCards.forEach((card, idx) => {
            if (isMobileSliderActive()) {
                if (idx === index) {
                    card.classList.add('active-slide');
                } else {
                    card.classList.remove('active-slide');
                }
            } else {
                card.classList.remove('active-slide');
            }
        });

        stepDots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('active');
                dot.classList.remove('w-2.5');
                dot.classList.add('w-7');
            } else {
                dot.classList.remove('active');
                dot.classList.remove('w-7');
                dot.classList.add('w-2.5');
            }
        });

        if (activeStepNumber) {
            activeStepNumber.textContent = `0${index + 1}`;
        }
    }

    function scrollToStepIndex(index, smooth = true) {
        if (!stepsTrack || !stepCards[index]) return;
        currentStepIndex = index;
        const targetCard = stepCards[index];

        const trackBounds = stepsTrack.getBoundingClientRect();
        const cardBounds = targetCard.getBoundingClientRect();
        const scrollOffset = (cardBounds.left - trackBounds.left) + stepsTrack.scrollLeft - ((stepsTrack.clientWidth - targetCard.clientWidth) / 2);

        stepsTrack.scrollTo({
            left: Math.max(0, scrollOffset),
            behavior: smooth ? 'smooth' : 'auto'
        });

        updateStepIndicators(index);
    }

    function slideNext() {
        if (!isMobileSliderActive()) return;
        const nextIdx = (currentStepIndex + 1) % stepCards.length;
        scrollToStepIndex(nextIdx, true);
    }

    function slidePrev() {
        if (!isMobileSliderActive()) return;
        const prevIdx = (currentStepIndex - 1 + stepCards.length) % stepCards.length;
        scrollToStepIndex(prevIdx, true);
    }

    function startAutoSlide() {
        stopAutoSlide();
        if (isMobileSliderActive()) {
            autoSlideTimer = setInterval(() => {
                slideNext();
            }, AUTO_SLIDE_INTERVAL);
        }
    }

    function stopAutoSlide() {
        if (autoSlideTimer) {
            clearInterval(autoSlideTimer);
            autoSlideTimer = null;
        }
    }

    function handleUserInteraction() {
        stopAutoSlide();
        if (resumeSlideTimer) clearTimeout(resumeSlideTimer);
        resumeSlideTimer = setTimeout(() => {
            startAutoSlide();
        }, 5000);
    }

    if (stepsTrack) {
        let scrollTimeout = null;
        stepsTrack.addEventListener('scroll', () => {
            if (!isMobileSliderActive()) return;
            handleUserInteraction();

            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const trackCenter = stepsTrack.scrollLeft + (stepsTrack.clientWidth / 2);
                let closestIndex = 0;
                let minDiff = Infinity;

                stepCards.forEach((card, idx) => {
                    const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
                    const diff = Math.abs(trackCenter - cardCenter);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = idx;
                    }
                });

                if (closestIndex !== currentStepIndex) {
                    updateStepIndicators(closestIndex);
                }
            }, 60);
        }, { passive: true });

        stepsTrack.addEventListener('touchstart', handleUserInteraction, { passive: true });
        stepsTrack.addEventListener('touchend', handleUserInteraction, { passive: true });
    }

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            slidePrev();
            handleUserInteraction();
        });
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            slideNext();
            handleUserInteraction();
        });
    }

    stepDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(dot.getAttribute('data-index'), 10);
            if (!isNaN(idx)) {
                scrollToStepIndex(idx, true);
                handleUserInteraction();
            }
        });
    });

    stepCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            stepCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            if (isMobileSliderActive()) {
                scrollToStepIndex(idx, true);
                handleUserInteraction();
            }
        });
    });

    function syncSliderWithViewport() {
        if (isMobileSliderActive()) {
            updateStepIndicators(currentStepIndex);
            startAutoSlide();
        } else {
            stopAutoSlide();
            stepCards.forEach(c => c.classList.remove('active-slide'));
        }
    }

    window.addEventListener('resize', syncSliderWithViewport);
    syncSliderWithViewport();

    const nodeProperty = document.getElementById('nodeProperty');
    const nodePeople = document.getElementById('nodePeople');

    if (nodeProperty && nodePeople) {
        nodeProperty.addEventListener('mouseenter', () => {
            nodeProperty.classList.add('scale-105');
        });
        nodeProperty.addEventListener('mouseleave', () => {
            nodeProperty.classList.remove('scale-105');
        });
        nodePeople.addEventListener('mouseenter', () => {
            nodePeople.classList.add('scale-105');
        });
        nodePeople.addEventListener('mouseleave', () => {
            nodePeople.classList.remove('scale-105');
        });
    }

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('hidden');
        if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove('hidden');
    }

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('hidden');
        if (mobileMenuBackdrop) mobileMenuBackdrop.classList.add('hidden');
    }

    function toggleMobileMenu() {
        if (!mobileMenu) return;
        if (mobileMenu.classList.contains('hidden')) {
            openMobileMenu();
        } else {
            closeMobileMenu();
        }
    }

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });

        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        if (mobileMenuBackdrop) {
            mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
        }

        // click outside to close
        document.addEventListener('click', (e) => {
            if (!mobileMenu.classList.contains('hidden')) {
                if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });

        // escape closes menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                closeMobileMenu();
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (!mainHeader) return;
        if (window.scrollY > 40) {
            mainHeader.classList.add('py-2');
            mainHeader.classList.remove('py-4');
        } else {
            mainHeader.classList.add('py-4');
            mainHeader.classList.remove('py-2');
        }
    });
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');
    const mobileThemeLabel = document.getElementById('mobileThemeLabel');
    let themeTransitionTimeout = null;

    function setTheme(mode, animate = true) {
        if (animate) {
            document.documentElement.classList.add('theme-animating');
            if (themeTransitionTimeout) clearTimeout(themeTransitionTimeout);
            themeTransitionTimeout = setTimeout(() => {
                document.documentElement.classList.remove('theme-animating');
            }, 750);
        }

        if (mode === 'light') {
            document.documentElement.classList.add('light-mode');
            try { localStorage.setItem('tp_theme', 'light'); } catch (e) {}
            if (mobileThemeLabel) mobileThemeLabel.textContent = 'Dark Mode';
        } else {
            document.documentElement.classList.remove('light-mode');
            try { localStorage.setItem('tp_theme', 'dark'); } catch (e) {}
            if (mobileThemeLabel) mobileThemeLabel.textContent = 'Light Mode';
        }

        document.dispatchEvent(new CustomEvent('tp-theme-changed', { detail: { mode } }));
    }

    try {
        const savedTheme = localStorage.getItem('tp_theme');
        if (savedTheme === 'dark') {
            setTheme('dark', false);
        } else {
            setTheme('light', false);
        }
    } catch (e) {
        setTheme('light', false);
    }

    function toggleTheme() {
        const isCurrentLight = document.documentElement.classList.contains('light-mode');
        setTheme(isCurrentLight ? 'dark' : 'light', true);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (mobileThemeToggleBtn) {
        mobileThemeToggleBtn.addEventListener('click', toggleTheme);
    }

    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            item.addEventListener('click', () => {
                const isCurrentlyOpen = item.classList.contains('open');
                faqItems.forEach(other => {
                    if (other !== item) {
                        other.classList.remove('open');
                        other.setAttribute('aria-expanded', 'false');
                    }
                });

                if (isCurrentlyOpen) {
                    item.classList.remove('open');
                    item.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('open');
                    item.setAttribute('aria-expanded', 'true');
                }
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });

            item.addEventListener('mouseenter', () => {
                item.setAttribute('aria-expanded', 'true');
            });
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('open')) {
                    item.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        const serviceType = card.getAttribute('data-service-type');
        const enquireBtn = card.querySelector('.service-enquire-btn');

        const handleServiceSelect = (e) => {
            if (filterPropertyType && serviceType) {
                for (let i = 0; i < filterPropertyType.options.length; i++) {
                    if (filterPropertyType.options[i].value === serviceType) {
                        filterPropertyType.selectedIndex = i;
                        break;
                    }
                }
            }
            openSearchModal();
        };

        if (enquireBtn) {
            enquireBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleServiceSelect(e);
            });
        }

        card.addEventListener('click', handleServiceSelect);
    });

    
    const BUILDERS_PROJECTS = [
        {
            name: "Sobha Neopolis",
            company: "SOBHA",
            image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
            alt: "Sobha Neopolis by SOBHA"
        },
        {
            name: "Purva Orient Grand",
            company: "Puravankara",
            image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80",
            alt: "Purva Orient Grand by Puravankara"
        },
        {
            name: "Sumadhura Folium",
            company: "Sumadhura",
            image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
            alt: "Sumadhura Folium by Sumadhura"
        },
        {
            name: "Brigade Cornerstone Utopia",
            company: "Brigade",
            image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
            alt: "Brigade Cornerstone Utopia by Brigade"
        },
        {
            name: "Godrej Athena",
            company: "Godrej Properties",
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
            alt: "Godrej Athena by Godrej Properties"
        },
        {
            name: "Mahindra Eden",
            company: "Mahindra Lifespaces",
            image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
            alt: "Mahindra Eden by Mahindra Lifespaces"
        },
        {
            name: "Lodha Mirabelle",
            company: "Lodha",
            image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
            alt: "Lodha Mirabelle by Lodha"
        },
        {
            name: "Prestige Kingfisher Towers",
            company: "Prestige Group",
            image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
            alt: "Prestige Kingfisher Towers by Prestige Group"
        },
        {
            name: "Bren Zahara",
            company: "Bren",
            image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80",
            alt: "Bren Zahara by Bren"
        },
        {
            name: "Mana Dale",
            company: "Mana Projects",
            image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
            alt: "Mana Dale by Mana Projects"
        },
        {
            name: "DSR The Courtyard",
            company: "DSR",
            image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=600&q=80",
            alt: "DSR The Courtyard by DSR"
        },
        {
            name: "Nambiar Bellezea",
            company: "Nambiar",
            image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80",
            alt: "Nambiar Bellezea by Nambiar"
        },
        {
            name: "Adarsh Palm Retreat",
            company: "Adarsh Developers",
            image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80",
            alt: "Adarsh Palm Retreat by Adarsh Developers"
        },
        {
            name: "Abhee Celestial City",
            company: "Abhee Ventures",
            image: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=600&q=80",
            alt: "Abhee Celestial City by Abhee Ventures"
        },
        {
            name: "Myhna Maple",
            company: "Myhna",
            image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=600&q=80",
            alt: "Myhna Maple by Myhna"
        },
        {
            name: "Assetz Marq 3.0",
            company: "Assetz Property Group",
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
            alt: "Assetz Marq 3.0 by Assetz Property Group"
        },
        {
            name: "SBR Keerthi Prime",
            company: "SBR Group",
            image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
            alt: "SBR Keerthi Prime by SBR Group"
        }
    ];

    
    const projectToast = document.getElementById('projectToast');
    const toastMessage = document.getElementById('toastMessage');
    let toastTimer = null;

    function showProjectToast(message = "Contact us for more info.") {
        if (!projectToast) return;
        
        if (toastMessage) toastMessage.textContent = message;

        if (toastTimer) {
            clearTimeout(toastTimer);
            toastTimer = null;
        }

        projectToast.classList.remove('opacity-0', 'translate-y-6', 'pointer-events-none');
        projectToast.classList.add('opacity-100', 'translate-y-0');

        const toastCard = projectToast.querySelector('.crystal-glass-toast');
        if (toastCard) {
            toastCard.classList.remove('toast-bounce');
            void toastCard.offsetWidth;
            toastCard.classList.add('toast-bounce');
        }

        toastTimer = setTimeout(() => {
            hideProjectToast();
        }, 3000);
    }

    function hideProjectToast() {
        if (!projectToast) return;
        projectToast.classList.remove('opacity-100', 'translate-y-0');
        projectToast.classList.add('opacity-0', 'translate-y-6', 'pointer-events-none');
    }

    
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            showProjectToast("Contact us for more info.");
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showProjectToast("Contact us for more info.");
            }
        });
    });

    
    const carouselTrack = document.getElementById('projectsCarouselTrack');
    const carouselContainer = document.getElementById('projectsCarouselContainer');
    const prevBtn = document.getElementById('projectCarouselPrevBtn');
    const nextBtn = document.getElementById('projectCarouselNextBtn');
    const playPauseBtn = document.getElementById('projectCarouselPlayPauseBtn');
    const prevBtnMobile = document.getElementById('projectCarouselPrevBtnMobile');
    const nextBtnMobile = document.getElementById('projectCarouselNextBtnMobile');
    const playPauseBtnMobile = document.getElementById('projectCarouselPlayPauseBtnMobile');
    const pauseIcon = document.getElementById('projectPauseIcon');
    const playIcon = document.getElementById('projectPlayIcon');
    const pauseIconMobile = document.getElementById('projectPauseIconMobile');
    const playIconMobile = document.getElementById('projectPlayIconMobile');

    // card click handlers
    const allProjectCards = document.querySelectorAll('.project-card');
    allProjectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            showProjectToast("Contact us for more info.");
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showProjectToast("Contact us for more info.");
            }
        });
    });

    let isMarqueePaused = false;

    function getTrackAnimation() {
        if (!carouselTrack) return null;
        const anims = carouselTrack.getAnimations ? carouselTrack.getAnimations() : [];
        return anims.length > 0 ? anims[0] : null;
    }

    function toggleMarqueePlayPause() {
        if (!carouselTrack) return;
        isMarqueePaused = !isMarqueePaused;
        if (isMarqueePaused) {
            carouselTrack.classList.add('is-paused');
            if (pauseIcon) pauseIcon.classList.add('hidden');
            if (playIcon) playIcon.classList.remove('hidden');
            if (pauseIconMobile) pauseIconMobile.classList.add('hidden');
            if (playIconMobile) playIconMobile.classList.remove('hidden');
        } else {
            carouselTrack.classList.remove('is-paused');
            if (pauseIcon) pauseIcon.classList.remove('hidden');
            if (playIcon) playIcon.classList.add('hidden');
            if (pauseIconMobile) pauseIconMobile.classList.remove('hidden');
            if (playIconMobile) playIconMobile.classList.add('hidden');
        }
    }

    function setMarqueeDirection(direction = 'left') {
        if (!carouselTrack) return;
        if (direction === 'left') {
            carouselTrack.classList.remove('is-reversed');
        } else {
            carouselTrack.classList.add('is-reversed');
        }
        if (isMarqueePaused) {
            toggleMarqueePlayPause();
        }
    }

    function nudgeMarquee(secondsOffset = 2.5) {
        const anim = getTrackAnimation();
        if (anim && typeof anim.currentTime === 'number') {
            try {
                anim.currentTime = anim.currentTime + (secondsOffset * 1000);
            } catch (err) {}
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            setMarqueeDirection('left');
            nudgeMarquee(2.5);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            setMarqueeDirection('right');
            nudgeMarquee(-2.5);
        });
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', toggleMarqueePlayPause);
    }

    if (nextBtnMobile) {
        nextBtnMobile.addEventListener('click', () => {
            setMarqueeDirection('left');
            nudgeMarquee(2.5);
        });
    }

    if (prevBtnMobile) {
        prevBtnMobile.addEventListener('click', () => {
            setMarqueeDirection('right');
            nudgeMarquee(-2.5);
        });
    }

    if (playPauseBtnMobile) {
        playPauseBtnMobile.addEventListener('click', toggleMarqueePlayPause);
    }

    if (carouselContainer) {
        carouselContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setMarqueeDirection('right');
                nudgeMarquee(-2.5);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setMarqueeDirection('left');
                nudgeMarquee(2.5);
            } else if (e.key === ' ') {
                e.preventDefault();
                toggleMarqueePlayPause();
            }
        });
    }

    function isAnyModalOpen() {
        const searchModalOpen = modal && !modal.classList.contains('pointer-events-none');
        const cookieOpen = cookiePolicyModal && !cookiePolicyModal.classList.contains('pointer-events-none');
        return searchModalOpen || cookieOpen;
    }

    // cookie policy modal & banner
    const cookiePolicyModal = document.getElementById('cookiePolicyModal');
    const cookiePolicyCard = document.getElementById('cookiePolicyCard');
    const cookiePolicyBackdrop = document.getElementById('cookiePolicyBackdrop');
    const openCookiePolicyBtn = document.getElementById('openCookiePolicyBtn');
    const openCookieSettingsBtn = document.getElementById('openCookieSettingsBtn');
    const closeCookiePolicyBtn = document.getElementById('closeCookiePolicyBtn');

    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const cookieAcceptAllBtn = document.getElementById('cookieAcceptAllBtn');
    const cookieRejectBtn = document.getElementById('cookieRejectBtn');
    const cookieCustomizeBtn = document.getElementById('cookieCustomizeBtn');

    const cookieAcceptAllInModalBtn = document.getElementById('cookieAcceptAllInModalBtn');
    const cookieRejectInModalBtn = document.getElementById('cookieRejectInModalBtn');
    const cookieSavePreferencesBtn = document.getElementById('cookieSavePreferencesBtn');

    const cookieToggleFunctional = document.getElementById('cookieToggleFunctional');
    const cookieToggleAnalytics = document.getElementById('cookieToggleAnalytics');
    const cookieToggleMarketing = document.getElementById('cookieToggleMarketing');

    const COOKIE_STORAGE_KEY = 'tp_cookie_consent';

    function getStoredCookieConsent() {
        try {
            const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveCookieConsent(consent) {
        try {
            localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consent));
        } catch (e) {}
    }

    function syncModalTogglesWithConsent(consent) {
        const functionalChecked = consent ? !!consent.functional : false;
        const analyticsChecked = consent ? !!consent.analytics : false;
        const marketingChecked = consent ? !!consent.marketing : false;

        if (cookieToggleFunctional) cookieToggleFunctional.checked = functionalChecked;
        if (cookieToggleAnalytics) cookieToggleAnalytics.checked = analyticsChecked;
        if (cookieToggleMarketing) cookieToggleMarketing.checked = marketingChecked;
    }

    function openCookiePolicy() {
        if (!cookiePolicyModal || !cookiePolicyCard) return;
        const currentConsent = getStoredCookieConsent();
        syncModalTogglesWithConsent(currentConsent);

        cookiePolicyModal.classList.remove('opacity-0', 'pointer-events-none');
        cookiePolicyCard.classList.remove('scale-95');
        cookiePolicyCard.classList.add('scale-100');
        document.body.style.overflow = 'hidden';

        if (cookiePolicyModal) cookiePolicyModal.scrollTop = 0;
        if (cookiePolicyCard) cookiePolicyCard.scrollTop = 0;
    }

    function closeCookiePolicy() {
        if (!cookiePolicyModal || !cookiePolicyCard) return;
        cookiePolicyCard.classList.remove('scale-100');
        cookiePolicyCard.classList.add('scale-95');
        cookiePolicyModal.classList.add('opacity-0', 'pointer-events-none');
        if (!isAnyModalOpen()) {
            document.body.style.overflow = '';
        }
        if (cookiePolicyModal) cookiePolicyModal.scrollTop = 0;
    }

    function showCookieConsentBanner() {
        if (!cookieConsentBanner) return;
        cookieConsentBanner.classList.remove('hidden');
        requestAnimationFrame(() => {
            cookieConsentBanner.classList.remove('opacity-0', 'translate-y-8');
            cookieConsentBanner.classList.add('opacity-100', 'translate-y-0');
        });
    }

    function hideCookieConsentBanner() {
        if (!cookieConsentBanner) return;
        cookieConsentBanner.classList.remove('opacity-100', 'translate-y-0');
        cookieConsentBanner.classList.add('opacity-0', 'translate-y-8');
        setTimeout(() => {
            cookieConsentBanner.classList.add('hidden');
        }, 400);
    }

    function applyAcceptAll() {
        const consent = {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
            timestamp: Date.now(),
            version: '1.0'
        };
        saveCookieConsent(consent);
        syncModalTogglesWithConsent(consent);
        hideCookieConsentBanner();
        closeCookiePolicy();
        showProjectToast('Cookie preferences saved.');
    }

    function applyRejectNonEssential() {
        const consent = {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
            timestamp: Date.now(),
            version: '1.0'
        };
        saveCookieConsent(consent);
        syncModalTogglesWithConsent(consent);
        hideCookieConsentBanner();
        closeCookiePolicy();
        showProjectToast('Non-essential cookies declined.');
    }

    function applySaveCustomPreferences() {
        const consent = {
            essential: true,
            functional: cookieToggleFunctional ? cookieToggleFunctional.checked : false,
            analytics: cookieToggleAnalytics ? cookieToggleAnalytics.checked : false,
            marketing: cookieToggleMarketing ? cookieToggleMarketing.checked : false,
            timestamp: Date.now(),
            version: '1.0'
        };
        saveCookieConsent(consent);
        hideCookieConsentBanner();
        closeCookiePolicy();
        showProjectToast('Cookie preferences updated.');
    }

    // modal triggers
    if (openCookiePolicyBtn) {
        openCookiePolicyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCookiePolicy();
        });
    }

    if (openCookieSettingsBtn) {
        openCookieSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCookiePolicy();
        });
    }

    if (cookieCustomizeBtn) {
        cookieCustomizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCookiePolicy();
        });
    }

    if (closeCookiePolicyBtn) {
        closeCookiePolicyBtn.addEventListener('click', closeCookiePolicy);
    }

    if (cookiePolicyBackdrop) {
        cookiePolicyBackdrop.addEventListener('click', closeCookiePolicy);
    }

    if (cookiePolicyModal) {
        cookiePolicyModal.addEventListener('click', (e) => {
            if (e.target === cookiePolicyModal || e.target === cookiePolicyBackdrop) {
                closeCookiePolicy();
            }
        });
    }

    // modal buttons
    if (cookieAcceptAllBtn) cookieAcceptAllBtn.addEventListener('click', applyAcceptAll);
    if (cookieAcceptAllInModalBtn) cookieAcceptAllInModalBtn.addEventListener('click', applyAcceptAll);

    if (cookieRejectBtn) cookieRejectBtn.addEventListener('click', applyRejectNonEssential);
    if (cookieRejectInModalBtn) cookieRejectInModalBtn.addEventListener('click', applyRejectNonEssential);

    if (cookieSavePreferencesBtn) cookieSavePreferencesBtn.addEventListener('click', applySaveCustomPreferences);

    // close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (cookiePolicyModal && !cookiePolicyModal.classList.contains('pointer-events-none')) {
                closeCookiePolicy();
            }
        }
    });

    // check existing consent
    const storedConsent = getStoredCookieConsent();
    if (!storedConsent) {
        setTimeout(() => {
            showCookieConsentBanner();
        }, 750);
    } else {
        syncModalTogglesWithConsent(storedConsent);
    }

    // emi calculator
    function initEmiCalculator() {
        const emiLoanSlider = document.getElementById('emiLoanSlider');
        const emiLoanInput = document.getElementById('emiLoanInput');
        const emiLoanDisplay = document.getElementById('emiLoanDisplay');
        const emiRateSlider = document.getElementById('emiRateSlider');
        const emiRateInput = document.getElementById('emiRateInput');
        const emiRateDisplay = document.getElementById('emiRateDisplay');
        const emiTenureSlider = document.getElementById('emiTenureSlider');
        const emiTenureInput = document.getElementById('emiTenureInput');
        const emiTenureDisplay = document.getElementById('emiTenureDisplay');
        const calculateEmiBtn = document.getElementById('calculateEmiBtn');

        const emiResultMonthly = document.getElementById('emiResultMonthly');
        const emiResultTenureMonths = document.getElementById('emiResultTenureMonths');
        const emiResultPrincipal = document.getElementById('emiResultPrincipal');
        const emiResultInterest = document.getElementById('emiResultInterest');
        const emiResultTotal = document.getElementById('emiResultTotal');

        const emiBarPrincipal = document.getElementById('emiBarPrincipal');
        const emiBarInterest = document.getElementById('emiBarInterest');
        const emiPercentPrincipal = document.getElementById('emiPercentPrincipal');
        const emiPercentInterest = document.getElementById('emiPercentInterest');

        const heroPriceEmiBtn = document.getElementById('heroPriceEmiBtn');
        const emiConsultBtn = document.getElementById('emiConsultBtn');
        const emiCalculatorSection = document.getElementById('emi-calculator');
        const emiInputsCard = document.getElementById('emiInputsCard');
        const emiResultsCard = document.getElementById('emiResultsCard');

        const loanChips = document.querySelectorAll('.emi-chip-loan');
        const rateChips = document.querySelectorAll('.emi-chip-rate');
        const tenureChips = document.querySelectorAll('.emi-chip-tenure');

        if (!emiLoanSlider || !emiRateSlider || !emiTenureSlider) return;

        const THUMB_WIDTH = 22; // thumb width in px

        function formatRupees(amount) {
            return '₹' + Math.round(amount).toLocaleString('en-IN');
        }

        function parseAmount(val) {
            if (!val) return 0;
            const s = String(val).trim().toLowerCase();
            const crMatch = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*cr/);
            if (crMatch) {
                return Math.round(parseFloat(crMatch[1]) * 10000000);
            }
            const lMatch = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:l|lakh|lac)/);
            if (lMatch) {
                return Math.round(parseFloat(lMatch[1]) * 100000);
            }
            const digits = s.replace(/[^0-9]/g, '');
            return digits ? parseInt(digits, 10) : 0;
        }

        // slider percentage
        function getSliderPercentage(value, min, max) {
            if (max <= min) return 0;
            return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
        }

        // Mapping for interest rate benchmarks: 0% = 7.0%, 25% = 8.5%, 50% = 10.0%, 75% = 12.5%, 100% = 15.0%
        function getRatePercentage(rate) {
            rate = parseFloat(rate);
            if (isNaN(rate) || rate <= 7.0) return 0;
            if (rate >= 15.0) return 100;
            if (rate <= 8.5) {
                return 0 + ((rate - 7.0) / (8.5 - 7.0)) * 25;
            } else if (rate <= 10.0) {
                return 25 + ((rate - 8.5) / (10.0 - 8.5)) * 25;
            } else if (rate <= 12.5) {
                return 50 + ((rate - 10.0) / (12.5 - 10.0)) * 25;
            } else {
                return 75 + ((rate - 12.5) / (15.0 - 12.5)) * 25;
            }
        }

        function getRateFromPercentage(pct) {
            pct = Math.min(100, Math.max(0, pct));
            let rate;
            if (pct <= 0) rate = 7.0;
            else if (pct >= 100) rate = 15.0;
            else if (pct <= 25) {
                rate = 7.0 + (pct / 25) * (8.5 - 7.0);
            } else if (pct <= 50) {
                rate = 8.5 + ((pct - 25) / 25) * (10.0 - 8.5);
            } else if (pct <= 75) {
                rate = 10.0 + ((pct - 50) / 25) * (12.5 - 10.0);
            } else {
                rate = 12.5 + ((pct - 75) / 25) * (15.0 - 12.5);
            }
            return Math.round(rate * 10) / 10;
        }

        // position ticks under thumb center
        function positionTicks(containerId, slider) {
            const container = document.getElementById(containerId);
            if (!container || !slider) return;
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const ticks = container.querySelectorAll('.emi-tick');

            ticks.forEach(tick => {
                const val = parseFloat(tick.dataset.val);
                if (isNaN(val)) return;

                let pct;
                if (containerId === 'rateTicks') {
                    pct = getRatePercentage(val);
                } else {
                    pct = getSliderPercentage(val, min, max);
                }

                if (pct <= 0) {
                    tick.style.left = '0%';
                    tick.style.right = 'auto';
                    tick.style.transform = 'none';
                } else if (pct >= 100) {
                    tick.style.left = 'auto';
                    tick.style.right = '0%';
                    tick.style.transform = 'none';
                } else {
                    tick.style.left = `calc(${pct}% + ${(0.5 - pct / 100) * THUMB_WIDTH}px)`;
                    tick.style.right = 'auto';
                    tick.style.transform = 'translateX(-50%)';
                }
            });
        }

        // update track gradient fill
        function updateSliderFill(slider) {
            if (!slider) return;
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const val = parseFloat(slider.value);
            const pct = getSliderPercentage(val, min, max);

            const isLight = document.documentElement.classList.contains('light-mode');
            const activeColor = isLight ? '#b89345' : '#ddc28d';
            const trackColor = isLight ? '#E5E1D9' : 'rgba(255, 255, 255, 0.12)';

            slider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`;
        }

        function calculateEMI(source) {
            let P = 0;
            if (source === 'input' && emiLoanInput) {
                P = parseAmount(emiLoanInput.value) || 0;
            } else {
                P = parseFloat(emiLoanSlider.value) || 0;
                if (emiLoanInput && document.activeElement !== emiLoanInput) {
                    emiLoanInput.value = P > 0 ? Math.round(P).toLocaleString('en-IN') : '';
                }
            }

            let annualRate = 0;
            if (source === 'rate-input' && emiRateInput) {
                annualRate = parseFloat(emiRateInput.value) || 0;
                emiRateSlider.value = getRatePercentage(annualRate);
            } else {
                const pct = parseFloat(emiRateSlider.value) || 0;
                annualRate = getRateFromPercentage(pct);
                if (emiRateInput && document.activeElement !== emiRateInput) {
                    emiRateInput.value = annualRate > 0 ? (Number.isInteger(annualRate) ? annualRate.toString() : annualRate.toFixed(1)) : '';
                }
            }

            let tenureYears = 1;
            if (source === 'tenure-input' && emiTenureInput) {
                tenureYears = parseInt(emiTenureInput.value, 10) || 1;
            } else {
                tenureYears = parseInt(emiTenureSlider.value, 10) || 1;
                if (emiTenureInput && document.activeElement !== emiTenureInput) {
                    emiTenureInput.value = tenureYears > 0 ? String(tenureYears) : '';
                }
            }

            const n = tenureYears * 12;
            const r = (annualRate / 100) / 12;

            let emi = 0;
            if (r <= 0) {
                emi = n > 0 ? (P / n) : 0;
            } else {
                const factor = Math.pow(1 + r, n);
                emi = (P * r * factor) / (factor - 1);
            }

            const totalRepayment = emi * n;
            const totalInterest = Math.max(0, totalRepayment - P);

            // update text labels
            if (emiLoanDisplay) emiLoanDisplay.textContent = formatRupees(P);
            if (emiRateDisplay) emiRateDisplay.textContent = annualRate.toFixed(1) + '%';
            if (emiTenureDisplay) emiTenureDisplay.textContent = tenureYears + (tenureYears === 1 ? ' Year' : ' Years');

            // update results
            if (emiResultMonthly) emiResultMonthly.textContent = formatRupees(emi);
            if (emiResultTenureMonths) emiResultTenureMonths.textContent = n;
            if (emiResultPrincipal) emiResultPrincipal.textContent = formatRupees(P);
            if (emiResultInterest) emiResultInterest.textContent = formatRupees(totalInterest);
            if (emiResultTotal) emiResultTotal.textContent = formatRupees(totalRepayment);

            // breakdown bar
            if (totalRepayment > 0) {
                const principalPercent = Math.min(100, Math.max(0, Math.round((P / totalRepayment) * 100)));
                const interestPercent = 100 - principalPercent;

                if (emiBarPrincipal) emiBarPrincipal.style.width = principalPercent + '%';
                if (emiBarInterest) emiBarInterest.style.width = interestPercent + '%';
                if (emiPercentPrincipal) emiPercentPrincipal.textContent = principalPercent + '%';
                if (emiPercentInterest) emiPercentInterest.textContent = interestPercent + '%';
            }

            // slider fills
            updateSliderFill(emiLoanSlider);
            updateSliderFill(emiRateSlider);
            updateSliderFill(emiTenureSlider);

            // active presets
            syncActiveChips();
        }

        function syncActiveChips() {
            const currentP = Math.round(parseFloat(emiLoanSlider.value) || 0);
            loanChips.forEach(chip => {
                const chipVal = Math.round(parseFloat(chip.dataset.val) || 0);
                if (chipVal === currentP) {
                    chip.classList.add('active-chip');
                    chip.setAttribute('aria-pressed', 'true');
                } else {
                    chip.classList.remove('active-chip');
                    chip.setAttribute('aria-pressed', 'false');
                }
            });

            const currentRPct = parseFloat(emiRateSlider.value) || 0;
            const currentR = getRateFromPercentage(currentRPct);
            rateChips.forEach(chip => {
                const chipVal = parseFloat(chip.dataset.val);
                if (Math.abs(chipVal - currentR) < 0.05) {
                    chip.classList.add('active-chip');
                    chip.setAttribute('aria-pressed', 'true');
                } else {
                    chip.classList.remove('active-chip');
                    chip.setAttribute('aria-pressed', 'false');
                }
            });

            const currentT = parseInt(emiTenureSlider.value, 10);
            tenureChips.forEach(chip => {
                const chipVal = parseInt(chip.dataset.val, 10);
                if (chipVal === currentT) {
                    chip.classList.add('active-chip');
                    chip.setAttribute('aria-pressed', 'true');
                } else {
                    chip.classList.remove('active-chip');
                    chip.setAttribute('aria-pressed', 'false');
                }
            });
        }

        // slider change listeners
        emiLoanSlider.addEventListener('input', () => calculateEMI('slider'));
        emiRateSlider.addEventListener('input', () => calculateEMI('rate'));
        emiTenureSlider.addEventListener('input', () => calculateEMI('tenure'));

        // amount input
        if (emiLoanInput) {
            emiLoanInput.addEventListener('input', () => {
                const entered = parseAmount(emiLoanInput.value);
                if (entered > 0) {
                    if (entered > parseFloat(emiLoanSlider.max)) {
                        emiLoanSlider.max = String(entered);
                        positionTicks('loanTicks', emiLoanSlider);
                    } else if (entered <= 200000000 && parseFloat(emiLoanSlider.max) > 200000000) {
                        emiLoanSlider.max = "200000000";
                        positionTicks('loanTicks', emiLoanSlider);
                    }
                    emiLoanSlider.value = Math.max(parseFloat(emiLoanSlider.min), Math.min(parseFloat(emiLoanSlider.max), entered));
                }
                calculateEMI('input');
            });

            emiLoanInput.addEventListener('blur', () => {
                let entered = parseAmount(emiLoanInput.value);
                if (!entered || entered < parseFloat(emiLoanSlider.min)) {
                    entered = parseFloat(emiLoanSlider.value) || 18000000;
                }
                emiLoanSlider.value = entered;
                emiLoanInput.value = Math.round(entered).toLocaleString('en-IN');
                calculateEMI('blur');
            });

            emiLoanInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    emiLoanInput.blur();
                }
            });
        }

        // interest input
        if (emiRateInput) {
            emiRateInput.addEventListener('input', () => {
                let val = emiRateInput.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                if (parts.length > 2) {
                    val = parts[0] + '.' + parts.slice(1).join('');
                }
                const entered = parseFloat(val);
                if (!isNaN(entered) && entered > 0) {
                    emiRateSlider.value = getRatePercentage(entered);
                }
                calculateEMI('rate-input');
            });

            emiRateInput.addEventListener('blur', () => {
                let entered = parseFloat(emiRateInput.value);
                if (isNaN(entered) || entered <= 0) {
                    const currentPct = parseFloat(emiRateSlider.value) || 25;
                    entered = getRateFromPercentage(currentPct);
                }
                entered = Math.max(7.0, Math.min(15.0, Math.round(entered * 10) / 10));
                emiRateSlider.value = getRatePercentage(entered);
                emiRateInput.value = Number.isInteger(entered) ? entered.toString() : entered.toFixed(1);
                calculateEMI('rate');
            });

            emiRateInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    emiRateInput.blur();
                }
            });
        }

        // tenure input
        if (emiTenureInput) {
            emiTenureInput.addEventListener('input', () => {
                const clean = emiTenureInput.value.replace(/[^0-9]/g, '');
                const entered = parseInt(clean, 10);
                if (!isNaN(entered) && entered > 0) {
                    if (entered > parseInt(emiTenureSlider.max, 10)) {
                        emiTenureSlider.max = String(entered);
                        positionTicks('tenureTicks', emiTenureSlider);
                    } else if (entered <= 30 && parseInt(emiTenureSlider.max, 10) > 30) {
                        emiTenureSlider.max = "30";
                        positionTicks('tenureTicks', emiTenureSlider);
                    }
                    emiTenureSlider.value = Math.max(parseInt(emiTenureSlider.min, 10), Math.min(parseInt(emiTenureSlider.max, 10), entered));
                }
                calculateEMI('tenure-input');
            });

            emiTenureInput.addEventListener('blur', () => {
                let entered = parseInt(emiTenureInput.value.replace(/[^0-9]/g, ''), 10);
                if (isNaN(entered) || entered <= 0) {
                    entered = parseInt(emiTenureSlider.value, 10) || 20;
                }
                emiTenureSlider.value = entered;
                emiTenureInput.value = String(entered);
                calculateEMI('tenure');
            });

            emiTenureInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    emiTenureInput.blur();
                }
            });
        }

        // preset chip clicks
        loanChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const val = parseFloat(chip.dataset.val);
                emiLoanSlider.value = val;
                if (emiLoanInput) {
                    emiLoanInput.value = Math.round(val).toLocaleString('en-IN');
                }
                calculateEMI();
            });
        });

        rateChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const val = parseFloat(chip.dataset.val);
                if (!isNaN(val)) {
                    emiRateSlider.value = getRatePercentage(val);
                    if (emiRateInput) {
                        emiRateInput.value = Number.isInteger(val) ? val.toString() : val.toFixed(1);
                    }
                    calculateEMI('rate');
                }
            });
        });

        // Click tick in rateTicks to select benchmark
        const rateTickEls = document.querySelectorAll('#rateTicks .emi-tick');
        rateTickEls.forEach(tick => {
            tick.classList.add('cursor-pointer');
            tick.addEventListener('click', () => {
                const val = parseFloat(tick.dataset.val);
                if (!isNaN(val)) {
                    emiRateSlider.value = getRatePercentage(val);
                    if (emiRateInput) {
                        emiRateInput.value = Number.isInteger(val) ? val.toString() : val.toFixed(1);
                    }
                    calculateEMI('rate');
                }
            });
        });

        tenureChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const val = chip.dataset.val;
                emiTenureSlider.value = val;
                if (emiTenureInput) {
                    emiTenureInput.value = val;
                }
                calculateEMI();
            });
        });

        // calculate button
        if (calculateEmiBtn) {
            calculateEmiBtn.addEventListener('click', () => {
                calculateEMI();
                if (window.innerWidth < 1024 && emiResultsCard) {
                    emiResultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        // scroll to emi calculator
        if (heroPriceEmiBtn) {
            heroPriceEmiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const heroSlider = document.getElementById('priceSlider');
                if (heroSlider) {
                    const priceInLakhs = currentHeroPriceVal || getHeroPriceFromPercentage(parseFloat(heroSlider.value) || 29);
                    const priceInRupees = Math.min(200000000, Math.max(2000000, priceInLakhs * 100000));
                    emiLoanSlider.value = priceInRupees;
                    if (emiLoanInput) {
                        emiLoanInput.value = Math.round(priceInRupees).toLocaleString('en-IN');
                    }
                    calculateEMI();
                }

                if (emiCalculatorSection) {
                    emiCalculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                if (emiInputsCard && emiResultsCard) {
                    emiInputsCard.classList.remove('emi-highlight-active');
                    emiResultsCard.classList.remove('emi-highlight-active');
                    void emiInputsCard.offsetWidth;
                    emiInputsCard.classList.add('emi-highlight-active');
                    emiResultsCard.classList.add('emi-highlight-active');
                    setTimeout(() => {
                        emiInputsCard.classList.remove('emi-highlight-active');
                        emiResultsCard.classList.remove('emi-highlight-active');
                    }, 2300);
                }
            });
        }

        // open advisory modal
        if (emiConsultBtn) {
            emiConsultBtn.addEventListener('click', () => {
                const modal = document.getElementById('personalizedModal');
                const badgeModalPrice = document.getElementById('badgeModalPrice');
                const badgeModalLoc = document.getElementById('badgeModalLoc');
                const badgeModalType = document.getElementById('badgeModalType');
                const modalFormState = document.getElementById('modalFormState');
                const modalSuccessState = document.getElementById('modalSuccessState');

                if (modal) {
                    const currentLoanFormatted = emiLoanDisplay ? emiLoanDisplay.textContent : '₹1.8 Cr';
                    if (badgeModalPrice) {
                        badgeModalPrice.textContent = currentLoanFormatted;
                    }
                    if (badgeModalLoc) badgeModalLoc.textContent = "Bangalore Prime";
                    if (badgeModalType) badgeModalType.textContent = "Luxury Residence Financing";

                    if (modalFormState) modalFormState.classList.remove('hidden');
                    if (modalSuccessState) modalSuccessState.classList.add('hidden');

                    modal.classList.remove('opacity-0', 'pointer-events-none');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        function alignAllTicks() {
            positionTicks('loanTicks', emiLoanSlider);
            positionTicks('rateTicks', emiRateSlider);
            positionTicks('tenureTicks', emiTenureSlider);
        }

        // initial values and tick alignment
        emiRateSlider.value = getRatePercentage(8.5);
        alignAllTicks();
        window.addEventListener('resize', alignAllTicks);
        document.addEventListener('tp-theme-changed', () => {
            updateSliderFill(emiLoanSlider);
            updateSliderFill(emiRateSlider);
            updateSliderFill(emiTenureSlider);
        });

        calculateEMI();
    }

    initEmiCalculator();

});

