# CollabSpace 📄

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-orange.svg)](CONTRIBUTING.md)

> A real-time collaborative document editor built with React, Node.js, and WebSockets. CollabSpace allows multiple users to edit documents simultaneously with features like rich text editing, image handling, page management, and real-time synchronization.

## 🌟 Why CollabSpace?

- **🚀 Real-time Collaboration** - Multiple users can edit documents simultaneously
- **📝 Rich Text Editing** - Full-featured editor with formatting, images, and more
- **🔒 Open Source** - Completely free and open source with MIT license
- **🛠️ Developer Friendly** - Well-documented codebase with clear APIs
- **📱 Modern Stack** - Built with the latest technologies and best practices
- **🏆 Competing with Giants** - Taking on Google Docs, Notion, and other big players with open source alternatives
- **💝 Community Driven** - Every contribution, no matter how small, makes a difference

## ✨ Features

### 🔐 Authentication & User Management
- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- Token-based authentication with refresh capabilities
- Protected routes and API endpoints

### 📝 Document Management
- Create, edit, and delete documents
- Multi-page document support
- Document sharing and collaboration
- User invitation system
- Document search with Elasticsearch integration

### ✏️ Rich Text Editor
- Real-time collaborative editing with WebSockets
- Rich text formatting (bold, italic, underline, etc.)
- Text and background color support
- Undo/redo functionality
- Auto-save with debounced updates
- LaTeX rendering support

### 🖼️ Image Handling
- Drag & drop image upload
- Paste image from clipboard
- Image resizing with corner handles
- Image positioning and dragging
- Image toolbar with delete, reset, and size controls
- Server-side image storage with multer

### 📄 Page Management
- Add/delete pages dynamically
- Page navigation with sidebar controls
- Page-specific content management
- Real-time page synchronization

### 🔍 Search & Discovery
- Full-text search across documents
- Elasticsearch-powered search engine
- Document filtering and organization
- Search results with snippets

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **KaTeX** - LaTeX rendering
- **WebSocket** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **WebSocket** - Real-time communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Elasticsearch** - Search engine

### Database Schema
- **Users** - User accounts and authentication
- **Documents** - Document metadata and ownership
- **Pages** - Individual document pages with content
- **DocumentShare** - Document sharing relationships
- **Invitations** - User invitation system

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/collabspace.git
   cd collabspace
   ```

2. **Set up backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Edit with your database credentials
   npx prisma generate
   npx prisma db push
   npm start
   ```

3. **Set up frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:3000

For detailed setup instructions, troubleshooting, and known issues, see [SETUP.md](SETUP.md).

## 📁 Project Structure

```
clean-collabSpace/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Database migrations
│   │   └── schema.prisma       # Database schema
│   ├── generated/              # Prisma generated client
│   ├── uploads/               # Image uploads directory
│   ├── server.js              # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Editor.jsx     # Main editor component
│   │   │   ├── EditorToolbar.jsx
│   │   │   └── PageControls.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditorPage.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── context/          # React context
│   │   │   └── AuthContext.js
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility functions
│   └── public/
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/refresh-token` - Token refresh
- `GET /api/validate-token` - Token validation

### Documents
- `GET /api/documents` - Get user's documents
- `POST /api/documents` - Create new document
- `GET /api/documents/:docId` - Get specific document
- `PATCH /api/documents/:docId` - Update document title
- `DELETE /api/documents/:docId` - Delete document

### Pages
- `GET /api/documents/:docId/pages` - Get document pages
- `POST /api/documents/:docId/pages` - Add new page
- `PUT /api/documents/:docId/pages/:pageIndex` - Update page content
- `DELETE /api/documents/:docId/pages/:pageIndex` - Delete page

### Collaboration
- `POST /api/documents/:id/invite` - Invite user to document
- `GET /api/search-docs` - Search documents

### File Upload
- `POST /api/upload-image` - Upload image file

## 🌐 WebSocket Events

### Client to Server
- `update` - Send content updates
- `add-page` - Add new page notification

