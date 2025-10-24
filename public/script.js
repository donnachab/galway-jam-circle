import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyC4SnqaOMQWmEFulkN8zZALZsqJLK7hOh0",
    authDomain: "galway-jam-circle-live.firebaseapp.com",
    projectId: "galway-jam-circle-live",
    storageBucket: "galway-jam-circle-live.appspot.com",
    messagingSenderId: "140452021164",
    appId: "1:140452021164:web:69703d13213d4ce49a3009",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- GLOBAL STATE & CONSTANTS ---
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let initialJams = [], initialEvents = [], initialPhotos = [], initialVenues = [], initialCommunityItems = [];
let jams = [];
let communitySwiper = null;
let jamDatePicker, jamTimePicker, eventDatePicker, testDatePicker;
let defaultJamDay = "Saturday";

// --- DOM ELEMENT REFERENCES ---
const coverPhotoElement = document.getElementById("cover-photo");
const jamList = document.getElementById("jam-list");
const addJamForm = document.getElementById("add-jam-form");
const jamDateInput = document.getElementById("jam-date");
const jamDayInput = document.getElementById("jam-day");
const jamTimeInput = document.getElementById("jam-time");
const jamVenueInput = document.getElementById("jam-venue");
const jamMapLinkInput = document.getElementById("jam-map-link");
const editJamIdInput = document.getElementById("edit-jam-id");
const formTitle = document.getElementById("form-title");
const venueManagementSection = document.getElementById("venue-management-section");
const venueListAdmin = document.getElementById("venue-list-admin");
const addVenueForm = document.getElementById("add-venue-form");
const newVenueNameInput = document.getElementById("new-venue-name");
const newVenueMapLinkInput = document.getElementById("new-venue-map-link");
const eventList = document.getElementById("event-list");
const addEventForm = document.getElementById("add-event-form");
const eventTitleInput = document.getElementById("event-title");
const eventDatesInput = document.getElementById("event-dates");
const eventTimeInput = document.getElementById("event-time");
const eventMapLinkInput = document.getElementById("event-map-link");
const eventDescriptionInput = document.getElementById("event-description");
const editEventIdInput = document.getElementById("edit-event-id");
const eventFormTitle = document.getElementById("event-form-title");
const galleryGrid = document.getElementById("gallery-grid");
const addPhotoForm = document.getElementById("add-photo-form");
const photoUrlInput = document.getElementById("photo-url");
const photoCaptionInput = document.getElementById("photo-caption");
const featuredVideoPlayer = document.getElementById("featured-video-player");
const editFeaturedVideoForm = document.getElementById("edit-featured-video-form");
const featuredVideoUrlInput = document.getElementById("featured-video-url");
const editCoverPhotoForm = document.getElementById("edit-cover-photo-form");
const coverPhotoUrlInput = document.getElementById("cover-photo-url");
const communitySwiperWrapper = document.getElementById("community-swiper-wrapper");
const addCommunityForm = document.getElementById("add-community-form");
const editCommunityIdInput = document.getElementById("edit-community-id");
const communityImageUrlInput = document.getElementById("community-image-url");
const communityItemTypeInput = document.getElementById("community-item-type");
const communityDescriptionInput = document.getElementById("community-description");
const communityHeadlineWrapper = document.getElementById("community-headline-wrapper");
const communityHeadlineInput = document.getElementById("community-headline");
const charityFieldsWrapper = document.getElementById("charity-fields-wrapper");
const communityAmountInput = document.getElementById("community-amount");
const communityCharityNameInput = document.getElementById("community-charity-name");
const communityFormTitle = document.getElementById("community-form-title");
const modal = document.getElementById("custom-modal");
const modalMessage = document.getElementById("modal-message");
const modalInput = document.getElementById("modal-input");
const modalButtons = document.getElementById("modal-buttons");
const testDateInput = document.getElementById("test-date-input");


// --- MAIN EXECUTION ---
document.addEventListener("DOMContentLoaded", async () => {
    setupEventListeners();
    initDatePickers();

    await loadDataAndRender();
    
    if (sessionStorage.getItem("gjc_isAdmin") === "true") {
        toggleAdminMode(true);
    }
});


// --- ADMIN & MODAL LOGIC ---

