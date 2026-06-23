/**
 * js/detail/auction-logic.js
 * Módulo para inicializar la lógica de cuenta regresiva y pujas en la vista de detalle.
 */

export function initAuctionLogic(auction, requireAuth, formatPrice) {
    const countdownEl = document.getElementById('auction-countdown');
    const submitBtn = document.getElementById('btn-submit-bid');
    const inputAmount = document.getElementById('auction-bid-amount');
    const currentPriceEl = document.getElementById('auction-current-price');
    
    if (!countdownEl || !submitBtn || !inputAmount) return;

    const endsAt = new Date(auction.endsAt).getTime();
    
    // Socket.IO Setup
    let socket = null;
    if (typeof window.io !== 'undefined') {
        const baseUrl = (window.ENV && window.ENV.API_BASE_URL) ? window.ENV.API_BASE_URL : 'http://localhost:3000/api';
        const socketUrl = baseUrl.replace('/api', '');
        socket = window.io(socketUrl);

        socket.emit('joinAuction', { auctionId: auction.id });

        socket.on('newBid', (data) => {
            currentPriceEl.textContent = `u$s ${formatPrice ? formatPrice(data.currentPrice) : data.currentPrice.toLocaleString()}`;
            inputAmount.min = data.currentPrice + 100;
            inputAmount.placeholder = `Monto (mín. ${data.currentPrice + 100})`;
            
            // Visual highlight effect
            currentPriceEl.style.transition = 'color 0.3s ease';
            currentPriceEl.style.color = 'var(--success)';
            setTimeout(() => {
                currentPriceEl.style.color = 'var(--white)';
            }, 1000);
        });

        socket.on('auctionEnded', (data) => {
            if (interval) clearInterval(interval);
            countdownEl.textContent = "FINALIZADA";
            countdownEl.style.color = "var(--error)";
            submitBtn.disabled = true;
            submitBtn.textContent = "SUBASTA CERRADA";
            inputAmount.disabled = true;
            currentPriceEl.textContent = `u$s ${formatPrice ? formatPrice(data.finalPrice) : data.finalPrice.toLocaleString()}`;
        });
    }

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = endsAt - now;

        if (distance < 0) {
            clearInterval(interval);
            countdownEl.textContent = "FINALIZADA";
            countdownEl.style.color = "var(--error)";
            submitBtn.disabled = true;
            submitBtn.textContent = "SUBASTA CERRADA";
            inputAmount.disabled = true;
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        timeStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        countdownEl.textContent = timeStr;

        if (distance < 1000 * 60 * 60) {
            countdownEl.style.color = "var(--error)";
        } else if (distance < 1000 * 60 * 60 * 24) {
            countdownEl.style.color = "var(--warning)";
        } else {
            countdownEl.style.color = "var(--success)";
        }
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

    submitBtn.addEventListener('click', async () => {
        const session = typeof requireAuth === 'function' ? requireAuth() : null;
        if (!session) return;
        
        const amount = parseFloat(inputAmount.value);
        if (isNaN(amount)) {
            alert("Ingrese un monto válido.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "PROCESANDO...";

        try {
            const API_URL = (window.ENV && window.ENV.API_BASE_URL) ? window.ENV.API_BASE_URL : 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/auctions/${auction.id}/bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al enviar puja');
            }

            // Puja exitosa
            currentPriceEl.textContent = `u$s ${formatPrice ? formatPrice(data.auction.currentPrice) : data.auction.currentPrice.toLocaleString()}`;
            inputAmount.value = "";
            inputAmount.placeholder = `Monto (mín. ${data.auction.currentPrice + 100})`;
            inputAmount.min = data.auction.currentPrice + 100;
            
            // Mostrar feedback limpio sin emojis
            submitBtn.textContent = "PUJA REGISTRADA";
            submitBtn.style.backgroundColor = "var(--success)";
            
            setTimeout(() => {
                submitBtn.textContent = "ENVIAR PUJA";
                submitBtn.style.backgroundColor = "";
                submitBtn.disabled = false;
            }, 3000);

        } catch (err) {
            alert(err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "ENVIAR PUJA";
        }
    });
}