### Server to Client
- `update` - Receive content updates from other users
- `add-page` - Receive new page notifications

## 🎨 Editor Features

### Text Formatting
- Bold, italic, underline
- Text color and background highlighting
- Font size and family options
- Text alignment

### Image Management
- Drag & drop image upload
- Image resizing with corner handles
- Image positioning and movement
- Image deletion and reset

### Page Operations
- Add new pages (Ctrl+Enter)
- Delete pages
- Navigate between pages
- Page-specific undo/redo

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- File upload validation
- CORS configuration
- Input sanitization

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the build folder to your hosting service
3. Configure API endpoints for production

## 🤝 Contributing

We welcome contributions from the community! **Every contribution matters** - whether it's fixing a typo, reporting a bug, or adding a major feature. We're building an open-source alternative to Google Docs, Notion, and other proprietary solutions.

For detailed contribution guidelines, development workflow, and coding standards, please see [CONTRIBUTING.md](CONTRIBUTING.md).

### Ways to Contribute
- 🐛 **Bug Reports** - Found a bug? Open an issue!
- 🔧 **Fix Existing Bugs** - Fix bugs and create pull requests
- ✨ **Feature Requests** - Have an idea? Let us know!
- 🔧 **Code Contributions** - Fix bugs or add features
- 📚 **Documentation** - Improve docs and examples
- 🧪 **Testing** - Help us test and improve quality
- 💬 **Community Support** - Help others in discussions and issues
- 🌟 **Star & Share** - Star the repo and share with others

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who help make CollabSpace better
- Built with amazing open source technologies
- Inspired by the collaborative editing community

## 🐛 Known Issues & Bug Fixes Needed

We're actively working to improve CollabSpace! Here are some known issues that need attention:

- **Elasticsearch integration** is optional and may need configuration
- **Image uploads** are stored locally (consider cloud storage for production)
- **WebSocket connections** may need reconnection logic for production
- **Mobile responsiveness** could be improved
- **Error handling** in some edge cases needs enhancement

**Found a bug? Fix it and create a pull request!** Even small fixes help us compete with Google Docs and other big players. Every contribution makes CollabSpace better! 🚀

## 🔮 Roadmap

We're always working on new features! Here's what's coming:

### 🎯 Upcoming Features
- [ ] Real-time cursor tracking
- [ ] User presence indicators  
- [ ] Document version history
- [ ] Real-time comments and annotations
- [ ] Export to PDF/Word formats
- [ ] Mobile responsive design improvements
- [ ] Advanced search filters
- [ ] Document templates
- [ ] Dark mode support
- [ ] Plugin system for extensions

### 🏗️ Architecture Improvements
- [ ] Microservices architecture
- [ ] Redis for session management
- [ ] CDN for image storage
- [ ] Docker containerization
- [ ] Kubernetes deployment configs

## 📞 Community & Support

### Getting Help
- 📖 **Documentation** - Check the README and project documentation
- 🐛 **Bug Reports** - Open an issue in the repository
- 💬 **Discussions** - Use GitHub Issues for questions and discussions
- 💡 **Feature Requests** - Open an issue with the feature request

### Community Guidelines
- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## 🌟 Show Your Support

If you find CollabSpace useful, please consider:

- ⭐ **Starring** the repository - helps us compete with Google Docs!
- 🍴 **Forking** and contributing - every contribution counts!
- 📢 **Sharing** with others - spread the word about open source alternatives
- 🐛 **Reporting** bugs and issues - help us improve quality
- 💡 **Suggesting** new features - help us build the best collaborative editor
- 💬 **Joining discussions** - share ideas and help others
- 🏆 **Helping us compete** - together we can build something better than proprietary solutions

---

<div align="center">

**CollabSpace** - Where collaboration meets creativity! 🚀

*Taking on Google Docs, Notion, and other giants with open source power!*

Made with ❤️ by the open source community


**Every contribution matters - help us build the future of collaborative editing!** 🌟

</div>
