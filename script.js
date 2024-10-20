let currentIndex = 0;
let images = [];
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const imageInput = document.getElementById('imageInput');
const imageTitle = document.getElementById('imageTitle');
const addImageBtn = document.getElementById('addImageBtn');
const gallery = document.querySelector('.gallery');

// Initialize IndexedDB
const request = indexedDB.open('PhotoGalleryDB', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = function(event) {
    const db = event.target.result;
    loadImages(db); // Load images when the database is successfully opened
};

addImageBtn.addEventListener('click', function() {
    const file = imageInput.files[0];
    const title = imageTitle.value.trim();
    if (file && title) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgData = e.target.result;
            saveImageToDB(imgData, title); // Save image and title to DB
            imageTitle.value = ''; // Clear the title input
            imageInput.value = '';  // Clear the file input
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please enter a title and select an image.");
    }
});

// Function to save an image to IndexedDB
function saveImageToDB(imgData, title) {
    const request = indexedDB.open('PhotoGalleryDB', 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.add({ data: imgData, title: title });

        transaction.oncomplete = function() {
            loadImages(db); // Reload images to reflect the changes
        };
    };
}

// Function to load images from IndexedDB
function loadImages(db) {
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.getAll();

    request.onsuccess = function(event) {
        images = event.target.result; // Store images in the array
        displayImages(); // Display images in the gallery
    };
}

// Function to display images in the gallery
function displayImages() {
    gallery.innerHTML = ''; // Clear the gallery
    images.forEach((img, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const imageElement = document.createElement('img');
        imageElement.src = img.data;
        imageElement.alt = img.title;
        imageElement.classList.add('gallery-item');
        imageElement.onclick = () => openLightbox(img.data, index); // Pass the index for navigation

        const titleElement = document.createElement('div');
        titleElement.classList.add('image-title');
        titleElement.innerText = img.title;

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.onclick = () => deleteImage(img.id); // Use img.id for deletion

        imageContainer.appendChild(imageElement);
        imageContainer.appendChild(titleElement);
        imageContainer.appendChild(deleteButton);
        gallery.appendChild(imageContainer);
    });
}

// Function to open the lightbox
function openLightbox(src, index) {
    lightbox.style.display = 'flex';
    lightboxImg.src = src;
    currentIndex = index; // Set the current index for navigation
}

// Function to close the lightbox
function closeLightbox() {
    lightbox.style.display = 'none';
}

// Function to change the image in the lightbox
function changeImage(direction) {
    currentIndex += direction;
    if (currentIndex < 0) {
        currentIndex = images.length - 1; // Loop back to the last image
    } else if (currentIndex >= images.length) {
        currentIndex = 0; // Loop back to the first image
    }
    lightboxImg.src = images[currentIndex].data; // Change the image source
}

// Function to delete an image from IndexedDB
function deleteImage(id) {
    const request = indexedDB.open('PhotoGalleryDB', 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.delete(id); // Delete the image by ID

        transaction.oncomplete = function() {
            loadImages(db); // Reload images to reflect the changes
        };
    };
}

// Lightbox navigation event listeners
document.querySelector('.close').onclick = closeLightbox;
document.querySelector('.prev').onclick = () => changeImage(-1);
document.querySelector('.next').onclick = () => changeImage(1);
