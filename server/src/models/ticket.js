const db = require('../database');

const TicketModel = {
  /**
   * Get all tickets
   * @returns {Array} Array of ticket objects
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT t.*, p.name as partyName, p.phone as partyPhone
      FROM tickets t
      LEFT JOIN parties p ON t.party_id = p.id
      ORDER BY t.created_at DESC
    `);
    return stmt.all();
  },

  /**
   * Get a ticket by ID with its items
   * @param {string} id - Ticket ID
   * @returns {Object|null} Ticket object with items array
   */
  getById(id) {
    // Get the ticket
    const ticketStmt = db.prepare(`
      SELECT t.*, 
             p.name as partyName, 
             p.phone as partyPhone,
             ba.address_line1 as billingAddress1,
             ba.address_line2 as billingAddress2,
             ba.city as billingCity,
             ba.state as billingState,
             ba.postal_code as billingPostalCode,
             sa.address_line1 as shippingAddress1,
             sa.address_line2 as shippingAddress2,
             sa.city as shippingCity,
             sa.state as shippingState,
             sa.postal_code as shippingPostalCode
      FROM tickets t
      LEFT JOIN parties p ON t.party_id = p.id
      LEFT JOIN addresses ba ON t.billing_address_id = ba.id
      LEFT JOIN addresses sa ON t.shipping_address_id = sa.id
      WHERE t.id = ?
    `);
    const ticket = ticketStmt.get(id);

    if (!ticket) return null;

    // Get the ticket items
    const itemsStmt = db.prepare(`
      SELECT ti.*, s.name as speciesName, s.list_name as speciesListName
      FROM ticket_items ti
      LEFT JOIN species s ON ti.species_id = s.id
      WHERE ti.ticketId = ?
    `);
    const items = itemsStmt.all(id);

    // Combine ticket with its items
    return { ...ticket, items };
  },

  /**
   * Get the next invoice number
   * @returns {number} Next invoice number
   */
  getNextInvoiceNumber() {
    // Check if we need to initialize the sequence
    const checkSeq = db.prepare(`
      SELECT seq FROM sqlite_sequence WHERE name = 'tickets'
    `).get();
    
    if (!checkSeq) {
      // Initialize the sequence to start at 30000 (first ticket will be 30000)
      db.prepare(`
        INSERT INTO sqlite_sequence (name, seq) VALUES ('tickets', 29999)
      `).run();
      return 30000;
    }
    
    // Get the current value and increment by 1
    return checkSeq.seq + 1;
  },

    /**
   * Create a new ticket
   * @param {Object} ticket - Ticket object
   * @param {Array} items - Array of ticket item objects
   * @returns {Object} Created ticket
   */
    create(ticket, items) {
      // Start a transaction
      const createTicket = db.transaction((ticket, items) => {
        // Get the next invoice number
        const nextInvoiceNumber = this.getNextInvoiceNumber();
        
        // Insert the ticket
        const ticketStmt = db.prepare(`
          INSERT INTO tickets (
            id, invoice_number, party_id, billing_address_id, shipping_address_id,
            customerName, customerPhone, date, status, 
            total_bf, total_tax, total_amount
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        ticketStmt.run(
          ticket.id, 
          nextInvoiceNumber,
          ticket.party_id, 
          ticket.billing_address_id,
          ticket.shipping_address_id,
          ticket.customerName, 
          ticket.customerPhone, 
          ticket.date,
          ticket.status || 'draft',
          ticket.total_bf || 0,
          ticket.total_tax || 0,
          ticket.total_amount || 0
        );
  
        // Update the sequence
        db.prepare(`
          UPDATE sqlite_sequence 
          SET seq = ? 
          WHERE name = 'tickets'
        `).run(nextInvoiceNumber);
  
        // Insert each item
        const itemStmt = db.prepare(`
          INSERT INTO ticket_items (
            ticketId, species_id, quantity, width, thickness, length, 
            price_per_mbf, total_bf, total_tax, total_amount
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
  
        for (const item of items) {
          // Convert empty species_id to null for database foreign key constraint
          const speciesId = item.species_id === '' ? null : item.species_id;
          
          itemStmt.run(
            ticket.id,
            speciesId, // Use null instead of empty string
            item.quantity,
            item.width,
            item.thickness,
            item.length,
            item.price_per_mbf,
            item.total_bf || 0,
            item.total_tax || 0,
            item.total_amount || 0
          );
        }
  
        // Return the created ticket with its new invoice_number
        return this.getById(ticket.id);
      });
  
      // Execute the transaction
      return createTicket(ticket, items);
    },

   /**
   * Update a ticket
   * @param {string} id - Ticket ID
   * @param {Object} ticket - Updated ticket data
   * @param {Array} items - Updated ticket items
   * @returns {Object} Updated ticket
   */
   update(id, ticket, items) {
    // Start a transaction
    const updateTicket = db.transaction((id, ticket, items) => {
      // Update the ticket
      const ticketStmt = db.prepare(`
        UPDATE tickets
        SET party_id = ?,
            billing_address_id = ?,
            shipping_address_id = ?,
            customerName = ?,
            customerPhone = ?,
            date = ?,
            status = ?,
            total_bf = ?,
            total_tax = ?,
            total_amount = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      ticketStmt.run(
        ticket.party_id,
        ticket.billing_address_id,
        ticket.shipping_address_id,
        ticket.customerName,
        ticket.customerPhone,
        ticket.date,
        ticket.status || 'draft',
        ticket.total_bf || 0,
        ticket.total_tax || 0,
        ticket.total_amount || 0,
        id
      );

      // Delete all existing items for this ticket
      const deleteItemsStmt = db.prepare(`
        DELETE FROM ticket_items WHERE ticketId = ?
      `);
      deleteItemsStmt.run(id);

      // Insert new items
      const itemStmt = db.prepare(`
        INSERT INTO ticket_items (
          ticketId, species_id, quantity, width, thickness, length, 
          price_per_mbf, total_bf, total_tax, total_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        // Convert empty species_id to null for database foreign key constraint
        const speciesId = item.species_id === '' ? null : item.species_id;
        
        itemStmt.run(
          id,
          speciesId, // Use null instead of empty string
          item.quantity,
          item.width,
          item.thickness,
          item.length,
          item.price_per_mbf,
          item.total_bf || 0,
          item.total_tax || 0,
          item.total_amount || 0
        );
      }

      // Return the updated ticket
      return this.getById(id);
    });

    // Execute the transaction
    return updateTicket(id, ticket, items);
  },

  /**
   * Delete a ticket
   * @param {string} id - Ticket ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stmt = db.prepare(`
      DELETE FROM tickets WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = TicketModel;