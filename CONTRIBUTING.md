# Contributing to CollabSpace

Thank you for your interest in contributing to CollabSpace! 🎉 We welcome contributions from the community and are grateful for your help in making this project better.

**We're building an open-source alternative to Google Docs, Notion, and other proprietary solutions!** Every contribution, no matter how small, helps us compete with the big players and build something truly community-driven.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Git
- Basic knowledge of React and Node.js

### Development Setup

1. **Fork the repository**
   - Click the "Fork" button on the GitHub repository page
   - Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/collabspace.git
   cd collabspace
   ```

2. **Set up the development environment**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/collabspace"
   JWT_SECRET="your-secret-key"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

## How to Contribute

**Remember: Every contribution matters!** Whether you're fixing a typo, reporting a small bug, or adding a major feature - you're helping us compete with Google Docs and other big players. We're building something amazing together! 🚀

### 🐛 Bug Reports

When reporting bugs, please include:

- **Clear description** of the bug (even small bugs help us compete with Google Docs!)
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, browser)
- **Screenshots** if applicable

**Every bug report helps us build a better alternative to proprietary solutions!**

### ✨ Feature Requests

For new features, please:

- **Check existing issues** to avoid duplicates
- **Describe the feature** clearly (help us build features that rival Google Docs!)
- **Explain the use case** and benefits
- **Consider implementation** complexity

**Help us build the best collaborative editor that can compete with the big players!**

### 🔧 Code Contributions

1. **Find an issue** to work on or create a new one
2. **Look for existing bugs** in the codebase - even small fixes help!
3. **Comment on the issue** to let others know you're working on it
4. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes:
   git checkout -b fix/bug-description
   ```
5. **Make your changes** following our coding standards
6. **Test your changes** thoroughly
7. **Commit your changes** with clear commit messages
8. **Push to your fork** and create a pull request

**Pro tip:** Found a bug while exploring the code? Fix it and submit a PR! Even small bug fixes help us compete with Google Docs! 🚀

### 🐛 Bug Hunting & Fixing

**We need your help finding and fixing bugs!** Here's how you can help:

1. **Explore the codebase** - Look through the code and test different features
2. **Test edge cases** - Try unusual inputs, rapid clicking, network issues
3. **Check different browsers** - Test in Chrome, Firefox, Safari, Edge
4. **Test on different devices** - Mobile, tablet, desktop
5. **Look for performance issues** - Slow loading, memory leaks, etc.
6. **Check error handling** - What happens when things go wrong?

**When you find a bug:**
- **Report it** in an issue (even if you can't fix it)
- **Fix it yourself** if you can - create a PR!
- **Document the steps** to reproduce it
- **Test your fix** thoroughly

**Every bug fix makes CollabSpace more competitive with Google Docs!** 🏆

## Development Setup

### Running the Application

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend development server**:
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**:
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:3000
   - WebSocket: ws://localhost:3001

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

## Pull Request Process

### Before Submitting

- [ ] **Code follows** the project's coding standards
- [ ] **Self-review** your code
- [ ] **Comments** added for complex logic
- [ ] **Tests** added for new functionality
- [ ] **Documentation** updated if needed
- [ ] **No console.logs** or debug code left in
- [ ] **Build passes** without errors

### PR Guidelines

1. **Use descriptive titles** for your PRs
2. **Reference issues** using keywords like "Fixes #123"
3. **Keep PRs focused** - one feature/fix per PR
4. **Include screenshots** for UI changes
5. **Update documentation** for API changes
6. **Add tests** for new features

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Edge cases considered

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Coding Standards

### JavaScript/TypeScript

- Use **meaningful variable names**
- Add **comments** for complex logic
- Follow **consistent indentation** (2 spaces)
- Use **const/let** instead of var
- **Prefer arrow functions** for callbacks
- Use **template literals** for string interpolation

### React Components

- Use **functional components** with hooks
- **Extract custom hooks** for reusable logic
- Use **meaningful component names**
- **Keep components small** and focused
- Use **prop-types** or TypeScript for type safety

### CSS/Styling

- Use **Tailwind CSS** utility classes
- **Avoid inline styles** when possible
- Use **semantic class names**
- **Mobile-first** responsive design

### Git Commit Messages

Use conventional commit format:

```
type(scope): description

Examples:
feat(editor): add image resizing functionality
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
test(api): add tests for document endpoints
```

## Issue Guidelines

### Bug Reports

Use this template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 16.14.0]
- Database: [e.g. PostgreSQL 13]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use this template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context or screenshots.
```

## Getting Help

- 💬 **GitHub Discussions** - For questions and general discussion
- 🐛 **Issues** - For bug reports and feature requests
- 📖 **Documentation** - Check the wiki for detailed guides
- 💡 **Discord/Slack** - Join our community chat (if available)

## Recognition

Contributors will be recognized in:

- 📝 **README** - Listed as contributors
- 🏆 **Release notes** - Mentioned in changelog
- 🎉 **Community highlights** - Featured in community updates

Thank you for contributing to CollabSpace! 🚀
