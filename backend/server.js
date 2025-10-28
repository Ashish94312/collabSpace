// server.js

const path = require('path');
const crypt = require('crypto');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const WebSocket = require('ws');
const multer = require('multer');
const fs = require('fs');
// const { PrismaClient } = require('@prisma/client');
const { PrismaClient } = require('@prisma/client'); 

const { Client} = require('@elastic/elasticsearch');



// const fullContent = pages.map(p => p.content).join('\n\n');
const esClient = new Client({
  node: 'http://localhost:9200',
});

// await esClient.index({
//   index: 'documents',
//   id: docId,
//   body: {
//     docId,
//     userId: req.user.id,
//     title: newTitle, // from req.body
//     content: fullContent,
//     updatedAt: new Date(),
//   }
// });

// const pages = await prisma.page.findMany({
//   where: { documentId: docId },
//   orderBy: { pageIndex: 'asc' },
// });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

const wss = new WebSocket.Server({ port: 3001 });


app.use(cors({ origin: 'http://localhost:3002' }));
app.use(express.json());



const documentClients = {};


wss.on('connection', (ws, req) => {
  // Parse query params from the request URL
  const params = new URLSearchParams(req.url.replace(/^\/\?/, ''));
  const docId = params.get('docId');
  const token = params.get('token');

  if (!docId || !token) {
    ws.close(1008, 'Missing docId or token');
    return;
  }

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT verification failed:', err);
    ws.close(1008, 'Invalid token');
    return;
  }

  prisma.document.findUnique({
    where: { id: docId },
    include: { shares: true },
  })
    .then(document => {
      if (!document) {
        ws.close(1008, 'Document not found');
        return;
      }

      const isOwner = document.ownerId === user.id;
      const isShared = document.shares.some(s => s.userId === user.id);

      if (!isOwner && !isShared) {
        ws.close(1008, 'Access denied');
        return;
      }

      // Join document room
      if (!documentClients[docId]) {
        documentClients[docId] = new Set();
      }

      documentClients[docId].add(ws);
      console.log(`👤 User joined doc ${docId}`);

      ws.on('message', (message) => {
        let parsed;
        try {
          parsed = JSON.parse(message);
        } catch (err) {
          console.error('Invalid JSON:', err);
          return;
        }

        const { type, data, pageIndex } = parsed;
        if (!type) return;

        // Broadcast to other users in the same document room
        for (const client of documentClients[docId]) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data, pageIndex }));
          }
        }
      });

      ws.on('close', () => {
        documentClients[docId].delete(ws);
        console.log(`👋 User left doc ${docId}`);
        if (documentClients[docId].size === 0) {
          delete documentClients[docId];
        }
      });

    })
    .catch(err => {
      console.error('Error finding document:', err);
      ws.close(1011, 'Server error');
    });
});



