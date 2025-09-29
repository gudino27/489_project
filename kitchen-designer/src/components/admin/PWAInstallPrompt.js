import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle, ArrowRight } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;

    if (isInstalled) {
      setIsInstalled(true);
      return;
    }

    // Check if user already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Check if deferred prompt is already available from index.html
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setShowPrompt(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss(true);
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = (permanent = false) => {
    setShowPrompt(false);

    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'true');
      setDismissed(true);
    }
  };

  const handleShow = () => {
    localStorage.removeItem('pwa-install-dismissed');
    setDismissed(false);
    setShowPrompt(true);
  };

  // Don't show if installed or permanently dismissed
  if (isInstalled || dismissed) {
    return (
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          {isInstalled ? (
            <>
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <h3 className="text-sm font-medium text-green-800">App Installed</h3>
                <p className="text-sm text-green-600">
                  You're using the installed PWA! Enjoy faster performance and improved mobile experience.
                </p>
              </div>
            </>
          ) : (
            <>
              <Smartphone className="text-gray-600" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-800">Install Admin App</h3>
                <p className="text-sm text-gray-600">
                  Install as an app for better mobile experience.
                </p>
              </div>
              <button
                onClick={handleShow}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Show Options
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Don't show if no deferred prompt and not showing
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
      {/* Close button */}
      <button
        onClick={() => handleDismiss(false)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
        title="Close"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Smartphone className="text-blue-600" size={20} />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Install Gudino Admin App
          </h3>

          <p className="text-sm text-blue-700 mb-3">
            Install this app on your iPhone for a better mobile experience with faster loading and improved performance.
          </p>

          <div className="text-xs text-blue-600 mb-3">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle size={12} />
              <span>Faster loading with intelligent caching</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle size={12} />
              <span>View cached data when connection is poor</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle size={12} />
              <span>Full-screen native app experience</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling || !deferredPrompt}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[40px] justify-center"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Install App
                </>
              )}
            </button>

            <button
              onClick={() => handleDismiss(true)}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[40px]"
            >
              Not Now
            </button>
          </div>

          {/* Manual installation instructions for browsers that don't support prompt */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <details className="text-xs text-blue-600">
              <summary className="cursor-pointer hover:text-blue-700 font-medium">
                Manual installation instructions
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <strong>On iPhone Safari:</strong>
                  <ol className="ml-3 mt-1 space-y-1">
                    <li>1. Tap the share button <span className="inline-block w-3 h-3 bg-blue-200 rounded"></span></li>
                    <li>2. Scroll down and tap "Add to Home Screen"</li>
                    <li>3. Tap "Add" to install the app</li>
                  </ol>
                </div>
                <div>
                  <strong>On Chrome/Edge:</strong>
                  <ol className="ml-3 mt-1 space-y-1">
                    <li>1. Tap the menu (⋮) button</li>
                    <li>2. Tap "Add to Home screen"</li>
                    <li>3. Tap "Add" to install</li>
                  </ol>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;