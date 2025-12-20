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
    const {id} = req.params;

    const result = await pool.query(
      `SELECT * FROM documents WHERE id = $1` , [id] 
    );
    console.log('id from params:', req.params.id, typeof req.params.id);

    console.log('Query result:', result);
    
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