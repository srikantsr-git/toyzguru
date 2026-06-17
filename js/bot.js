/* ===============================================================
   TOYZGURU CORE AI CHATBOT WIDGET LOGIC
   =============================================================== */

(function () {
  // Prevent double loading
  if (window.ToyzGuruBotInitialized) return;
  window.ToyzGuruBotInitialized = true;

  // Configuration and Knowledge Base
  const BOT_CONFIG = {
    avatar: 'favicon.png', // Fallback to favicon
    name: 'ToyzGuru Core AI',
    welcomeMessage: 'Welcome to **ToyzGuru**! 🤖 I am your AI assistant, ready to help you discover figures, collectibles, and imported watches. You can also track your orders or calculate taxes.\n\nWhat can I help you with today?',
    quickReplies: [
      { text: 'Browse Anime Figures 🔥', action: 'browse_anime' },
      { text: 'Browse Collectible Cars 🏎️', action: 'browse_cars' },
      { text: 'How does GST work? 🧾', action: 'gst_info' },
      { text: 'Track Order 📦', action: 'track_order_prompt' },
      { text: 'Refund & Shipping 🚛', action: 'shipping_refund' },
      { text: 'Talk to Human 💬', action: 'support_ticket' }
    ]
  };

  const POLICY_KNOWLEDGE = {
    shipping: {
      keywords: ['shipping', 'delivery', 'ship', 'dispatch', 'charges', 'fees', 'time', 'duration', 'speed'],
      answer: 'We deliver all across India! 🇮🇳\n\n- **Normal Delivery**: Standard rates vary by state (typically ₹100-₹150). Takes **3-5 business days**.\n- **Express Delivery**: Delivery via premium air courier within **1-2 business days** (charges average ₹250-₹350).\n- All orders are dispatched within **24 hours** from our warehouse. Once dispatched, you will receive a tracking ID to follow the delivery timeline.'
    },
    refund: {
      keywords: ['refund', 'return', 'cancel', 'exchange', 'defect', 'damaged', 'replace', 'policy'],
      answer: 'We offer a **7-Day Return/Replacement Policy** for any manufacturing defects or transit damage:\n\n1. **Unboxing Video Mandatory**: To prevent fraudulent claims, a continuous unboxing video showing the packaging label and package opening is required.\n2. **Refund processing**: Once approved, refunds are credited back to your original payment method within **3-5 business days**.\n3. **Cancellations**: Orders can be cancelled prior to dispatch directly from your profile panel.'
    },
    gst: {
      keywords: ['gst', 'tax', 'cgst', 'sgst', 'igst', 'taxes', 'hsn', 'sac'],
      answer: 'GST is calculated based on government guidelines and shipping destination:\n\n- **Intra-State (Within Telangana)**: 9% CGST + 9% SGST is applied.\n- **Inter-State (Rest of India)**: 18% IGST is applied.\n- **Product prices**: By default, prices displayed in the catalog are **inclusive of taxes** or configure dynamically at checkout stage. Each product has appropriate HSN codes assigned.'
    },
    about: {
      keywords: ['about', 'store', 'shop', 'location', 'where', 'address', 'who', 'contact', 'phone', 'instagram', 'social'],
      answer: 'ToyzGuru is your premier eCommerce collector vault located in **Hyderabad, India**! 🇮🇳\n\n- **Collections**: We specialize in imported high-detail Anime Figures, 1:18/1:24 Diecast Model Cars, Imported Mechanical Watches, and Katanas.\n- **Instagram**: Follow us [@toyz_guruofficial](https://instagram.com/toyz_guruofficial) for exclusive drop announcements.\n- **Email**: support@toyzguru.in\n- **Location**: Hyderabad, Telangana. Customer visits are available by appointment.'
    },
    admin: {
      keywords: ['admin', 'dashboard', 'inventory', 'add product', 'management', 'create category'],
      answer: 'To access the admin inventory control dashboard, navigate to the **[Admin Panel](#admin)** from the footer links. You must log in with authorized administrator credentials. There, you can manage inventory levels, track real-time orders, toggle GST, and review support audits.'
    }
  };

  // State Management
  let state = {
    isOpen: false,
    messages: [],
    unreadCount: 0,
    hasProactiveGreeted: false,
    isTyping: false
  };

  // HTML UI Template injection
  function injectChatbotHTML() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'tg-chatbot-wrapper';
    chatContainer.innerHTML = `
      <!-- Trigger floating button -->
      <div id="tg-bot-trigger" title="Chat with ToyzGuru AI">
        <div class="tg-bot-badge" id="tg-bot-badge" style="display: none;">1</div>
      </div>

      <!-- Chat window container -->
      <div id="tg-bot-window">
        <div class="tg-bot-glow-line"></div>
        <div class="tg-bot-header">
          <div class="tg-bot-profile-info">
            <div class="tg-bot-avatar-wrap">
              <img src="${BOT_CONFIG.avatar}" class="tg-bot-avatar" alt="AI Avatar">
              <span class="tg-bot-online-dot"></span>
            </div>
            <div class="tg-bot-title-area">
              <span class="tg-bot-name">${BOT_CONFIG.name}</span>
              <span class="tg-bot-status" id="tg-bot-status-text">Online</span>
            </div>
          </div>
          <div class="tg-bot-actions">
            <button class="tg-bot-action-btn" id="tg-bot-close" title="Close Chat">
              <i data-feather="x" style="width: 16px; height: 16px; stroke-width: 2.5;"></i>
            </button>
          </div>
        </div>

        <!-- Messages log -->
        <div class="tg-bot-messages" id="tg-bot-messages"></div>

        <!-- Suggestion chips wrapper -->
        <div class="tg-bot-quick-replies-wrap">
          <div class="tg-bot-quick-replies" id="tg-bot-quick-replies"></div>
        </div>

        <!-- Text Input Area -->
        <div class="tg-bot-input-panel">
          <input type="text" class="tg-bot-input" id="tg-bot-input-field" placeholder="Ask about products, orders, taxes...">
          <button class="tg-bot-send-btn" id="tg-bot-send" title="Send Message">
            <svg viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);
    
    // Import Feather icons just in case they are needed for loaded dynamic markup
    if (window.feather) {
      window.feather.replace();
    }
  }

  // Load chat history from sessionStorage on initialization
  function loadHistory() {
    const saved = sessionStorage.getItem('toyzguru_chat_history');
    if (saved) {
      state.messages = JSON.parse(saved);
    } else {
      // Create default welcome message
      state.messages = [{
        sender: 'bot',
        text: BOT_CONFIG.welcomeMessage,
        time: getCurrentTimeFormatted()
      }];
      saveHistory();
    }
  }

  function saveHistory() {
    sessionStorage.setItem('toyzguru_chat_history', JSON.stringify(state.messages));
  }

  function getCurrentTimeFormatted() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Render messages in DOM
  function renderMessages() {
    const container = document.getElementById('tg-bot-messages');
    if (!container) return;

    container.innerHTML = state.messages.map((msg, index) => {
      let content = parseMarkdownToHTML(msg.text);
      if (msg.html) {
        content += msg.html;
      }
      return `
        <div class="tg-bot-msg ${msg.sender}">
          <div>${content}</div>
          <span class="tg-bot-time">${msg.time}</span>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  function parseMarkdownToHTML(text) {
    if (!text) return '';
    let parsed = text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    return parsed.replace(/\n/g, '<br>');
  }

  // Render quick replies suggestions
  function renderQuickReplies() {
    const container = document.getElementById('tg-bot-quick-replies');
    if (!container) return;

    container.innerHTML = BOT_CONFIG.quickReplies.map(reply => {
      return `<button class="tg-bot-chip" data-action="${reply.action}">${reply.text}</button>`;
    }).join('');

    // Add click listeners
    const chips = container.querySelectorAll('.tg-bot-chip');
    chips.forEach(chip => {
      chip.onclick = () => {
        const action = chip.getAttribute('data-action');
        const text = chip.textContent;
        handleQuickReplyClick(text, action);
      };
    });
  }

  // Handle trigger click (Toggle Panel)
  function toggleBotWindow() {
    const windowEl = document.getElementById('tg-bot-window');
    const badgeEl = document.getElementById('tg-bot-badge');
    
    state.isOpen = !state.isOpen;
    if (state.isOpen) {
      windowEl.classList.add('active');
      state.unreadCount = 0;
      badgeEl.textContent = '0';
      badgeEl.style.display = 'none';
      renderMessages();
      
      // Auto-focus input field on desktop
      if (window.innerWidth > 768) {
        document.getElementById('tg-bot-input-field').focus();
      }
    } else {
      windowEl.classList.remove('active');
    }
  }

  // Add message bubble
  function addMessage(sender, text, html = '') {
    const time = getCurrentTimeFormatted();
    state.messages.push({ sender, text, html, time });
    saveHistory();
    
    if (state.isOpen) {
      renderMessages();
    } else {
      // Increment unread count
      state.unreadCount++;
      const badgeEl = document.getElementById('tg-bot-badge');
      if (badgeEl) {
        badgeEl.textContent = state.unreadCount;
        badgeEl.style.display = 'flex';
      }
    }
  }

  // Simulate typing indicator
  function showTypingIndicator(callback) {
    if (state.isTyping) return;
    state.isTyping = true;

    const statusEl = document.getElementById('tg-bot-status-text');
    if (statusEl) {
      statusEl.textContent = 'Typing...';
      statusEl.classList.add('typing');
    }

    const container = document.getElementById('tg-bot-messages');
    if (container) {
      const typingBubble = document.createElement('div');
      typingBubble.className = 'tg-bot-msg bot';
      typingBubble.id = 'tg-bot-typing-bubble';
      typingBubble.innerHTML = `
        <div class="tg-bot-typing-indicator">
          <div class="tg-bot-typing-dot"></div>
          <div class="tg-bot-typing-dot"></div>
          <div class="tg-bot-typing-dot"></div>
        </div>
      `;
      container.appendChild(typingBubble);
      container.scrollTop = container.scrollHeight;
    }

    // Delay response depending on length
    setTimeout(() => {
      const typingBubble = document.getElementById('tg-bot-typing-bubble');
      if (typingBubble) {
        typingBubble.remove();
      }
      
      if (statusEl) {
        statusEl.textContent = 'Online';
        statusEl.classList.remove('typing');
      }

      state.isTyping = false;
      callback();
    }, 850);
  }

  // Ingest global product catalog
  function getProductState() {
    return window.productsState || window.initialProducts || [];
  }

  // Handle user submit input
  function handleSendMessage() {
    const field = document.getElementById('tg-bot-input-field');
    const query = field.value.trim();
    if (!query) return;

    // Add user message
    addMessage('user', query);
    field.value = '';

    // Simulate response
    showTypingIndicator(() => {
      processBotResponse(query);
    });
  }

  // Proactive greeting bubble after 5 seconds of session inactivity
  function triggerProactiveWelcome() {
    if (state.hasProactiveGreeted || state.isOpen) return;
    
    // Check if user has already spoken
    const hasUserMessaged = state.messages.some(m => m.sender === 'user');
    if (hasUserMessaged) return;

    state.hasProactiveGreeted = true;
    state.unreadCount++;
    const badgeEl = document.getElementById('tg-bot-badge');
    if (badgeEl) {
      badgeEl.textContent = state.unreadCount;
      badgeEl.style.display = 'flex';
    }
  }

  // Core NLP Response Processor
  function processBotResponse(query) {
    const q = query.toLowerCase();

    // 1. Check Product Matches
    const catalog = getProductState();
    let matchedProduct = null;
    
    // Check if query exactly mentions titles or keys of inventory
    // Words to ignore in matching — too common to be product names
    const stopWords = new Set(['the','and','for','this','that','with','from','about','what','show','find','get','is','are','was','an','a','in','on','at','to','of','do','how','can','me','my','i','it','its','tell','give','please','help','want','need','look','search','check','have','has','buy']);
    const queryWords = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    for (let product of catalog) {
      const title = product.title.toLowerCase();
      const titleWords = title.split(/[\s'",!]+/).filter(w => w.length > 2);

      // Exact full-title match
      if (q.includes(title)) {
        matchedProduct = product;
        break;
      }
      // Exact product id match
      if (q.includes(product.id.toLowerCase())) {
        matchedProduct = product;
        break;
      }
      // Any meaningful word from the user query matches a word in the product title
      // This lets "Goku", "Aventador", "skeleton" trigger specific product cards
      if (queryWords.some(qw => titleWords.some(tw => tw.startsWith(qw) || qw.startsWith(tw)))) {
        matchedProduct = product;
        break;
      }
    }

    if (matchedProduct) {
      const basePrice = Number(matchedProduct.price);
      const originalPrice = matchedProduct.original_price !== undefined && matchedProduct.original_price !== null 
        ? Number(matchedProduct.original_price) 
        : (matchedProduct.originalPrice !== undefined ? Number(matchedProduct.originalPrice) : null);
      
      let priceSection = `**₹${basePrice.toFixed(2)}**`;
      if (originalPrice && originalPrice > basePrice) {
        const savings = originalPrice - basePrice;
        priceSection = `**₹${basePrice.toFixed(2)}** (Original: ~~₹${originalPrice.toFixed(2)}~~, saving ₹${savings.toFixed(2)}!)`;
      }

      const stockStatus = matchedProduct.stock <= 0 
        ? '**Sold Out** 🚫' 
        : `**${matchedProduct.stock} items left** in stock`;

      const ratingSection = matchedProduct.rating 
        ? `⭐ **${Number(matchedProduct.rating).toFixed(1)}/5.0** (${matchedProduct.reviews_count || 124} reviews)` 
        : '';

      const specsRows = Object.entries(matchedProduct.specs || {})
        .slice(0, 3)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');

      const textResponse = `Found the **${matchedProduct.title}** under ${matchedProduct.category.replace('-', ' ')}:\n\n` +
        `- Price: ${priceSection}\n` +
        `- Availability: ${stockStatus}\n` +
        `- Rating: ${ratingSection}\n` +
        (specsRows ? `\nKey Specifications:\n${specsRows}` : '');

      // Create Custom interactive item card inside chat
      const htmlResponse = `
        <div class="tg-bot-product-card">
          <img src="${matchedProduct.image}" class="tg-bot-product-thumb" alt="Product Image">
          <div class="tg-bot-product-info">
            <div class="tg-bot-product-name">${matchedProduct.title}</div>
            <div class="tg-bot-product-prices">
              <span class="current">₹${basePrice.toFixed(2)}</span>
              ${originalPrice && originalPrice > basePrice ? `<span class="original">₹${originalPrice.toFixed(2)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="tg-bot-msg-actions">
          <button class="tg-bot-msg-btn primary" onclick="window.botPerformAction('add_to_cart', '${matchedProduct.id}')">
            Add to Cart 🛒
          </button>
          <button class="tg-bot-msg-btn secondary" onclick="window.botPerformAction('view_details', '${matchedProduct.id}')">
            View Details 🔍
          </button>
        </div>
      `;

      addMessage('bot', textResponse, htmlResponse);
      return;
    }

    // 2. Check Order Tracking Matches
    // Matches order codes e.g. TG-12345 or TG-12345-67890
    const trackingMatch = query.match(/TG-\d+(-\d+)?/i);
    if (trackingMatch) {
      const orderId = trackingMatch[0].toUpperCase();
      let orders = window.ordersState || [];
      if (orders.length === 0) {
        try {
          orders = JSON.parse(localStorage.getItem('toyzguru_orders')) || [];
        } catch (e) {}
      }

      const order = orders.find(o => o.id.toUpperCase() === orderId);
      if (order) {
        const orderDate = new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const textResponse = `Order **${orderId}** successfully located! 📦\n\n` +
          `- Date Placed: **${orderDate}**\n` +
          `- Payment status: **${order.payment_status || 'Cleared'}**\n` +
          `- Delivery status: **${order.status.toUpperCase()}**\n` +
          `- Order Total: **₹${Number(order.total || 0).toFixed(2)}**\n\n` +
          `Would you like to open the visual shipping tracking timeline?`;

        const htmlResponse = `
          <div class="tg-bot-msg-actions">
            <button class="tg-bot-msg-btn primary" onclick="window.botPerformAction('track_order_timeline', '${orderId}')">
              Open Tracking Timeline 📍
            </button>
          </div>
        `;
        addMessage('bot', textResponse, htmlResponse);
      } else {
        addMessage('bot', `I searched our warehouse records but could not locate order **${orderId}**.\n\nPlease verify your order receipt ID and type it again, or submit a support ticket below to have our shipping agent verify it.`, `
          <div class="tg-bot-msg-actions">
            <button class="tg-bot-msg-btn secondary" onclick="window.botPerformAction('support_ticket', '')">
              File Support Ticket 💬
            </button>
          </div>
        `);
      }
      return;
    }

    // 3. Category match (watches, cars, figures)
    if (q.includes('watch') || q.includes('timepiece') || q.includes('skeleton')) {
      sendCategorySummary('watches', 'Imported Mechanical Watches ⌚');
      return;
    }
    if (q.includes('car') || q.includes('diecast') || q.includes('vehicle') || q.includes('wheels')) {
      sendCategorySummary('toy-cars', 'Premium Diecast Supercars 🏎️');
      return;
    }
    if (q.includes('figure') || q.includes('anime') || q.includes('goku') || q.includes('samurai') || q.includes('action')) {
      sendCategorySummary('anime', 'High-Detail Anime Statues ⛩️');
      return;
    }

    // 4. Policy/Static Knowledge Match
    for (let key in POLICY_KNOWLEDGE) {
      const policy = POLICY_KNOWLEDGE[key];
      if (policy.keywords.some(k => q.includes(k))) {
        addMessage('bot', policy.answer);
        return;
      }
    }

    // 5. Explicit action requests
    if (q.includes('support') || q.includes('ticket') || q.includes('human') || q.includes('agent') || q.includes('complaint') || q.includes('help')) {
      renderSupportTicketForm();
      return;
    }

    if (q.includes('track') || q.includes('where is my')) {
      addMessage('bot', 'To track your order, please type your Order ID (it should start with **TG-** followed by numbers, e.g., **TG-10254**).\n\nYou can also click here to navigate directly to the Tracking section:', `
        <div class="tg-bot-msg-actions">
          <button class="tg-bot-msg-btn primary" onclick="window.botPerformAction('nav_tracking', '')">
            Navigate to Track Section 📦
          </button>
        </div>
      `);
      return;
    }

    // 6. Basic greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('hola') || q.includes('greetings') || q.includes('good morning') || q.includes('good afternoon')) {
      addMessage('bot', `Hello! 😊 Welcome to ToyzGuru. How can I help you build your collection today? You can search for products, calculate GST rates, or check order deliveries.`);
      return;
    }

    // 7. Fallback response
    const fallbackText = `I didn't quite capture that context. 🤖 Could you please clarify your request? \n\nI can answer questions comprehensively on:\n\n` +
      `- **Product Details**: Type a name like "Goku", "Aventador", or "skeleton watch".\n` +
      `- **GST Rates & Calculations**: Type "GST" or "tax".\n` +
      `- **Store Policies**: Type "Shipping", "Refund", or "Return policy".\n` +
      `- **Order Status**: Type your ID, e.g. **TG-10025**.\n` +
      `- **Live Support**: Type "Talk to human".`;
    addMessage('bot', fallbackText);
  }

  // Send summary list of products in a category
  function sendCategorySummary(categorySlug, displayName) {
    const catalog = getProductState();
    const items = catalog.filter(p => p.category === categorySlug);
    
    if (items.length === 0) {
      addMessage('bot', `Our catalog currently doesn't have any items under **${displayName}**.`);
      return;
    }

    const itemsList = items.map(item => `- **${item.title}** available for **₹${Number(item.price).toFixed(2)}**`).join('\n');
    const textResponse = `Here are the latest items in **${displayName}**:\n\n${itemsList}\n\nWould you like me to filter the catalog page or open details?`;

    // Render product item chips
    const htmlResponse = `
      <div class="tg-bot-msg-actions">
        <button class="tg-bot-msg-btn primary" onclick="window.botPerformAction('filter_catalog', '${categorySlug}')">
          Filter Catalog View 🔍
        </button>
        ${items.slice(0, 2).map(item => `
          <button class="tg-bot-msg-btn secondary" onclick="window.botPerformAction('view_details', '${item.id}')">
            ${item.title.split(' ')[0]} Details 🔍
          </button>
        `).join('')}
      </div>
    `;

    addMessage('bot', textResponse, htmlResponse);
  }

  // Render HTML Form for support tickets inside chat
  function renderSupportTicketForm() {
    const id = 'ticket-form-' + Date.now();
    const textPrompt = `Please fill in your contact information below to file an official support ticket. Our helpdesk team will contact you within 12 hours:`;
    
    const htmlForm = `
      <form class="tg-bot-ticket-form" id="${id}" onsubmit="window.botSubmitTicket(event, '${id}')">
        <input type="text" placeholder="Your Name" required class="tg-bot-form-input tg-bot-form-name">
        <input type="email" placeholder="Email Address" required class="tg-bot-form-input tg-bot-form-email">
        <textarea placeholder="How can our agent assist you today?" required class="tg-bot-form-input tg-bot-form-textarea tg-bot-form-desc" rows="3"></textarea>
        <button type="submit" class="tg-bot-form-submit">Submit Support Ticket 💬</button>
      </form>
    `;

    addMessage('bot', textPrompt, htmlForm);
  }

  // Global actions router
  window.botPerformAction = function (action, param) {
    // 1. Add to Cart
    if (action === 'add_to_cart') {
      if (typeof window.quickAddToCart === 'function') {
        window.quickAddToCart(param);
        addMessage('bot', `Added product to your vault cart! 🛒`);
      } else {
        addMessage('bot', `Sorry, cart function is unavailable right now.`);
      }
    }
    
    // 2. View details modal
    if (action === 'view_details') {
      if (typeof window.openProductModal === 'function') {
        // Close bot window on mobile to avoid covering the modal
        if (window.innerWidth <= 768) {
          toggleBotWindow();
        }
        window.openProductModal(param);
      } else {
        addMessage('bot', `Unable to open detail modal.`);
      }
    }

    // 3. Track order timeline
    if (action === 'track_order_timeline') {
      if (typeof window.searchFulfillmentOrder === 'function') {
        window.location.hash = '#tracking';
        // Close chatbot window on mobile
        if (window.innerWidth <= 768) {
          toggleBotWindow();
        }
        window.searchFulfillmentOrder(param);
      }
    }

    // 4. Navigate to tracking panel
    if (action === 'nav_tracking') {
      window.location.hash = '#tracking';
      if (window.innerWidth <= 768) {
        toggleBotWindow();
      }
    }

    // 5. Support Ticket form launch
    if (action === 'support_ticket') {
      showTypingIndicator(() => {
        renderSupportTicketForm();
      });
    }

    // 6. Filter catalog view
    if (action === 'filter_catalog') {
      window.location.hash = '#catalog';
      
      // Access app's global filters if possible
      if (window.catalogFilters) {
        window.catalogFilters.category = param;
      }
      if (typeof window.initCatalogView === 'function') {
        window.initCatalogView({ category: param });
      } else if (typeof window.applyFiltersAndRender === 'function') {
        window.applyFiltersAndRender();
      }

      // Smooth scroll to catalog
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
      
      if (window.innerWidth <= 768) {
        toggleBotWindow();
      }
      
      addMessage('bot', `Catalog filtered to display items! 🔍`);
    }
  };

  // Submit support ticket form callback
  window.botSubmitTicket = function (event, formId) {
    event.preventDefault();
    const form = document.getElementById(formId);
    if (!form) return;

    const name = form.querySelector('.tg-bot-form-name').value;
    const email = form.querySelector('.tg-bot-form-email').value;
    const desc = form.querySelector('.tg-bot-form-desc').value;

    // Save support ticket in localStorage
    try {
      const tickets = JSON.parse(localStorage.getItem('toyzguru_chat_tickets') || '[]');
      tickets.push({
        id: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
        name,
        email,
        description: desc,
        date: new Date().toISOString()
      });
      localStorage.setItem('toyzguru_chat_tickets', JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to store support ticket', e);
    }

    // Replace form in message with confirmation
    form.outerHTML = `
      <div style="background: rgba(16,185,129,0.1); border: 1px solid var(--color-success); padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; margin-top: 0.5rem; color: #fff;">
        <strong style="color: var(--color-success);">Ticket Submitted!</strong><br>
        Name: ${name}<br>
        Email: ${email}
      </div>
    `;

    // Trigger toast confirmation
    if (typeof window.showToast === 'function') {
      window.showToast('Ticket Generated', 'Your support request has been queued in offline database.', 'success');
    }

    // Add bot confirmation message
    showTypingIndicator(() => {
      addMessage('bot', `Thank you **${name}**! Your ticket has been registered. Our support team has received the description: _"${desc}"_.\n\nWe will reach out to your email **${email}** within 12 hours.`);
    });
  };

  // Handle suggestion chips actions
  function handleQuickReplyClick(text, action) {
    addMessage('user', text);
    showTypingIndicator(() => {
      if (action === 'browse_anime') {
        sendCategorySummary('anime', 'High-Detail Anime Statues ⛩️');
      } else if (action === 'browse_cars') {
        sendCategorySummary('toy-cars', 'Premium Diecast Supercars 🏎️');
      } else if (action === 'gst_info') {
        addMessage('bot', POLICY_KNOWLEDGE.gst.answer);
      } else if (action === 'shipping_refund') {
        addMessage('bot', `${POLICY_KNOWLEDGE.shipping.answer}\n\n---\n\n${POLICY_KNOWLEDGE.refund.answer}`);
      } else if (action === 'support_ticket') {
        renderSupportTicketForm();
      } else if (action === 'track_order_prompt') {
        addMessage('bot', 'Please enter your Order ID to track your package delivery timeline (e.g., **TG-10025**).');
      }
    });
  }

  // Setup DOM Event Listeners
  function setupListeners() {
    const trigger = document.getElementById('tg-bot-trigger');
    const closeBtn = document.getElementById('tg-bot-close');
    const sendBtn = document.getElementById('tg-bot-send');
    const inputField = document.getElementById('tg-bot-input-field');

    if (trigger) trigger.onclick = toggleBotWindow;
    if (closeBtn) closeBtn.onclick = toggleBotWindow;
    if (sendBtn) sendBtn.onclick = handleSendMessage;
    if (inputField) {
      inputField.onkeydown = (e) => {
        if (e.key === 'Enter') {
          handleSendMessage();
        }
      };
    }
  }

  // Initalize Chat Widget
  function init() {
    injectChatbotHTML();
    loadHistory();
    renderQuickReplies();
    setupListeners();

    // Trigger Proactive Welcome Notification after 5 seconds of session inactivity
    setTimeout(triggerProactiveWelcome, 5000);
  }

  // Run on page load/ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
