const findLocationBtn=document.getElementById('find-my-location-btn');
const searchMapBtn = document.getElementById('search-map-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorDisplay=document.getElementById('location-error');
const cafeCardsContainer = document.getElementById('cafe-cards-container');
const showSavedBtn = document.getElementById('show-saved-btn');
let map = null;
let userLocation = null;
const markers =[];

function initializeLeafletMap(center){
    console.log("Attempting to initialize Leaflet map...");
    const mapElement = document.getElementById('map');
    
    if (!mapElement) {
        console.error("CRITICAL ERROR: Could not find the div with id='map'.");
       
        return; 
    }
    if(map){
        map.remove();

    }

    map = L.map('map').setView([center.lat,center.lng],13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('moveend', () => {
        
        searchMapBtn.classList.remove('hidden'); 
    });
}

const defaultMumbaiCenter = { lat:19.0760 , lng:72.8777};
initializeLeafletMap(defaultMumbaiCenter);

findLocationBtn.addEventListener('click', () => { 
    
    errorDisplay.textContent = ''; 
    cafeCardsContainer.innerHTML = ''; 
    
    
    loadingSpinner.classList.remove('hidden');
    findLocationBtn.disabled = true; 

    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0; 

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,   
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
       
    }
});

searchMapBtn.addEventListener('click', () => {
    
    const center = map.getCenter();
    const mapLocation = { lat: center.lat, lng: center.lng };
    
   
    errorDisplay.textContent = '';
    cafeCardsContainer.innerHTML = '';
    loadingSpinner.classList.remove('hidden');
    
    searchForCafes(mapLocation);
    searchMapBtn.classList.add('hidden'); 
});

function successCallback(position){
    userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    
    };

    map.setView([userLocation.lat , userLocation.lng],14);
    searchForCafes(userLocation);
    
}

function errorCallback(error) {
    loadingSpinner.classList.add('hidden');
    findLocationBtn.disabled = false;

    let message = "An unknown error occurred.";
    if (error.code === error.PERMISSION_DENIED) {
        message = "Location access denied. Please enable location services in your browser.";
    } else if (error.code === error.TIMEOUT) {
        message = "The request to get user location timed out.";
    }
    errorDisplay.textContent = `Error: ${message}`;
}