function handleAdminClick(e) {
    e.preventDefault();
    if (document.body.classList.contains("admin-mode")) {
        sessionStorage.removeItem("gjc_isAdmin");
        toggleAdminMode(false);
    } else {
        showModal("Enter admin PIN:", "prompt", async (pin) => {
            if (!pin) return;
            const isCorrect = await verifyPin(pin);
            if (isCorrect) {
                sessionStorage.setItem("gjc_isAdmin", "true");
                toggleAdminMode(true);
            } else {
                showModal("Incorrect PIN.", "alert");
            }
        });
    }
}

async function verifyPin(pin) {
    // This is the corrected, simplified PIN check.
    const correctPin = "4519"; 
    return pin === correctPin;
}

function toggleAdminMode(enable) {
    document.body.classList.toggle("admin-mode", enable);
    if (!enable) {
        hideAllForms();
    }
    renderAll(); 
}

function showModal(message, type = "alert", onConfirm = () => {}) {
    modalMessage.textContent = message;
    modalButtons.innerHTML = "";
    modalInput.classList.toggle("hidden", type !== "prompt");
    modalInput.value = "";
    
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "px-4 py-2 bg-stone-600 text-white rounded-md";
    cancelButton.onclick = () => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    };
    
    const confirmButton = document.createElement("button");
    confirmButton.className = "px-4 py-2 bg-accent text-primary font-bold rounded-md";

    if (type === "alert") {
        confirmButton.textContent = "OK";
        confirmButton.onclick = () => { modal.classList.remove('flex'); modal.classList.add('hidden'); onConfirm(); };
        modalButtons.appendChild(confirmButton);
    } else if (type === "confirm") {
        confirmButton.textContent = "Confirm";
        confirmButton.onclick = () => { modal.classList.remove('flex'); modal.classList.add('hidden'); onConfirm(); };
        modalButtons.append(cancelButton, confirmButton);
    } else if (type === "prompt") {
        confirmButton.textContent = "Submit";
        confirmButton.onclick = () => { modal.classList.remove('flex'); modal.classList.add('hidden'); onConfirm(modalInput.value); };
        modalButtons.append(cancelButton, confirmButton);
    }
    
    modal.classList.add("flex");
    modal.classList.remove("hidden");
    if (type === "prompt") modalInput.focus();
}

function hideAllForms() {
    if (addJamForm) addJamForm.style.display = "none";
    if (venueManagementSection) venueManagementSection.style.display = "none";
    if (addEventForm) addEventForm.style.display = "none";
    if (addPhotoForm) addPhotoForm.style.display = "none";
    if (addCommunityForm) addCommunityForm.style.display = "none";
    if (editCoverPhotoForm) editCoverPhotoForm.style.display = "none";
    if (editFeaturedVideoForm) editFeaturedVideoForm.style.display = "none";
}


// --- DATA LOADING & RENDERING ---

async function loadDataAndRender() {
    try {
        const [jamSnap, eventSnap, photoSnap, venueSnap, communitySnap, configDoc] = await Promise.all([
            getDocs(collection(db, "jams")),
            getDocs(collection(db, "events")),
            getDocs(collection(db, "photos")),
            getDocs(collection(db, "venues")),
            getDocs(collection(db, "community")),
            getDoc(doc(db, "site_config", "main")),
        ]);

        initialJams = jamSnap.docs.map(doc => doc.data());
        initialEvents = eventSnap.docs.map(doc => doc.data());
        initialPhotos = photoSnap.docs.map(doc => doc.data());
        initialVenues = venueSnap.docs.map(doc => doc.data());
        initialCommunityItems = communitySnap.docs.map(doc => doc.data());

        if (configDoc.exists()) {
            const configData = configDoc.data();
            defaultJamDay = configData.defaultJamDay || "Saturday";
            if (configData.coverPhotoUrl && coverPhotoElement) coverPhotoElement.src = configData.coverPhotoUrl;
            if (configData.featuredVideoUrl && featuredVideoPlayer) {
                const videoIdMatch = configData.featuredVideoUrl.match(/(?:v=|\/embed\/|\/)([\w-]{11})/);
                if (videoIdMatch) featuredVideoPlayer.src = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
            }
        }
        
        renderAll();

    } catch (error) {
        console.error("Error loading data: ", error);
        showModal("Could not load data from the database. Check console for details.", "alert");
    }
}

function renderAll() {
    manageJamSchedule();
    renderJams();
    renderVenues();
    renderEvents();
    renderGallery();
    renderCommunitySlider();
}

