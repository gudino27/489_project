 const baseUrl = location.hostname === "localhost:3000/designer"
    ? "http://localhost:3000/designer"
    : "https://gudinocustom.com/designer";
 function hideLoading() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('react-app').style.display = 'block';
        }

        function showError() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'flex';
        }

        // Auto-retry connection every 5 seconds if failed
        let retryCount = 0;
        const maxRetries = 12; // Try for 1 minute

        function checkConnection() {
            if (retryCount < maxRetries) {
                fetch(baseURL)
                    .then(response => {
                        if (response.ok) {
                            location.reload();
                        }
                    })
                    .catch(() => {
                        retryCount++;
                        setTimeout(checkConnection, 5000);
                    });
            }
        }

        // Start checking after 3 seconds (3000 milliseconds)
        setTimeout(() => {
            if (document.getElementById('loading').style.display !== 'none') {
                checkConnection();
            }
        }, 3000);