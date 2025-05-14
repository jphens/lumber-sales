const db = require("../database");

const TicketModel = {
  /**
   * Get all tickets
   * @returns {Array} Array of ticket objects
   */
  getAll() {
    const stmt = db.prepare(`
    SELECT t.*, p.name as partyName, p.phone as partyPhone,
           sv.name as ship_via_name, 
           st.name as sales_tax_name, st.tax_rate as sales_tax_rate
    FROM tickets t
    LEFT JOIN parties p ON t.party_id = p.id
    LEFT JOIN ship_via sv ON t.ship_via_id = sv.id
    LEFT JOIN sales_tax st ON t.sales_tax_id = st.id
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
           ba.county as billingCounty,
           ba.postal_code as billingPostalCode,
           sa.address_line1 as shippingAddress1,
           sa.address_line2 as shippingAddress2,
           sa.city as shippingCity,
           sa.state as shippingState,
           sa.county as shippingCounty,
           sa.postal_code as shippingPostalCode,
           sv.name as ship_via_name, 
           sv.description as ship_via_description,
           st.name as sales_tax_name, 
           st.tax_rate as sales_tax_rate,
           st.county as sales_tax_county, 
           st.state as sales_tax_state
    FROM tickets t
    LEFT JOIN parties p ON t.party_id = p.id
    LEFT JOIN addresses ba ON t.billing_address_id = ba.id
    LEFT JOIN addresses sa ON t.shipping_address_id = sa.id
    LEFT JOIN ship_via sv ON t.ship_via_id = sv.id
    LEFT JOIN sales_tax st ON t.sales_tax_id = st.id
    WHERE t.id = ?
  `);
    const ticket = ticketStmt.get(id);

    if (!ticket) return null;

    // Get the ticket items sorted by distribution_number
    const itemsStmt = db.prepare(`
    SELECT ti.*, s.name as speciesName, s.list_name as speciesListName, s.species_number
    FROM ticket_items ti
    LEFT JOIN species s ON ti.species_id = s.id
    WHERE ti.ticketId = ?
    ORDER BY ti.distribution_number ASC
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
    const checkSeq = db
      .prepare(
        `
      SELECT seq FROM sqlite_sequence WHERE name = 'tickets'
    `
      )
      .get();

    if (!checkSeq) {
      // Initialize the sequence to start at 30000 (first ticket will be 30000)
      db.prepare(
        `
        INSERT INTO sqlite_sequence (name, seq) VALUES ('tickets', 29999)
      `
      ).run();
      return 30000;
    }

    // Get the current value and increment by 1
    return checkSeq.seq + 1;
  },

  /**
   * Sort ticket items according to the specified criteria
   * @param {Array} items - Array of ticket items to sort
   * @returns {Array} Sorted and numbered ticket items
   */
  sortAndNumberItems(items) {
    // Get species information if needed for sorting
    const speciesMap = new Map();
    const speciesStmt = db.prepare(`SELECT id, species_number FROM species`);
    const speciesList = speciesStmt.all();
    speciesList.forEach((species) => {
      speciesMap.set(species.id, parseInt(species.species_number, 10));
    });

    // First, create a copy and sort the items
    const sortedItems = [...items].sort((a, b) => {
      // Helper function to handle null values (nulls go to end)
      const compareValues = (valA, valB) => {
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1;
        if (valB === null) return -1;
        return valA - valB;
      };

      // First sort by species number (ascending)
      const speciesNumberA = a.species_id ? speciesMap.get(a.species_id) : null;
      const speciesNumberB = b.species_id ? speciesMap.get(b.species_id) : null;
      const speciesCompare = compareValues(speciesNumberA, speciesNumberB);
      if (speciesCompare !== 0) return speciesCompare;

      // Then by thickness (ascending)
      const thicknessCompare = compareValues(a.thickness, b.thickness);
      if (thicknessCompare !== 0) return thicknessCompare;

      // Then by width (ascending)
      const widthCompare = compareValues(a.width, b.width);
      if (widthCompare !== 0) return widthCompare;

      // Finally by length (ascending)
      const lengthCompare = compareValues(a.length, b.length);
      return lengthCompare;
    });

    // Assign distribution numbers
    sortedItems.forEach((item, index) => {
      item.distribution_number = index + 1;
    });

    return sortedItems;
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

      // Sort and number the items
      const sortedItems = this.sortAndNumberItems(items);

      // Set distribution_total
      ticket.distribution_total = sortedItems.length;

      // Insert the ticket
      const ticketStmt = db.prepare(`
      INSERT INTO tickets (
        id, invoice_number, party_id, billing_address_id, shipping_address_id,
        ship_via_id, sales_tax_id, customerName, customerPhone, date, due_date,
        ticket_type, purchase_order, shipping_attention, total_freight,
        status, total_bf, total_tax, total_amount, distribution_total
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      ticketStmt.run(
        ticket.id,
        nextInvoiceNumber,
        ticket.party_id,
        ticket.billing_address_id,
        ticket.shipping_address_id,
        ticket.ship_via_id || null,
        ticket.sales_tax_id || null,
        ticket.customerName,
        ticket.customerPhone,
        ticket.date,
        ticket.due_date || null,
        ticket.ticket_type || "invoice",
        ticket.purchase_order || null,
        ticket.shipping_attention || null,
        ticket.total_freight || 0,
        ticket.status || "draft",
        ticket.total_bf || 0,
        ticket.total_tax || 0,
        ticket.total_amount || 0,
        ticket.distribution_total || 0
      );

      // Update the sequence
      db.prepare(
        `
      UPDATE sqlite_sequence 
      SET seq = ? 
      WHERE name = 'tickets'
    `
      ).run(nextInvoiceNumber);

      // Insert each item with distribution_number
      const itemStmt = db.prepare(`
      INSERT INTO ticket_items (
        ticketId, species_id, quantity, width, thickness, length, 
        price_per_mbf, total_bf, tax_amount, total_tax, total_amount, distribution_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      for (const item of sortedItems) {
        // Convert empty species_id to null for database foreign key constraint
        const speciesId = item.species_id === "" ? null : item.species_id;

        itemStmt.run(
          ticket.id,
          speciesId,
          item.quantity,
          item.width,
          item.thickness,
          item.length,
          item.price_per_mbf,
          item.total_bf || 0,
          item.tax_amount || 0,
          item.total_tax || 0,
          item.total_amount || 0,
          item.distribution_number
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
      // Sort and number the items
      const sortedItems = this.sortAndNumberItems(items);

      // Set distribution_total
      ticket.distribution_total = sortedItems.length;

      // Update the ticket
      const ticketStmt = db.prepare(`
      UPDATE tickets
      SET party_id = ?,
          billing_address_id = ?,
          shipping_address_id = ?,
          ship_via_id = ?,
          sales_tax_id = ?,
          customerName = ?,
          customerPhone = ?,
          date = ?,
          due_date = ?,
          ticket_type = ?,
          purchase_order = ?,
          shipping_attention = ?,
          total_freight = ?,
          status = ?,
          total_bf = ?,
          total_tax = ?,
          total_amount = ?,
          distribution_total = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

      ticketStmt.run(
        ticket.party_id,
        ticket.billing_address_id,
        ticket.shipping_address_id,
        ticket.ship_via_id || null,
        ticket.sales_tax_id || null,
        ticket.customerName,
        ticket.customerPhone,
        ticket.date,
        ticket.due_date || null,
        ticket.ticket_type || "invoice",
        ticket.purchase_order || null,
        ticket.shipping_attention || null,
        ticket.total_freight || 0,
        ticket.status || "draft",
        ticket.total_bf || 0,
        ticket.total_tax || 0,
        ticket.total_amount || 0,
        ticket.distribution_total || 0,
        id
      );

      // Delete all existing items for this ticket
      const deleteItemsStmt = db.prepare(`
      DELETE FROM ticket_items WHERE ticketId = ?
    `);
      deleteItemsStmt.run(id);

      // Insert new items with distribution_number
      const itemStmt = db.prepare(`
      INSERT INTO ticket_items (
        ticketId, species_id, quantity, width, thickness, length, 
        price_per_mbf, total_bf, tax_amount, total_tax, total_amount, distribution_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      for (const item of sortedItems) {
        // Convert empty species_id to null for database foreign key constraint
        const speciesId = item.species_id === "" ? null : item.species_id;

        itemStmt.run(
          id,
          speciesId,
          item.quantity,
          item.width,
          item.thickness,
          item.length,
          item.price_per_mbf,
          item.total_bf || 0,
          item.tax_amount || 0,
          item.total_tax || 0,
          item.total_amount || 0,
          item.distribution_number
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
  },
};

module.exports = TicketModel;