function manageJamSchedule(testDateStr = null) {
    const today = testDateStr ? new Date(testDateStr) : new Date();
    today.setHours(0, 0, 0, 0);

    let confirmedJams = JSON.parse(JSON.stringify(initialJams));
    let upcomingConfirmed = confirmedJams.filter(jam => parseJamDate(jam.date) >= today);
    upcomingConfirmed.sort((a, b) => parseJamDate(a.date) - parseJamDate(b.date));

    let displayJams = [...upcomingConfirmed];
    let lastDate;

    if (displayJams.length > 0) {
        lastDate = parseJamDate(displayJams[displayJams.length - 1].date);
    } else {
        lastDate = new Date(today);
        const targetDayIndex = dayNames.indexOf(defaultJamDay);
        let daysUntilTarget = (targetDayIndex - today.getDay() + 7) % 7;
        // This sets the starting point to the last occurrence of the default jam day.
        lastDate.setDate(today.getDate() + daysUntilTarget - 7);
    }

    while (displayJams.length < 5) {
        lastDate.setDate(lastDate.getDate() + 7);
        const formattedNewDate = formatJamDateForStorage(new Date(lastDate));
        
        // Avoid duplicating an existing confirmed jam
        if (displayJams.some(j => j.date === formattedNewDate)) continue;

        displayJams.push({
            id: `placeholder-${displayJams.length}`,
            day: defaultJamDay,
            date: formattedNewDate,
            venue: "To be decided...",
            cancelled: false,
            isPlaceholder: true,
            time: "3:00 PM",
        });
    }
    jams = displayJams;
}

function renderJams() {
    if (!jamList) return;
    jamList.innerHTML = "";
    if (jams.length === 0) {
      jamList.innerHTML = `<li class="text-center text-gray-500">No upcoming jams scheduled.</li>`;
      return;
    }
    
    jams.sort((a, b) => parseJamDate(a.date) - parseJamDate(b.date)).forEach(jam => {
        const li = document.createElement("li");
        const isSpecial = jam.isRescheduled || jam.day.toLowerCase() !== defaultJamDay.toLowerCase();

        li.className = "p-4 rounded-lg shadow-sm border-l-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-white border-gray-200";
        li.classList.toggle("jam-special", isSpecial && !jam.isPlaceholder);
        li.classList.toggle("jam-cancelled", jam.cancelled);
        
        let adminButtons = '';
        if (document.body.classList.contains('admin-mode') && !jam.isPlaceholder) {
           adminButtons += `<button data-id="${jam.id}" class="edit-btn text-blue-500 hover:text-blue-700">Edit</button>`;
           if (isSpecial) {
              adminButtons += `<button data-id="${jam.id}" class="delete-btn text-red-500 hover:text-red-700 ml-2">Delete</button>`;
           } else {
              adminButtons += jam.cancelled
                ? `<button data-id="${jam.id}" class="reinstate-btn text-green-600 hover:text-green-800 ml-2">Reinstate</button>`
                : `<button data-id="${jam.id}" class="cancel-btn text-yellow-600 hover:text-yellow-800 ml-2">Cancel</button>`;
           }
        }
        
        const mapLink = jam.mapLink ? ` <a href="${jam.mapLink}" target="_blank" class="text-blue-500 hover:underline whitespace-nowrap">(Map)</a>` : "";
        const statusHTML = jam.cancelled ? `<span class="font-bold text-red-600">(CANCELLED)</span>` : (jam.isRescheduled ? `<span class="font-bold text-violet-600">(Rescheduled)</span>` : '');

        li.innerHTML = `
            <div class="flex-grow jam-info">
                <div class="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
                    <span class="font-bold text-lg ${isSpecial ? 'text-violet-600' : 'text-gray-500'}">${jam.day}</span>
                    <span class="text-lg font-bold text-primary">${jam.date.replace(':', '')}</span>
                    <span class="text-lg font-bold text-gray-600">${formatTime(jam.time || "3:00 PM")}</span>
                </div>
                <span class="text-gray-700 text-lg">${jam.venue}${mapLink}</span>
            </div>
            <div class="flex flex-col items-end justify-between self-stretch mt-2 sm:mt-0">
                 ${statusHTML}
                <div class="admin-controls-inline space-x-2 mt-2 sm:mt-0">${adminButtons}</div>
            </div>
        `;
        jamList.appendChild(li);
    });
}

