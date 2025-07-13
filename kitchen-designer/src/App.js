import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import KitchenDesigner from './desinger';
import React, { useEffect } from 'react';
import './App.css';

// Component imports for different app sections
import AdminPanel from './AdminPanel';         // Admin pricing and photo management
import DesignPreview from './DesignPreview'; // Preview of design before submission

const HomeRedirect = () => {
  // This will cause a full page reload
  window.location.href = '/pages/home.html';
  return null;
};
const StaticPage = ({ htmlFile }) => {
  useEffect(() => {
    fetch(`/pages/${htmlFile}`)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const bodyContent = doc.body.innerHTML;
        const headContent = doc.head;

        // Load CSS styles
        const links = headContent.querySelectorAll('link[rel="stylesheet"]');
        const cssPromises = [];

        links.forEach(link => {
          if (!document.querySelector(`link[href="${link.href}"]`)) {
            const newLink = link.cloneNode(true);
            const promise = new Promise((resolve, reject) => {
              newLink.onload = resolve;
              newLink.onerror = reject;
              document.head.appendChild(newLink);
            });
            cssPromises.push(promise);
          }
        });

        // Strip scripts from HTML body so we don’t auto-duplicate when injecting
        const cleanedBody = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');
        document.getElementById('static-content').innerHTML = cleanedBody;

        // After CSS loads, load scripts
        Promise.all(cssPromises).then(() => {
          setTimeout(() => {
            loadScripts(doc);
          }, 100);
        });
      })
      .catch(error => console.error('Error loading page:', error));
  }, [htmlFile]);

  const loadScripts = (doc) => {
    const scripts = doc.querySelectorAll('script');
    const scriptPromises = [];

    scripts.forEach(script => {
      if (script.src) {
        if (!document.querySelector(`script[src="${script.src}"]`)) {
          const promise = new Promise((resolve, reject) => {
            const newScript = document.createElement('script');
            newScript.src = script.src;
            newScript.async = false;
            newScript.onload = () => {
              console.log(`Loaded external script: ${script.src}`);
              resolve();
            };
            newScript.onerror = (e) => {
              console.error(`Failed to load script: ${script.src}`, e);
              reject(e);
            };
            document.body.appendChild(newScript);
          });
          scriptPromises.push(promise);
        }
      } else if (script.textContent) {
        // Save inline scripts to run after all externals are loaded
        scriptPromises.push(Promise.resolve(script.textContent));
      }
    });

    // When all external scripts are ready, run inline scripts
    Promise.all(scriptPromises).then(inlineScripts => {
      inlineScripts.forEach(scriptContent => {
        if (typeof scriptContent === 'string') {
          try {
            new Function(scriptContent)();
          } catch (e) {
            console.error('Error executing inline script:', e);
          }
        }
      });
    });
  };

  return <div id="static-content">{/* Fetched HTML content will be injected here */}</div>;
};

// -----------------------------
// Top-Level App Component
// Main application component that handles routing between different sections
// Uses React Router to navigate between design tool, admin panel, and photo gallery
// -----------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* Clean URLs that serve static pages*/}
        {/* <Route path="/" element={<HomeRedirect />} /> */}
        <Route path="/" element={<StaticPage htmlFile="home.html" />} />
        <Route path="/about" element={<StaticPage htmlFile="about.html" />} />
        <Route path="/contact" element={<StaticPage htmlFile="contact.html" />} />
        <Route path="/design" element={<StaticPage htmlFile="design.html" />} />
        <Route path="/portfolio" element={<StaticPage htmlFile="portfolio.html" />} />
        {/* React Components*/}
        <Route path="/designer" element={<KitchenDesigner />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/designpreview" element={<DesignPreview />} />
      </Routes>
    </Router>
  );
}

// Export the main App component as default
export default App;
