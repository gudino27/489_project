import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Home, Bath, Sparkles } from 'lucide-react';

const WebsiteGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      // Load from localStorage for demo
      const savedPhotos = localStorage.getItem('cabinetPhotos');
      if (savedPhotos) {
        setPhotos(JSON.parse(savedPhotos));
      } else {
        // Default demo photos
        setPhotos([
          { id: 1, category: 'kitchen', title: 'Modern White Kitchen', url: '/api/placeholder/800/600', featured: true },
          { id: 2, category: 'kitchen', title: 'Traditional Oak Kitchen', url: '/api/placeholder/800/600', featured: false },
          { id: 3, category: 'bathroom', title: 'Luxury Master Bath', url: '/api/placeholder/800/600', featured: true },
          { id: 4, category: 'bathroom', title: 'Guest Bathroom Vanity', url: '/api/placeholder/800/600', featured: false },
          { id: 5, category: 'showcase', title: 'Custom Entertainment Center', url: '/api/placeholder/800/600', featured: true },
        ]);
      }

      // In production:
      // const response = await fetch('/api/photos');
      // const data = await response.json();
      // setPhotos(data);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = photos.filter(photo => 
    selectedCategory === 'all' || photo.category === selectedCategory
  );

  const featuredPhotos = photos.filter(photo => photo.featured);

  const openLightbox = (photo, index) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const navigatePhoto = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % filteredPhotos.length
      : (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    
    setCurrentIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const categoryIcons = {
    kitchen: <Home size={16} />,
    bathroom: <Bath size={16} />,
    showcase: <Sparkles size={16} />
  };

  const categoryNames = {
    kitchen: 'Kitchen Cabinets',
    bathroom: 'Bathroom Vanities',
    showcase: 'Custom Work'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Our Portfolio</h1>
          <p className="text-xl opacity-90">
            Explore our collection of custom cabinets and woodwork
          </p>
        </div>
      </div>

      {/* Featured Gallery */}
      {featuredPhotos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Projects</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPhotos.slice(0, 3).map((photo, index) => (
              <div 
                key={photo.id}
                className="group relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => openLightbox(photo, photos.indexOf(photo))}
              >
                <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Featured
                </div>
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-semibold mb-2">{photo.title}</h3>
                    <p className="text-sm opacity-90 capitalize">{photo.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 shadow hover:shadow-md'
            }`}
          >
            All Projects
          </button>
          {Object.entries(categoryNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 shadow hover:shadow-md'
              }`}
            >
              {categoryIcons[key]}
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {filteredPhotos.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
                onClick={() => openLightbox(photo, index)}
              >
                <div className="aspect-w-4 aspect-h-3">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-3">
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-medium text-gray-800">{photo.title}</h3>
                  <p className="text-sm text-gray-500 capitalize flex items-center gap-1 mt-1">
                    {categoryIcons[photo.category]}
                    {photo.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No photos available in this category.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>

          <button
            onClick={() => navigatePhoto('prev')}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft size={48} />
          </button>

          <div className="max-w-5xl max-h-[90vh] relative">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h3 className="text-2xl font-semibold mb-2">{selectedPhoto.title}</h3>
              <p className="text-lg opacity-90 capitalize">{categoryNames[selectedPhoto.category]}</p>
            </div>
          </div>

          <button
            onClick={() => navigatePhoto('next')}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {filteredPhotos.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Space?</h2>
          <p className="text-xl mb-8 opacity-90">
            Let us create custom cabinets that perfectly fit your style and needs
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transform hover:scale-105 transition-all"
          >
            Start Your Design
          </a>
        </div>
      </div>
    </div>
  );
};

export default WebsiteGallery;