function renderVenues() {
    if (!venueListAdmin) return;
    venueListAdmin.innerHTML = "";
    initialVenues.sort((a, b) => a.name.localeCompare(b.name)).forEach(venue => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center p-2 bg-white rounded";
        li.innerHTML = `
            <span>${venue.name}</span>
            <button data-id="${venue.id}" class="delete-venue-btn text-red-500 hover:text-red-700">Delete</button>
        `;
        venueListAdmin.appendChild(li);
    });
}

function renderEvents() {
    if (!eventList) return;
    eventList.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = initialEvents.filter(event => {
        const dateString = event.dates.includes("-") ? event.dates.split("-")[1].trim() : event.dates;
        const eventEndDate = new Date(dateString);
        return !isNaN(eventEndDate.valueOf()) && eventEndDate >= today;
    });
    
    if (upcomingEvents.length === 0) {
        eventList.innerHTML = `<p class="text-center text-gray-500">No special events scheduled at this time.</p>`;
    }

    upcomingEvents.sort((a,b) => new Date(a.dates.split("-")[0].trim()) - new Date(b.dates.split("-")[0].trim())).forEach(event => {
        const div = document.createElement("div");
        div.className = "bg-white p-6 rounded-lg shadow-md relative border border-gray-200";
        const timeHTML = event.time ? `<span class="text-gray-600 font-semibold">${event.time}</span>` : "";
        const mapLinkHTML = event.mapLink ? ` <a href="${event.mapLink}" target="_blank" class="text-blue-500 hover:underline whitespace-nowrap">(Map)</a>` : "";
        div.innerHTML = `
            <div class="admin-controls-inline absolute top-2 right-2 space-x-2">
                <button data-id="${event.id}" class="edit-event-btn text-blue-500 hover:text-blue-700">Edit</button>
                <button data-id="${event.id}" class="delete-event-btn text-red-500 hover:text-red-700">Delete</button>
            </div>
            <h3 class="text-2xl font-bold text-primary">${event.title}</h3>
            <div class="flex items-center space-x-4 mt-1">
                <p class="text-lg font-semibold text-gray-700">${event.dates}</p>
                ${timeHTML}${mapLinkHTML}
            </div>
            <p class="mt-4 text-gray-600">${event.description}</p>
        `;
        eventList.appendChild(div);
    });
}

function renderGallery() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = "";
    if (initialPhotos.length === 0) {
        galleryGrid.innerHTML = `<p class="text-center text-gray-500 col-span-full">The photo gallery is empty.</p>`;
        return;
    }
    initialPhotos.forEach(photo => {
        const div = document.createElement("div");
        div.className = "gallery-item overflow-hidden rounded-lg shadow-lg";
        div.innerHTML = `
            <img src="${photo.url}" alt="${photo.caption}" class="w-full h-full object-cover transform hover:scale-110 transition duration-500">
            <button data-id="${photo.id}" class="delete-photo-btn admin-controls-inline bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
        `;
        galleryGrid.appendChild(div);
    });
}

function renderCommunitySlider() {
    if (!communitySwiperWrapper) return;
    communitySwiperWrapper.innerHTML = "";
    if (initialCommunityItems.length === 0) {
        communitySwiperWrapper.innerHTML = `<div class="swiper-slide flex items-center justify-center bg-gray-100 text-gray-500 p-4 rounded-lg">No community events to show.</div>`;
    } else {
        initialCommunityItems.forEach(item => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            let headlineHTML = "";
            if (item.type === "charity" && item.amountRaised && item.charityName) {
                headlineHTML = `<h3 class="font-bold text-primary text-xl mb-2">Amount Raised: ${item.amountRaised} for ${item.charityName}</h3>`;
            } else if (item.type === "community" && item.headline) {
                headlineHTML = `<h3 class="font-bold text-primary text-xl mb-2">${item.headline}</h3>`;
            }
            slide.innerHTML = `
                <div class="bg-white overflow-hidden border border-gray-200 h-full">
                    <div class="relative community-image-container">
                        <img src="${item.imageUrl}" alt="${item.description.substring(0,50)}">
                        <div class="slide-admin-controls admin-controls-inline space-x-2">
                            <button data-id="${item.id}" class="edit-community-btn bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                            <button data-id="${item.id}" class="delete-community-btn bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg></button>
                        </div>
                    </div>
                    <div class="p-6">${headlineHTML}<p class="text-gray-600">${item.description}</p></div>
                </div>`;
            communitySwiperWrapper.appendChild(slide);
        });
    }
    initCarousels();
}


