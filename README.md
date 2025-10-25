# CollabSpace 📄

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-orange.svg)](https://github.com/yourusername/collabspace)

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
- **TipTap** - Rich text editor framework
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

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/collabspace.git
   cd collabspace
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/collabspace"
   JWT_SECRET="your-secret-key"
   PORT=3000
   ```

5. **Set up the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

### Optional: Elasticsearch Setup
For search functionality, install and run Elasticsearch:
```bash
# Using Docker
docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.15.0
```

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

We welcome contributions from the community! **Every contribution matters** - whether it's fixing a typo, reporting a bug, or adding a major feature. We're building an open-source alternative to Google Docs, Notion, and other proprietary solutions, and we need your help!

### Ways to Contribute
- 🐛 **Bug Reports** - Found a bug? Open an issue! Even small bugs matter.
- 🔧 **Fix Existing Bugs** - Found a bug in the code? Fix it and create a pull request! Help us improve quality.
- ✨ **Feature Requests** - Have an idea? Let us know! We want to compete with the best.
- 🔧 **Code Contributions** - Fix bugs or add features. Every line of code helps!
- 📚 **Documentation** - Improve docs and examples. Help others get started.
- 🧪 **Testing** - Help us test and improve quality. Find edge cases!
- 💬 **Community Support** - Help others in discussions and issues.
- 🌟 **Star & Share** - Star the repo and share with others who might benefit.

### Development Workflow

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/collabspace.git
   cd collabspace
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill out the PR template
   - Wait for review and feedback

### Code Style Guidelines
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code formatting
- Write tests for new functionality
- Update documentation for API changes

### Issue Guidelines
- Use the issue templates
- Provide clear reproduction steps
- Include environment details
- Be respectful and constructive

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
- 📖 **Documentation** - Check our [docs](https://github.com/yourusername/collabspace/wiki)
- 🐛 **Bug Reports** - [Open an issue](https://github.com/yourusername/collabspace/issues)
- 💬 **Discussions** - Join our [GitHub Discussions](https://github.com/yourusername/collabspace/discussions)
- 💡 **Feature Requests** - [Request a feature](https://github.com/yourusername/collabspace/issues/new?template=feature_request.md)

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
