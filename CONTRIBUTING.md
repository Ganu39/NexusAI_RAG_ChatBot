# Contributing to NexusAI

Thank you for your interest in contributing to NexusAI! We welcome and appreciate contributions from the community, whether you are fixing a bug, improving documentation, or adding major new features.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Code Contributions](#code-contributions)
- [Development Setup](#-development-setup)
- [Development Workflow Cycle](#-development-workflow-cycle)
- [Branch Naming Convention](#-branch-naming-convention)
- [Commit Message Format](#-commit-message-format)
- [Pull Request Process](#-pull-request-process)
- [Code Style Guidelines](#-code-style-guidelines)

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues to make sure the problem hasn't already been reported. When filing a bug report, include:

- A clear and descriptive title
- Steps to reproduce the problem
- Expected vs actual behavior
- Screenshots or log snippets if applicable
- Your environment details (OS, Node.js version, Python version, Browser)

### Suggesting Features

Feature requests are tracked as GitHub issues. When suggesting a feature, please provide:

- A clear title and detailed summary of the feature
- Use cases and rationale for why this feature would benefit users
- Proposed API design or visual sketches (if applicable)

### Code Contributions

1. Fork the repository and create a new branch from `main`.
2. Implement your changes, ensuring code matches our style guidelines.
3. Write or update tests covering your changes.
4. Ensure all tests and linters pass before submitting a Pull Request.

---

## 🛠️ Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/RAG_chatbot.git
   cd RAG_chatbot
   ```

2. **Set up Frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up Backend:**
   ```bash
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Copy `.env.example` to `.env` in the root directory and update required settings:
   ```bash
   cp .env.example .env
   ```

---

## 🔄 Development Workflow Cycle

NexusAI adheres to a structured, wave-based AI development cycle. For details on phase planning, subagent execution, and test verification, refer to the **[Standard Workflow Guide](docs/WORKFLOW.md)**.

---

## 🌿 Branch Naming Convention

We follow a structured branch naming convention:

- `feature/<short-description>` — New features or improvements (e.g., `feature/faiss-index-caching`)
- `bugfix/<short-description>` — Non-urgent bug fixes (e.g., `bugfix/chat-scroll-jump`)
- `hotfix/<short-description>` — Urgent production fixes (e.g., `hotfix/auth-token-expiry`)
- `docs/<short-description>` — Documentation updates (e.g., `docs/update-api-spec`)
- `refactor/<short-description>` — Code refactoring without functional changes (e.g., `refactor/rag-service`)

---

## 📝 Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Supported Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, missing semi-colons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process, dependency updates, or tool configurations

### Example Commit Messages:
```bash
feat(rag): add support for streaming responses via SSE
fix(auth): resolve JWT expiration validation issue
docs(readme): add docker deployment instructions
```

---

## 🔀 Pull Request Process

1. **Keep PRs Focused:** Keep your pull requests small and focused on a single responsibility.
2. **Update Documentation:** Ensure any new options, features, or configurations are properly documented.
3. **Verify Build & Tests:** Ensure tests pass locally:
   - Frontend: `npm run lint` & `npm run test`
   - Backend: `pytest`
4. **Submit PR:** Create a pull request targeting the `main` branch. Provide a concise summary of changes and reference related issue numbers (e.g., `Closes #42`).
5. **Code Review:** Address any reviewer feedback promptly. Once approved, a maintainer will merge your PR.

---

## 🎨 Code Style Guidelines

- **TypeScript / React (Frontend):**
  - Use functional components with hooks.
  - Follow ESLint & Prettier configurations.
  - Maintain explicit TypeScript types (avoid `any`).

- **Python / FastAPI (Backend):**
  - Follow PEP 8 style guidelines.
  - Use type hints for all function parameters and return values.
  - Format code using Black or Ruff.

---

Thank you for making NexusAI better for everyone! 🚀
