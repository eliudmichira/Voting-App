/**
 * Blockchain Event Listener
 * 
 * Subscribes to contract events and provides real-time notifications
 * for important blockchain events.
 */

class BlockchainEventListener {
  constructor(web3Instance, contractInstance) {
    this.web3 = web3Instance;
    this.contract = contractInstance;
    this.events = [];
    this.subscriptions = {};
    this.isListening = false;
    this.notificationCount = 0;
  }

  /**
   * Start listening for contract events
   */
  async startListening() {
    if (this.isListening || !this.contract) return;
    
    try {
      // Subscribe to CandidateAdded events
      this.subscriptions.candidateAdded = this.contract.events.CandidateAdded({
        fromBlock: 'latest'
      })
      .on('data', (event) => this.handleEvent('CandidateAdded', event))
      .on('error', error => console.error('Error on CandidateAdded event:', error));
      
      // Subscribe to VoteCast events
      this.subscriptions.voteCast = this.contract.events.VoteCast({
        fromBlock: 'latest'
      })
      .on('data', (event) => this.handleEvent('VoteCast', event))
      .on('error', error => console.error('Error on VoteCast event:', error));
      
      // Subscribe to VotingPeriodSet events
      this.subscriptions.votingPeriodSet = this.contract.events.VotingPeriodSet({
        fromBlock: 'latest'
      })
      .on('data', (event) => this.handleEvent('VotingPeriodSet', event))
      .on('error', error => console.error('Error on VotingPeriodSet event:', error));
      
      this.isListening = true;
      console.log('Blockchain event listeners started');
      
      // Also get recent past events
      this.loadRecentEvents();
      
      return true;
    } catch (error) {
      console.error('Failed to start event listeners:', error);
      return false;
    }
  }

