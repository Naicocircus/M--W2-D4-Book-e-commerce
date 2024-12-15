// Attende che il DOM sia completamente caricato prima di eseguire il codice
document.addEventListener('DOMContentLoaded', () => {
    // Definizione degli stati dell'applicazione
    // Array che conterrà tutti i libri caricati dall'API
    let books = [];
    // Array che conterrà gli elementi nel carrello
    let cartItems = [];
    
    // Selezione degli elementi DOM necessari
    const booksContainer = document.getElementById('booksContainer'); // Container per i libri
    const searchInput = document.querySelector('.search-container input'); // Input di ricerca
    const cartItemsContainer = document.getElementById('cartItems'); // Container items carrello
    const cartTotal = document.getElementById('cartTotal'); // Elemento per il totale carrello
    const cartCount = document.querySelector('.cart-count'); // Badge contatore carrello

    // Funzione asincrona per recuperare i libri dall'API
    const fetchBooks = async () => {
        try {
            // Chiamata API per ottenere i libri
            const response = await fetch('https://striveschool-api.herokuapp.com/books');
            books = await response.json();
            renderBooks(books); // Renderizza i libri ottenuti
        } catch (error) {
            // Gestione degli errori durante il caricamento
            console.error('Errore nel caricamento dei libri:', error);
            booksContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Si è verificato un errore nel caricamento dei libri.</p>
                </div>
            `;
        }
    };

    // Funzione per renderizzare le card dei libri
    const renderBooks = (booksToRender) => {
        booksContainer.innerHTML = booksToRender.map(book => `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                <div class="card h-100 ${isInCart(book.asin) ? 'border-success' : ''} shadow-hover">
                    <img src="${book.img}" class="card-img-top" alt="${book.title}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-truncate">${book.title}</h5>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <p class="card-text mb-0">€${book.price}</p>
                            <button 
                                class="btn btn-danger btn-sm"
                                onclick="this.closest('.col-12').remove()"
                            >
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                        <div class="mt-auto">
                            <button 
                                class="btn ${isInCart(book.asin) ? 'btn-success' : 'btn-primary'} w-100 mb-2"
                                onclick="handleAddToCart('${book.asin}')"
                            >
                                ${isInCart(book.asin) ? 'Nel carrello' : 'Aggiungi al carrello'}
                            </button>
                            <button 
                                class="btn btn-outline-secondary w-100"
                                onclick="handleShowDetails('${book.asin}')"
                            >
                                Dettagli
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    // Funzione per gestire l'aggiunta di un libro al carrello
    const handleAddToCart = (asin) => {
        // Trova il libro nell'array dei libri
        const book = books.find(b => b.asin === asin);
        if (!book) return;

        // Controlla se il libro è già nel carrello
        const existingItem = cartItems.find(item => item.asin === asin);
        if (existingItem) {
            existingItem.quantity += 1; // Incrementa la quantità
        } else {
            cartItems.push({ ...book, quantity: 1 }); // Aggiunge il libro al carrello
        }

        updateCart(); // Aggiorna il carrello
        renderBooks(books); // Aggiorna la visualizzazione delle card
    };

    // Funzione per rimuovere un libro dal carrello
    const removeFromCart = (asin) => {
        cartItems = cartItems.filter(item => item.asin !== asin);
        updateCart();
        renderBooks(books);
    };

    // Funzione per aggiornare la visualizzazione del carrello
    const updateCart = () => {
        // Calcola il numero totale di items
        const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        
        // Aggiorna TUTTI i contatori del carrello (sia mobile che desktop)
        document.querySelectorAll('.cart-count').forEach(counter => {
            counter.textContent = totalItems;
            
            // Mostra/nascondi il badge in base al numero di items
            if (totalItems === 0) {
                counter.style.display = 'none';
            } else {
                counter.style.display = 'flex';
            }
        });

        // Aggiorna il contenuto del modale del carrello
        cartItemsContainer.innerHTML = cartItems.map(item => `
            <div class="d-flex align-items-center mb-3">
                <img src="${item.img}" alt="${item.title}" style="width: 50px; height: 70px; object-fit: cover;">
                <div class="ms-3 flex-grow-1">
                    <h6 class="mb-0">${item.title}</h6>
                    <p class="mb-0">€${item.price} x ${item.quantity}</p>
                </div>
                <button 
                    class="btn btn-danger btn-sm ms-2"
                    onclick="removeFromCart('${item.asin}')"
                >
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('') || '<p class="text-center">Il carrello è vuoto</p>';

        // Calcola e aggiorna il totale del carrello
        const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        cartTotal.textContent = `€${total.toFixed(2)}`;
    };

    // Funzione per gestire la ricerca dei libri
    const handleSearch = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        if (searchTerm.length >= 3) {
            // Filtra i libri se il termine di ricerca è >= 3 caratteri
            const filteredBooks = books.filter(book => 
                book.title.toLowerCase().includes(searchTerm)
            );
            renderBooks(filteredBooks);
        } else {
            renderBooks(books); // Mostra tutti i libri
        }
    };

    // Funzione helper per verificare se un libro è nel carrello
    const isInCart = (asin) => {
        return cartItems.some(item => item.asin === asin);
    };

    // Aggiunta degli event listener
    searchInput.addEventListener('input', handleSearch);

    // Rende le funzioni disponibili globalmente per l'uso negli onclick
    window.handleAddToCart = handleAddToCart;
    window.removeFromCart = removeFromCart;

    // Avvia il caricamento dei libri
    fetchBooks();

    // Gestione del click su "Procedi all'acquisto" nel modale carrello
    document.querySelector('#cartModal .btn-primary').addEventListener('click', () => {
        // Chiudi il modale del carrello
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        cartModal.hide();
        
        // Apri il modale del pagamento
        setTimeout(() => {
            const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
            paymentModal.show();
        }, 500);
    });

    // Funzione per gestire il processo di pagamento
    const handlePayment = () => {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Chiudi il modale di pagamento
        const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        paymentModal.hide();
        
        // Mostra il modale di conferma
        setTimeout(() => {
            const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
            confirmationModal.show();
        }, 500);
        
        // Svuota il carrello
        cartItems = [];
        updateCart();
        
        // Resetta lo stato visivo delle card
        resetCardStates();
    };

    // Nuova funzione per resettare lo stato delle card
    const resetCardStates = () => {
        // Rimuovi la classe border-success da tutte le card
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('border-success');
        });
        
        // Resetta i pulsanti "Aggiungi al carrello"
        document.querySelectorAll('.card .btn-success').forEach(button => {
            button.classList.remove('btn-success');
            button.classList.add('btn-primary');
            button.textContent = 'Aggiungi al carrello';
        });
    };

    // Rendi la funzione disponibile globalmente
    window.handlePayment = handlePayment;

    // Aggiungi event listener per il modale di conferma
    document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', () => {
        // Reindirizza alla home o esegui altre azioni dopo la chiusura
        // window.location.href = '/'; // Decommentare se si vuole reindirizzare
    });

    // Aggiungi la gestione del toggle della sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Chiudi la sidebar quando si clicca fuori
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('show') && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });

    // Aggiungi questa funzione per gestire la visualizzazione dei dettagli
    const handleShowDetails = (asin) => {
        const book = books.find(b => b.asin === asin);
        if (!book) return;

        // Salva il contenuto originale della pagina
        const originalContent = document.body.innerHTML;
        localStorage.setItem('originalContent', originalContent);
        
        // Salva lo stato corrente del carrello e dei libri
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        localStorage.setItem('books', JSON.stringify(books));

        // Crea il contenuto della nuova pagina
        document.body.innerHTML = `
            <div class="container py-5">
                <nav class="mb-4">
                    <button class="btn btn-outline-secondary" onclick="handleBackToHome()">
                        <i class="bi bi-arrow-left me-2"></i>Torna indietro
                    </button>
                </nav>
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <img src="${book.img}" class="img-fluid rounded" alt="${book.title}" 
                             style="max-height: 600px; width: 100%; object-fit: contain;">
                    </div>
                    <div class="col-md-6">
                        <h1 class="display-5 mb-4">${book.title}</h1>
                        <div class="card ">
                            <div class="card-body">
                                <h4 class="mb-4">Dettagli del libro</h4>
                                <ul class="list-unstyled">
                                    <li class="mb-3">
                                        <strong class="d-block mb-1">Codice ASIN</strong>
                                        <span class="text-muted">${book.asin}</span>
                                    </li>
                                    <li class="mb-3">
                                        <strong class="d-block mb-1">Prezzo</strong>
                                        <span class="text-primary fs-4">€${book.price}</span>
                                    </li>
                                    <li class="mb-4">
                                        <strong class="d-block mb-1">Categoria</strong>
                                        <span class="badge bg-secondary">${book.category}</span>
                                    </li>
                                </ul>
                                <button 
                                    class="btn ${isInCart(book.asin) ? 'btn-success' : 'btn-primary'} btn-lg w-50"
                                    onclick="handleAddToCart('${book.asin}')"
                                >
                                    ${isInCart(book.asin) ? 'Nel carrello' : 'Aggiungi al carrello'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Aggiorna il titolo della pagina
        document.title = `${book.title} - Dettagli Libro`;
    };

    // Aggiungi questa nuova funzione per gestire il ritorno alla home
    const handleBackToHome = () => {
        // Ripristina lo stato originale
        document.body.innerHTML = localStorage.getItem('originalContent');
        
        // Ripristina i dati
        cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        books = JSON.parse(localStorage.getItem('books') || '[]');
        
        // Ripristina gli event listener
        initializeEventListeners();
        
        // Aggiorna il carrello
        updateCart();
        
        // Ripristina il titolo originale
        document.title = 'Libreria Online';
    };

    // Funzione per reinizializzare tutti gli event listener
    const initializeEventListeners = () => {
        // Ripristina l'event listener per la ricerca
        const searchInput = document.querySelector('.search-container input');
        searchInput?.addEventListener('input', handleSearch);
        
        // Ripristina l'event listener per il toggle della sidebar
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        
        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
        
       
    };

    // Rendi le funzioni disponibili globalmente
    window.handleShowDetails = handleShowDetails;
    window.handleBackToHome = handleBackToHome;
});
