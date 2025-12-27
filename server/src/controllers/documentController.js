const pool = require('../db');

exports.createDocument = async (req , res) => {
  try {
    const {owner_id} = req.body;

    const result = await pool.query(
      `INSERT INTO documents (owner_id)
       VALUES ($1)
       RETURNING *`, [owner_id]
    );

    res.status(201).json(result.rows[0]);
  }
  catch(err){
    console.log("Error in creating the document :",err);
    res.status(500).json( {"error" : "failed to create document"});
  }
};

exports.getDocumentId = async (req , res) => {
  try{
    const id = parseInt(req.params.id, 10);

    const result = await pool.query(
      `SELECT * FROM documents WHERE owner_id = $1` , [id] 
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);

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
    const userId = parseInt(req.user.id); // set by auth middleware
    console.log("the ID : ", id , "UserID" , userId);
    // 1. Fetch current document
    const result = await pool.query(
      `SELECT version FROM documents 
       WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );

    // 2. If document not found or not owned
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
       WHERE id = $3 AND owner_id = $4`,
      [content, (newVersion), id, userId]
    );

    // 5. Success response
    res.status(200).json({
      message: "Document updated successfully",
      version : newVersion,
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