  /**
   * Stop listening for events
   */
  stopListening() {
    // Unsubscribe from all events
    Object.values(this.subscriptions).forEach(subscription => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    
    this.subscriptions = {};
    this.isListening = false;
    console.log('Blockchain event listeners stopped');
  }

  /**
   * Handle incoming blockchain events
   */
  handleEvent(eventName, event) {
    // Extract relevant data based on event type
    let eventData;
    
    if (eventName === 'CandidateAdded') {
      eventData = {
        candidateId: event.returnValues.candidateId,
        name: event.returnValues.name,
        party: event.returnValues.party,
      };
    } else if (eventName === 'VoteCast') {
      eventData = {
        candidateId: event.returnValues.candidateId,
        newVoteCount: event.returnValues.newVoteCount
      };
    } else if (eventName === 'VotingPeriodSet') {
      eventData = {
        startTime: new Date(event.returnValues.startTime * 1000).toLocaleString(),
        endTime: new Date(event.returnValues.endTime * 1000).toLocaleString()
      };
    }
    
    // Create event object
    const eventObj = {
      id: `${event.id}-${Date.now()}`,
      type: eventName,
      data: eventData,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now(),
      read: false
    };
    
    // Add to events list
    this.events.unshift(eventObj);
    
    // Limit events cache to 50
    if (this.events.length > 50) {
      this.events = this.events.slice(0, 50);
    }
    
    // Create notification
    this.showNotification(eventObj);
    
    // Update UI
    this.updateEventsUI();
  }

  /**
   * Show notification for event
   */
  showNotification(event) {
    this.notificationCount++;
    
    // Update notification counter
    const counter = document.getElementById('notificationCounter');
    if (counter) {
      counter.textContent = this.notificationCount;
      counter.classList.remove('hidden');
    }
    
    // Create notification message
    let message = '';
    switch (event.type) {
      case 'CandidateAdded':
        message = `New candidate added: ${event.data.name} (${event.data.party})`;
        break;
      case 'VoteCast':
        message = `Vote cast for candidate #${event.data.candidateId}. New vote count: ${event.data.newVoteCount}`;
        break;
      case 'VotingPeriodSet':
        message = `Voting period updated: ${event.data.startTime} to ${event.data.endTime}`;
        break;
    }
    
    // Show toast notification
    this.createToast(event.type, message);
  }

  /**
   * Create a toast notification
   */
  createToast(title, message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 mb-4 transition-opacity duration-500 flex items-start max-w-sm';
    toast.style.zIndex = '9999';
    
    // Set appropriate icon for event type
    let icon = '';
    switch (title) {
      case 'CandidateAdded':
        icon = '<svg class="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>';
        break;
      case 'VoteCast':
        icon = '<svg class="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        break;
      case 'VotingPeriodSet':
        icon = '<svg class="w-6 h-6 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        break;
    }
    
    // Build toast content
    toast.innerHTML = `
      <div class="flex items-start">
        ${icon}
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">${title}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">${message}</p>
        </div>
      </div>
      <button class="ml-auto text-gray-400 hover:text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    toast.querySelector('button').addEventListener('click', () => {
      toast.classList.add('opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 500);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 5000);
  }

  /**
   * Load recent events from the blockchain
   */
  async loadRecentEvents() {
    try {
      // Get the latest block number
      const latestBlock = await this.web3.eth.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 1000); // Last 1000 blocks
      
      // Get past events for each event type
      const candidateAddedEvents = await this.contract.getPastEvents('CandidateAdded', {
        fromBlock,
        toBlock: 'latest'
      });
      
      const voteCastEvents = await this.contract.getPastEvents('VoteCast', {
        fromBlock,
        toBlock: 'latest'
      });
      
      const votingPeriodSetEvents = await this.contract.getPastEvents('VotingPeriodSet', {
        fromBlock,
        toBlock: 'latest'
      });
      
      // Process each event type
      candidateAddedEvents.forEach(event => this.processHistoricalEvent('CandidateAdded', event));
      voteCastEvents.forEach(event => this.processHistoricalEvent('VoteCast', event));
      votingPeriodSetEvents.forEach(event => this.processHistoricalEvent('VotingPeriodSet', event));
      
      // Update the UI
      this.updateEventsUI();
    } catch (error) {
      console.error('Error loading recent events:', error);
    }
  }

  /**
   * Process historical events (mark as read)
   */
  processHistoricalEvent(eventName, event) {
    // Similar to handleEvent but mark as already read
    let eventData;
    
    if (eventName === 'CandidateAdded') {
      eventData = {
        candidateId: event.returnValues.candidateId,
        name: event.returnValues.name,
        party: event.returnValues.party,
      };
    } else if (eventName === 'VoteCast') {
      eventData = {
        candidateId: event.returnValues.candidateId,
        newVoteCount: event.returnValues.newVoteCount
      };
    } else if (eventName === 'VotingPeriodSet') {
      eventData = {
        startTime: new Date(event.returnValues.startTime * 1000).toLocaleString(),
        endTime: new Date(event.returnValues.endTime * 1000).toLocaleString()
      };
    }
    
    // Create event object and mark as read
    const eventObj = {
      id: `${event.id}-hist-${Date.now()}`,
      type: eventName,
      data: eventData,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now() - (Math.random() * 100000), // Add slight variation for sorting
      read: true // Already read historical events
    };
    
    // Add to events list
    this.events.push(eventObj);
  }

  /**
   * Update the events UI
   */
  updateEventsUI() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    
    // Sort events by timestamp (descending)
    this.events.sort((a, b) => b.timestamp - a.timestamp);
    
    // Clear existing list
    eventsList.innerHTML = '';
    
    if (this.events.length === 0) {
      eventsList.innerHTML = '<li class="p-4 text-gray-500 dark:text-gray-400 text-center">No events found</li>';
      return;
    }
    
    // Add events to the list
    this.events.forEach(event => {
      const li = document.createElement('li');
      li.className = `p-3 border-b border-gray-200 dark:border-gray-700 ${event.read ? '' : 'bg-blue-50 dark:bg-blue-900/20'}`;
      
      // Format timestamp
      const date = new Date(event.timestamp);
      const timeString = date.toLocaleTimeString();
      const dateString = date.toLocaleDateString();
      
      // Create event display based on type
      let eventDisplay = '';
      
      switch (event.type) {
        case 'CandidateAdded':
          eventDisplay = `
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">Candidate Added</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Candidate #${event.data.candidateId}: ${event.data.name} (${event.data.party})
                </p>
              </div>
            </div>
          `;
          break;
          
        case 'VoteCast':
          eventDisplay = `
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">Vote Cast</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Candidate #${event.data.candidateId} received a vote (Total: ${event.data.newVoteCount})
                </p>
              </div>
            </div>
          `;
          break;
          
        case 'VotingPeriodSet':
          eventDisplay = `
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mr-3">
                <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">Voting Period Updated</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  From ${event.data.startTime} to ${event.data.endTime}
                </p>
              </div>
            </div>
          `;
          break;
      }
      
      // Add transaction info
      li.innerHTML = `
        ${eventDisplay}
        <div class="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>${dateString} ${timeString}</span>
          <a href="https://etherscan.io/tx/${event.transactionHash}" target="_blank" class="text-primary-500 hover:text-primary-600">
            Tx: ${event.transactionHash.substr(0, 8)}...
          </a>
        </div>
      `;
      
      // Mark event as read when viewed
      li.addEventListener('click', () => {
        event.read = true;
        li.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        
        // Update notification count
        if (!event.read) {
          this.notificationCount = Math.max(0, this.notificationCount - 1);
          const counter = document.getElementById('notificationCounter');
          if (counter) {
            if (this.notificationCount === 0) {
              counter.classList.add('hidden');
            } else {
              counter.textContent = this.notificationCount;
            }
          }
        }
      });
      
      eventsList.appendChild(li);
    });
  }

  /**
   * Get unread events count
   */
  getUnreadCount() {
    return this.events.filter(event => !event.read).length;
  }

  /**
   * Mark all events as read
   */
  markAllAsRead() {
    this.events.forEach(event => {
      event.read = true;
    });
    
    this.notificationCount = 0;
    const counter = document.getElementById('notificationCounter');
    if (counter) {
      counter.classList.add('hidden');
    }
    
    this.updateEventsUI();
  }
}

// Export the event listener
window.BlockchainEventListener = BlockchainEventListener; 