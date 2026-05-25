const pool = require('../db');

exports.createDocument = async (req , res) => {
  try {
    const {owner_id} = req.body;

    const result = await pool.query(
      `INSERT INTO documents (owner_id)
       VALUES ($1)
       RETURNING *`, [owner_id]
    );

    const newDoc = result.rows[0];

    // Give owner permission
    await pool.query(
      `INSERT INTO document_permissions (document_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`, [newDoc.id, owner_id, 'owner']
    );

    res.status(201).json(newDoc);
  }
  catch(err){
    console.log("Error in creating the document :",err);
    res.status(500).json( {"error" : "failed to create document"});
  }
};

exports.getDocumentId = async (req , res) => {
  try{
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);

    const result = await pool.query(
      `SELECT * FROM documents WHERE owner_id = $1` , [id] 
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    // Check permissions
    const permResult = await pool.query(
      `SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2`,
      [doc.id, userId]
    );

    if (permResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    doc.role = permResult.rows[0].role; // attach role to response
    res.json(doc);

  }
  catch(err) {
    console.log("error in getting the Id", err);
    res.status(500).json({ "error" : "failed to get id"});
  }
}

exports.updateDocument = async (req, res) => {
  try {
    const {id} = req.params;
    const {content, version } = req.body;
    const userId = parseInt(req.user.id);
    
    // Check if user has edit permissions
    const permResult = await pool.query(
      `SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (permResult.rows.length === 0 || permResult.rows[0].role === 'viewer') {
      return res.status(403).json({ message: "Access denied. Viewers cannot edit." });
    }

    // 1. Fetch current document
    const result = await pool.query(
      `SELECT version FROM documents WHERE id = $1`,
      [id]
    );

    // 2. If document not found
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    const currentVersion = result.rows[0].version;

    // 3. Version check (conflict detection)
    if (version !== currentVersion ) {
      return res.status(409).json({
        message: "Version conflict",
        currentVersion
      });
    }

    const newVersion = version + 1;
    // 4. Update document
    await pool.query(
      `UPDATE documents 
       SET content = $1, version = $2 
       WHERE id = $3`,
      [content, newVersion, id]
    );

    // 5. Success response
    res.status(200).json({
      message: "Document updated successfully",
      version : newVersion,
      content : content
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.shareDocument = async (req, res) => {
  try {
    const { documentId, email, role } = req.body;
    const userId = parseInt(req.user.id);

    // Check if current user is owner
    const permResult = await pool.query(
      `SELECT role FROM document_permissions WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    if (permResult.rows.length === 0 || permResult.rows[0].role !== 'owner') {
      return res.status(403).json({ message: "Only owners can share" });
    }

    // Find user by email
    const userResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUserId = userResult.rows[0].id;

    // Insert or update permission
    await pool.query(
      `INSERT INTO document_permissions (document_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_id, user_id) 
       DO UPDATE SET role = EXCLUDED.role`,
      [documentId, targetUserId, role]
    );

    res.status(200).json({ message: "Shared successfully" });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
