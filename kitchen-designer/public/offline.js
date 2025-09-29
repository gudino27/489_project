// Check connection status
        function updateStatus() {
            const status = document.getElementById('status');
            if (navigator.onLine) {
                status.textContent = 'Connection restored! You can refresh the page.';
                status.style.color = '#10b981';
            } else {
                status.textContent = 'Still offline. Some cached content may be available.';
                status.style.color = '#f59e0b';
            }
        }

        function retryConnection() {
            if (navigator.onLine) {
                // Connection is back, try to reload
                window.location.reload();
            } else {
                // Still offline, but attempt reload anyway
                // (service worker might have cached content)
                window.location.reload();
            }
        }

        // Listen for online/offline events
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        // Initial status check
        updateStatus();

        // Auto-retry connection every 30 seconds
        setInterval(() => {
            if (navigator.onLine) {
                window.location.reload();
            }
        }, 30000);