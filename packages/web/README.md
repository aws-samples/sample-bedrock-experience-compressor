# Experience Compressor Web App

Single entry point web application for all roles (Technician, Manager, Expert).

## Features

### Technician (Implemented ✅)
- Role selection landing page
- Task calendar with search/filter and quick stats
- Runbook viewer (full document view)
- Completion report with issue checkboxes and emoji rating
- Photo upload with compression
- View submitted reports

### Manager (TODO)
- Task creation and assignment
- Team management
- Analytics dashboard

### Expert (TODO)
- Runbook management
- AI-proposed updates review
- Approval workflow

## Tech Stack
- React 18 + TypeScript
- Cloudscape Design System
- Cognito authentication
- Vite
- React Router

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Quick Suite Chatbot

The chatbot uses Amazon Quick Suite Agent with S3 integration for runbook knowledge base.

**Setup Required:**
1. Create Quick Suite Agent in AWS Console
2. Configure S3 integration with runbooks bucket
3. Add CloudFront domain to Quick Suite approved domains
4. Update embed code in `src/components/Chatbot.tsx` with your agent URL

**Note:** Each deployment requires its own Quick Suite agent embed code (not generated through CDK).

## Structure
```
src/
├── pages/
│   ├── RoleSelection.tsx
│   ├── Login.tsx
│   ├── technician/
│   ├── manager/
│   └── expert/
├── components/
└── services/
```