// JWT Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Signup
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });
    res.status(201).json({ success: true, user: { email: user.email } });
  } catch (err) {
    res.status(400).json({ error: 'Email already in use' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Token refresh endpoint
app.post('/api/refresh-token', authenticate, async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticate middleware passed)
    // Generate a new token with the same payload
    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email }, 
      SECRET, 
      { expiresIn: '1h' }
    );
    res.json({ token: newToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Validate token endpoint
app.get('/api/validate-token', authenticate, async (req, res) => {
  try {
    // If we reach here, the token is valid
    res.json({ valid: true, user: { id: req.user.id, email: req.user.email } });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Create a document
app.post('/api/documents', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body; 

    const newDoc = new Document({
      title: title,
      content: content || '', 
      owner: req.userId,
    });

    await newDoc.save();
    res.status(201).json(newDoc); 
  } catch (err) {
    console.error('Failed to create doc:', err); 
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Get all documents (owned or shared)
app.get('/api/documents', authenticate, async (req, res) => {
  const userId = req.user.id;
  const ownedDocs = await prisma.document.findMany({
    where: { 
      ownerId: userId,
      type: 'document'
    },
    include: { pages: true },
  });
  const sharedDocs = await prisma.document.findMany({
    where: { 
      shares: { some: { userId } },
      type: 'document'
    },
    include: { pages: true },
  });
  res.json([...ownedDocs, ...sharedDocs]);
});


// Get a single document with all its pages
app.get('/api/documents/:docId', authenticate, async (req, res) => {
  const { docId } = req.params;
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { pages: { orderBy: { pageIndex: 'asc' } } },
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Optional: check if the user has access (owner or shared)
    const userId = req.user.id;
    if (doc.ownerId !== userId) {
      const shared = await prisma.documentShare.findFirst({
        where: { documentId: docId, userId },
      });
      if (!shared) return res.status(403).json({ error: 'Access denied' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

app.patch('/api/documents/:docId', authenticate, async (req, res) => {
  const { docId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const updated = await prisma.document.update({
      where: { id: docId },
      data: { title },
    });

    await esClient.index({
      index: 'documents',
      id: docId,
      body: {
        docId,
        userId: req.user.id,
        title,
        content: '...', // add full document content
        updatedAt: new Date(),
      }
    });
    // Update Elasticsearch index
    await esClient.update({
      index: 'documents',
      id: docId,
      body: {
        doc: { title },
      },
    });

    res.json({ message: 'Title updated', document: updated });
  } catch (err) {
    console.error('❌ Failed to update title:', err);
    res.status(500).json({ error: 'Failed to update title' });
  }
});



// Create a new page in a document
// Add a new page to a document
app.post('/api/documents/:docId/pages', authenticate, async (req, res) => {
  const { docId } = req.params;
  const { content } = req.body;

  try {
    // Count existing pages to determine next page index
    const existingPages = await prisma.page.findMany({
      where: { documentId: docId },
    });

    const nextIndex = existingPages.length;

    const newPage = await prisma.page.create({
      data: {
        documentId: docId,
        pageIndex: nextIndex,
        content,
      },
    });

    res.status(201).json(newPage);
  } catch (err) {
    console.error('Error creating new page:', err);
    res.status(500).json({ error: 'Failed to create new page' });
  }
});


app.delete('/api/documents/:docId/pages/:pageIndex', authenticate, async (req, res) => {
  const { docId, pageIndex } = req.params;
  try {
    await prisma.page.delete({
      where: { documentId_pageIndex: { documentId: docId, pageIndex: parseInt(pageIndex) } },
    });

    res.json({ message: 'Page deleted' });
  } catch (err) {
    console.error('Error deleting page:', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});



// Update a page
app.put('/api/documents/:docId/pages/:pageIndex', authenticate, async (req, res) => {
  const { docId, pageIndex } = req.params;
  const { content } = req.body;
  try {
    await prisma.page.upsert({
      where: {
        documentId_pageIndex: {
          documentId: docId,
          pageIndex: parseInt(pageIndex),
        },
      },
      update: { content },
      create: {
        documentId: docId,
        pageIndex: parseInt(pageIndex),
        content,
      },
    });
    res.json({ message: 'Page saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save page' });
  }
});


// Invite user to document (existing or future user)
app.post('/api/documents/:id/invite', authenticate, async (req, res) => {
  const { email } = req.body;
  const documentId = req.params.id;
  const inviterId = req.user.id;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { owner: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.ownerId !== inviterId) {
      return res.status(403).json({ error: 'Only owner can invite users' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Already user? Add to DocumentShare
      await prisma.documentShare.upsert({
        where: {
          documentId_userId: {
            documentId,
            userId: existingUser.id,
          },
        },
        update: { accepted: true },
        create: {
          documentId,
          userId: existingUser.id,
          accepted: true,
        },
      });

      return res.json({ message: 'User added to document' });
    } else {
      // Not a user? Just mock for now
      return res.json({ message: 'Invitation sent (mock)' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});



app.get('/api/search-docs', authenticate, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const result = await esClient.search({
      index: 'documents',
      size: 10,
      query: {
        bool: {
          must: {
            multi_match: {
              query,
              fields: ['title^2', 'content'],
              fuzziness: 'auto',
            }
          },
          filter: {
            term: { userId: req.user.id }
          }
        }
      }
    });

    const hits = result.hits.hits.map(hit => ({
      docId: hit._source.docId,
      title: hit._source.title,
      snippet: hit._source.content.slice(0, 150),
      updatedAt: hit._source.updatedAt,
    }));

    res.json(hits);
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});


///delete a document

app.delete('/api/documents/:docId', authenticate, async (req, res) => {
  const { docId } = req.params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this document' });
    }

    // Delete associated pages first to avoid foreign key constraint errors
    await prisma.page.deleteMany({
      where: { documentId: docId },
    });

    // Delete shared references
    await prisma.documentShare.deleteMany({
      where: { documentId: docId },
    });

    // Delete invitations
    await prisma.invitation.deleteMany({
      where: { documentId: docId },
    });

    // Delete the document itself
    await prisma.document.delete({
      where: { id: docId },
    });

    // Optionally delete from Elasticsearch
    try {
      await esClient.delete({
        index: 'documents',
        id: docId,
      });
    } catch (esErr) {
      console.warn('Elasticsearch delete failed:', esErr.meta?.body?.error || esErr.message);
    }

    res.status(200).json({ message: 'Document deleted successfully' });

  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Image upload endpoint

// 🎓 LEARNING: Multer Configuration
// Multer is a middleware for handling multipart/form-data (file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🎓 LEARNING: Create Upload Directory
    // Create a directory to store uploaded images
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 🎓 LEARNING: Unique Filename Generation
    // Generate unique filename to prevent conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // 🎓 LEARNING: File Type Validation
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

app.post('/api/upload-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // 🎓 LEARNING: File Information
    // req.file contains information about the uploaded file
    const { filename, originalname, mimetype, size } = req.file;
    
    // 🎓 LEARNING: Generate Public URL
    // In production, you'd upload to cloud storage and get a public URL
    // For now, we'll serve files from our server
    const imageUrl = `http://localhost:3000/uploads/${filename}`;
    
    console.log(`✅ Image uploaded: ${originalname} -> ${filename}`);
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: filename,
      originalName: originalname,
      size: size
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// 🎓 LEARNING: Error Handling for Multer
// Handle multer errors (file too large, wrong type, etc.)
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// 🎓 LEARNING: Serve Uploaded Files
// This endpoint serves the uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/api/test', (req, res) => {
  res.json({ message: "Server is working!" });
});

// Test image upload endpoint
app.get('/api/test-upload', (req, res) => {
  res.json({ 
    message: "Image upload endpoint is available",
    endpoint: "/api/upload-image",
    method: "POST",
    requires: ["Authorization header", "image file in FormData"]
  });
});



// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket server running on ws://localhost:3001`);
}
);