// --- EVENT LISTENERS & HANDLERS ---

function setupEventListeners() {
    document.getElementById("menu-btn").addEventListener("click", () => document.getElementById("mobile-menu").classList.toggle("hidden"));
    document.querySelectorAll("#mobile-menu a").forEach(link => link.addEventListener("click", () => document.getElementById("mobile-menu").classList.add("hidden")));
    document.getElementById("admin-mode-btn").addEventListener("click", handleAdminClick);
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("exit-admin-btn")) {
            sessionStorage.removeItem("gjc_isAdmin");
            toggleAdminMode(false);
        }
    });
}


// --- UTILITY & FORMATTING ---

function parseJamDate(dateStr) {
    const year = new Date().getFullYear();
    const dateWithYear = dateStr.replace(":", "").trim() + ` ${year}`;
    let parsedDate = new Date(dateWithYear);
    if ( isNaN(parsedDate.getTime()) ) return new Date('1970-01-01'); // Invalid date
    // If the parsed date is more than 6 months in the past, assume it's for the next year.
    if (parsedDate < new Date() && (new Date().getTime() - parsedDate.getTime()) > (180 * 24 * 60 * 60 * 1000) ) {
       parsedDate.setFullYear(year + 1);
    }
    return parsedDate;
}

function formatJamDateForDisplay(dateObj) {
    return `${dateObj.getDate()} ${dateObj.toLocaleString("default", { month: "short" })}`;
}

function formatJamDateForStorage(dateObj) {
    return `${formatJamDateForDisplay(dateObj)}:`;
}

function formatTime(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!parts) return timeStr;

    let hours = parseInt(parts[1], 10);
    const minutes = parseInt(parts[2], 10);
    let ampm = parts[3] ? parts[3].toUpperCase() : (hours >= 12 ? 'PM' : 'AM');

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    const displayAmpm = hours >= 12 ? 'PM' : 'AM';
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${displayAmpm}`;
}

// --- INITIALIZATION ---

function initDatePickers() {
    if (jamDateInput) {
        jamDatePicker = flatpickr(jamDateInput, {
          dateFormat: "j M Y",
          onChange: (selectedDates) => {
              if (selectedDates.length > 0) {
                  jamDayInput.value = dayNames[selectedDates[0].getDay()];
              }
          },
        });
    }
    if (jamTimeInput) {
        jamTimePicker = flatpickr(jamTimeInput, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "h:i K",
          defaultDate: "3:00 PM",
          disableMobile: true, 
        });
    }
    if (eventDatesInput) {
        eventDatePicker = flatpickr(eventDatesInput, {
          mode: "range",
          dateFormat: "j M Y",
           onClose: (selectedDates, dateStr, instance) => {
                if (selectedDates.length === 1) {
                    const date = selectedDates[0];
                    instance.input.value = `${dayNames[date.getDay()]}, ${date.getDate()} ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
                } else if (selectedDates.length === 2) {
                    const start = selectedDates[0];
                    const end = selectedDates[1];
                    const format = (date) => `${dayNames[date.getDay()]}, ${date.getDate()} ${date.toLocaleString("default", { month: "short" })}`;
                    instance.input.value = `${format(start)} - ${format(end)} ${end.getFullYear()}`;
                }
           }
        });
    }
    if (testDateInput) {
        testDatePicker = flatpickr(testDateInput, { dateFormat: "Y-m-d" });
    }
}

function initCarousels() {
    if (document.querySelector('.festival-carousel .swiper-slide')) {
         new Swiper(".festival-carousel", {
            loop: true,
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: ".swiper-pagination", clickable: true },
            slidesPerView: 2,
            spaceBetween: 20,
            breakpoints: {
                640: { slidesPerView: 3, spaceBetween: 30 },
                1024: { slidesPerView: 5, spaceBetween: 50 },
            },
        });
    }

    if (communitySwiper) communitySwiper.destroy(true, true);
    if (document.querySelector('.community-swiper .swiper-slide')) {
        communitySwiper = new Swiper(".community-swiper", {
          effect: "fade",
          fadeEffect: { crossFade: true },
          loop: initialCommunityItems.length > 1,
          autoplay: { delay: 6000, disableOnInteraction: false },
          pagination: { el: ".swiper-pagination", clickable: true },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
    }
}