function searchForCafes(location) {
    
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        loadingSpinner.classList.add('hidden');
        findLocationBtn.disabled = false;
        errorDisplay.textContent = "Error: Geolocation data is invalid. Please try again.";
        return; 
    }

    const latOffset = 0.05;
    const lngOffset = 0.05;

    const latMin = location.lat - latOffset;
    const latMax = location.lat + latOffset;
    const lngMin = location.lng - lngOffset;
    const lngMax = location.lng + lngOffset;
    
   
    const viewbox = `${lngMin},${latMin},${lngMax},${latMax}`;

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&viewbox=${viewbox}&bounded=1&limit=10&amenity=cafe`;

    fetch(nominatimUrl, { 
            headers: {
              'User-Agent': 'CozyCornerCafeFinder (personal project testing)' 
            }
    })
        
    .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok. Status: ' + response.status);
            }
            return response.json();
    })
    .then(data => {
            loadingSpinner.classList.add('hidden');
            findLocationBtn.disabled = false;

            if (data.length > 0) {
                displayResults(data); 
            } else {
                errorDisplay.textContent = "No cafes found nearby on OpenStreetMap. Try a different area or keyword.";
            }
    })
    .catch(error => {
            loadingSpinner.classList.add('hidden');
            findLocationBtn.disabled = false;
            
            errorDisplay.textContent = `Error searching for places: ${error.message}.`;
            console.error('Fetch error:', error);
    });
}

function loadSavedCafes() {
    const savedCafes = JSON.parse(localStorage.getItem('savedCafes')) || [];
    return savedCafes;
} 

function toggleSave(button, cafeData) {
    const uniqueKey = `${cafeData.lat}-${cafeData.lng}`;
    let savedCafes = loadSavedCafes();
    const isSaved = savedCafes.some(c => `${c.lat}-${c.lng}` === uniqueKey);
    
    if (isSaved) {
        
        savedCafes = savedCafes.filter(c => `${c.lat}-${c.lng}` !== uniqueKey);
        button.innerHTML = 'Save to Favorites <span class="heart-icon">🤍</span>';
    } else {
       
        savedCafes.push(cafeData);
        button.innerHTML = 'Saved! <span class="heart-icon">❤️</span>';
    }
    
    
    localStorage.setItem('savedCafes', JSON.stringify(savedCafes));
}

function displayResults(places) {
    places.forEach((place, index) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        
        
        const name = place.address?.amenity || 
             place.address?.shop || 
             place.address?.building || 
             place.display_name.split(',')[0] || 
             `Cafe ${index + 1}`;        
        
        const address = place.display_name.split(',').slice(1, 4).map(s => s.trim()).join(', ');


        const rating = (Math.random() * (5 - 3) + 3).toFixed(1); 

         

        const cafeCard = document.createElement('div');
        cafeCard.classList.add('cafe-card');
        
        const cafeData = { name, address, lat, lng };

        // Check if saved to set initial button state
        const isSavedInitial = loadSavedCafes().some(c => c.lat === cafeData.lat && c.lng === cafeData.lng);
        const initialIcon = isSavedInitial ? '❤️' : '🤍';
        const initialText = isSavedInitial ? 'Saved!' : 'Save to Favorites';

        cafeCard.innerHTML = `
           
            <div class="cafe-card-details">
                <h3 class="cafe-card-name">${name}</h3>
                <p class="cafe-card-rating"><span>⭐</span>Rating: ${rating}</p>
                <button class="save-btn" data-name="${name}" data-lat="${lat}" data-lng="${lng}">
                 Save to Favorites <span class="heart-icon">🤍</span>
                </button>
                <small>Location: ${address}</small>
            </div>
        `;
        cafeCardsContainer.appendChild(cafeCard);
       
        const saveBtn = cafeCard.querySelector('.save-btn');
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleSave(saveBtn, cafeData);
        });

        // Map Marker Logic
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`<strong>${name}</strong><br>${address}`);
        markers.push(marker);
        
        cafeCard.addEventListener('click', () => {
            map.setView([lat, lng], 16);
            marker.openPopup(); 
        });
    });
}

function renderSavedCafes() {
    const savedCafes = loadSavedCafes();

    errorDisplay.textContent = '';
    cafeCardsContainer.innerHTML = '';
    
    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0; 
    
    if (savedCafes.length === 0) {
        errorDisplay.textContent = "You have no saved favorites yet! Find some cozy spots and save them.";
        return;
    }

    if (savedCafes.length > 0) {
        const firstCafe = savedCafes[0];
        map.setView([firstCafe.lat, firstCafe.lng], 14);
    }

    savedCafes.forEach((cafe) => {
        const cafeCard = document.createElement('div');
        cafeCard.classList.add('cafe-card');
        
        const cafeData = { name: cafe.name, address: cafe.address, lat: cafe.lat, lng: cafe.lng };
        
        cafeCard.innerHTML = `
            <div class="cafe-card-details">
                <h3 class="cafe-card-name">${cafe.name}</h3>
                <small>Location: ${cafe.address}</small>
                <button class="save-btn remove-btn" data-lat="${cafe.lat}" data-lng="${cafe.lng}">
                    Remove <span class="heart-icon">❌</span>
                </button>
            </div>
        `;
        cafeCardsContainer.appendChild(cafeCard);
        
        // Attach remove listener
        const removeBtn = cafeCard.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSave(removeBtn, cafeData);
            renderSavedCafes(); // Re-render the list after removal
        });

        // Add map marker
        const marker = L.marker([cafe.lat, cafe.lng]).addTo(map);
        marker.bindPopup(`<strong>${cafe.name}</strong>`).openPopup();
        markers.push(marker);
        
        cafeCard.addEventListener('click', () => {
            map.setView([cafe.lat, cafe.lng], 14);
        });
    });
}
        

showSavedBtn.addEventListener('click', renderSavedCafes);            